import { writeFile } from 'node:fs/promises';
const report = {
  at: new Date().toISOString(),
  service: 'PopForge local companion',
  checks: [],
  limitations: [
    'A connected browser source does not prove OBS capture.',
    'This diagnostic does not send chat, invoke generation, or measure viewers.',
  ],
};
try {
  const response = await fetch('http://localhost:4317/api/bootstrap', {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Companion returned ' + response.status);
  const data = await response.json();
  report.checks = [
    { name: 'Local companion', passed: data.backend === true },
    { name: 'Twitch application configured', passed: data.twitch?.configured === true },
    { name: 'Broadcaster authorized', passed: data.twitch?.connected === true },
    { name: 'Twitch chat subscription listening', passed: data.twitch?.listening === true },
    { name: 'Real chat received in this connection', passed: !!data.twitch?.lastMessageAt },
    { name: 'Visual source open', passed: (data.sources?.visual ?? 0) > 0 },
    { name: 'Audio source open', passed: (data.sources?.audio ?? 0) > 0 },
    { name: 'Codex generation enabled', passed: data.codex === true },
  ];
} catch {
  report.checks = [{ name: 'Local companion reachable', passed: false }];
}
const output = JSON.stringify(report, null, 2) + '\n';
console.log(output);
const target = process.argv.indexOf('--output');
if (target >= 0 && process.argv[target + 1])
  await writeFile(process.argv[target + 1], output, { mode: 0o600 });
