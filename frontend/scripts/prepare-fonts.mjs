import fs from 'node:fs/promises';
import path from 'node:path';
const directory = path.resolve('src/app/fonts');
await fs.mkdir(directory, { recursive: true });
async function download(url, destination) {
  try { if ((await fs.stat(destination)).size > 1000) return; } catch {}
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error('Font download failed (' + response.status + '): ' + url);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1000 || buffer.subarray(0, 4).toString() !== 'wOF2') throw new Error('Expected WOFF2 from ' + url);
  await fs.writeFile(destination, buffer);
}
try {
  for (const [family, file] of [['clash-display', 'clash-display.woff2'], ['satoshi', 'satoshi.woff2']]) {
    const destination = path.join(directory, file);
    try { if ((await fs.stat(destination)).size > 1000) continue; } catch {}
    const response = await fetch('https://api.fontshare.com/v2/css?f[]=' + family + '@1&display=swap', { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error('Fontshare returned ' + response.status);
    const css = await response.text();
    const match = css.match(/url\(['"]?(https:[^)'"]+\.woff2[^)'"]*)['"]?\)/);
    if (!match) throw new Error('No WOFF2 found for ' + family);
    await download(match[1], destination);
  }
  await download('https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/webfonts/JetBrainsMono-Regular.woff2', path.join(directory, 'jetbrains-mono.woff2'));
  console.log('Fonts ready for next/font/local.');
} catch (error) {
  console.error('Font setup: ' + error.message);
  console.error('Internet access is needed once. Or place licensed WOFF2 files in src/app/fonts using the filenames in README.md.');
  process.exitCode = 1;
}
