import { writeFileSync } from 'node:fs';
// Original deterministic compositions and synthesis. No sampled recordings.
for (const [name, bpm, root, style] of [
  ['moonlit-desk', 72, 48, 0],
  ['peach-tea', 84, 53, 1],
  ['aurora-drift', 60, 50, 2],
]) {
  const rate = 22050,
    beat = 60 / bpm,
    seconds = beat * 64,
    n = Math.ceil(seconds * rate),
    a = new Float32Array(n);
  let seed = 42;
  const tone = (m, t, d, v, kind = 0) => {
    let f = 440 * 2 ** ((m - 69) / 12),
      start = Math.floor(t * rate),
      len = Math.floor(d * rate);
    for (let k = 0; k < len && start + k < n; k++) {
      let x = k / rate,
        en = Math.min(1, x / 0.035) * Math.exp(-x / (d * 0.35)) * Math.min(1, (d - x) / 0.12);
      a[start + k] +=
        v *
        en *
        (Math.sin(2 * Math.PI * f * x) +
          0.16 * Math.sin(4 * Math.PI * f * x) +
          (kind ? 0.08 * Math.sin(6 * Math.PI * f * x) : 0));
    }
  };
  for (let bar = 0; bar < 16; bar++) {
    let chord = [0, 5, 9, 7][bar % 4];
    for (const interval of [0, 7, 11, 16])
      tone(root + chord + interval, bar * 4 * beat, 4 * beat, 0.06);
    tone(root + chord - 12, bar * 4 * beat, 3.5 * beat, 0.12);
    for (let j = 0; j < 8; j++) {
      if ((j + bar) % 3 === 0) continue;
      tone(
        root + 12 + chord + [0, 7, 4, 11, 7, 16, 12, 4][(j + bar) % 8],
        (bar * 4 + j / 2) * beat,
        beat * 1.4,
        0.065,
        style,
      );
    }
    if (style !== 2)
      for (let j = 0; j < 4; j++) {
        const st = Math.floor((bar * 4 + j) * beat * rate);
        for (let k = 0; k < rate * 0.12 && st + k < n; k++) {
          const x = k / rate;
          seed = (1664525 * seed + 1013904223) >>> 0;
          const noise = (seed / 4294967296) * 2 - 1;
          a[st + k] +=
            (j % 2
              ? noise * 0.025
              : Math.sin(2 * Math.PI * (55 * x + 2 * (1 - Math.exp(-x * 40)))) * 0.08) *
            Math.exp(-x * 35);
        }
      }
  }
  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF');
  out.writeUInt32LE(36 + n * 2, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / rate, (n - i) / rate);
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i] * fade)) * 30000), 44 + i * 2);
  }
  writeFileSync(`public/music/${name}.wav`, out);
}
