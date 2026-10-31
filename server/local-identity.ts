import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';

const CredentialsSchema = z.object({
  clientId: z.string().min(1),
  userId: z.string().min(1),
  token: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().nullable(),
    scope: z.array(z.string()),
    expiresIn: z.number().nullable(),
    obtainmentTimestamp: z.number(),
  }),
});
export type RememberedTwitch = z.infer<typeof CredentialsSchema>;
export interface TwitchMemory {
  load(): RememberedTwitch | null;
  save(value: RememberedTwitch): void;
  clear(): void;
}
const IdentitySchema = z.object({
  version: z.literal(1),
  overlayToken: z.string().regex(/^[a-f0-9]{64}$/),
  twitch: CredentialsSchema.nullable(),
});

/** Local companion only. The encryption key stays in a separate, owner-only file.
 * This protects against accidentally sharing the state snapshot, not a compromised OS account.
 * Never copy this directory into a build or expose it through the web server. */
export class LocalIdentity implements TwitchMemory {
  private key: Buffer;
  private file: string;
  private value: z.infer<typeof IdentitySchema>;
  constructor(directory: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    chmodSync(directory, 0o700);
    this.file = path.join(directory, 'identity.enc');
    const keyFile = path.join(directory, 'identity.key');
    if (!existsSync(keyFile)) {
      if (existsSync(this.file))
        throw new Error(
          'PopForge cannot unlock its saved connection. Restore the identity key or move the identity files aside and reconnect.',
        );
      writeFileSync(keyFile, randomBytes(32), { flag: 'wx', mode: 0o600 });
    }
    chmodSync(keyFile, 0o600);
    this.key = readFileSync(keyFile);
    if (this.key.length !== 32)
      throw new Error('PopForge identity key is invalid. Restore the saved key before starting.');
    if (existsSync(this.file)) {
      chmodSync(this.file, 0o600);
      try {
        const packed = readFileSync(this.file);
        const decipher = createDecipheriv('aes-256-gcm', this.key, packed.subarray(0, 12));
        decipher.setAAD(Buffer.from('popforge-local-identity-v1'));
        decipher.setAuthTag(packed.subarray(12, 28));
        this.value = IdentitySchema.parse(
          JSON.parse(
            Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString(
              'utf8',
            ),
          ),
        );
      } catch {
        throw new Error(
          'PopForge could not read its saved connection. Restore the identity files before starting.',
        );
      }
    } else {
      this.value = { version: 1, overlayToken: randomBytes(32).toString('hex'), twitch: null };
      this.persist(this.value);
    }
  }
  private persist(next: typeof this.value) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from('popforge-local-identity-v1'));
    const data = Buffer.concat([cipher.update(JSON.stringify(next), 'utf8'), cipher.final()]);
    const temporary = this.file + '.tmp';
    writeFileSync(temporary, Buffer.concat([iv, cipher.getAuthTag(), data]), { mode: 0o600 });
    chmodSync(temporary, 0o600);
    renameSync(temporary, this.file);
    this.value = next;
  }
  get overlayToken() {
    return this.value.overlayToken;
  }
  load() {
    return this.value.twitch ? structuredClone(this.value.twitch) : null;
  }
  save(value: RememberedTwitch) {
    this.persist({ ...this.value, twitch: CredentialsSchema.parse(value) });
  }
  clear() {
    this.persist({ ...this.value, twitch: null });
  }
  rotateOverlay() {
    this.persist({ ...this.value, overlayToken: randomBytes(32).toString('hex') });
    return this.value.overlayToken;
  }
}
