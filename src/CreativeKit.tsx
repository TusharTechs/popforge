import { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { StudioSelect } from './StudioSelect';
const palettes = {
  meadow: ['#101c18', '#dffa9b'],
  lavender: ['#201c30', '#d6b7ff'],
  peach: ['#2a2020', '#ffc39c'],
};
export function CreativeKit() {
  const [theme, setTheme] = useState<keyof typeof palettes>('meadow'),
    [name, setName] = useState('A little good company'),
    [status, setStatus] = useState('');
  const [bg, accent] = palettes[theme];
  const cards = [
    ['starting', 'Starting soon', '1920 × 1080'],
    ['break', 'A little breather', '1920 × 1080'],
    ['ending', 'See you next chapter', '1920 × 1080'],
    ['webcam', 'Webcam frame', '1280 × 720 · transparent'],
    ['panel', 'About our community', '640 × 240'],
    ['thanks', 'Thanks for being here', '1920 × 1080'],
  ];
  const download = (id: string, title: string) => {
    const width = id === 'panel' ? 640 : id === 'webcam' ? 1280 : 1920,
      height = id === 'panel' ? 240 : id === 'webcam' ? 720 : 1080;
    const safe = (s: string) =>
      s.replace(
        /[<>&"']/g,
        (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!,
      );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${id === 'webcam' ? '' : `<rect width="100%" height="100%" fill="${bg}"/>`}<rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="32" fill="none" stroke="${accent}" stroke-width="4"/><circle cx="${width * 0.84}" cy="${height * 0.25}" r="${height * 0.11}" fill="${accent}" opacity=".14"/><text x="${width / 2}" y="${height * (id === 'webcam' ? 0.95 : 0.49)}" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-size="${id === 'webcam' ? 24 : width / 22}">${safe(id === 'webcam' ? name : title)}</text>${id === 'webcam' ? '' : `<text x="${width / 2}" y="${height * 0.65}" text-anchor="middle" fill="#e6e9e1" font-family="sans-serif" font-size="${width / 48}">${safe(name)}</text>`}</svg>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    a.download = `popforge-${id}-${theme}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setStatus(`${title} downloaded. Add it as an OBS image source.`);
  };
  return (
    <div className="creative-kit">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} /> MAKE THE WHOLE STREAM FEEL LIKE YOU
          </div>
          <h1>Your little creative studio.</h1>
          <p>Original, customizable artwork for your stream. Download and reuse freely.</p>
        </div>
      </div>
      <div className="kit-controls">
        <label>
          Channel name or tagline
          <input maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Color story
          <StudioSelect value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
            <option value="meadow">Moonlit meadow</option>
            <option value="lavender">Lavender dreams</option>
            <option value="peach">Peach afterglow</option>
          </StudioSelect>
        </label>
      </div>
      <div className="kit-grid">
        {cards.map(([id, title, size]) => (
          <article className="kit-card" key={id}>
            <div className={`kit-art kit-${id}`} style={{ background: bg, color: accent }}>
              <span>✦</span>
              <i />
              <h2>{id === 'webcam' ? name : title}</h2>
              {id !== 'webcam' && <p>{name}</p>}
            </div>
            <footer>
              <div>
                <strong>{title}</strong>
                <small>{size} · SVG</small>
              </div>
              <button
                className="button secondary"
                onClick={() => download(id, title)}
                aria-label={`Download ${title}`}
              >
                <Download size={15} />
                Download
              </button>
            </footer>
          </article>
        ))}
      </div>
      <p role="status" className="kit-status">
        {status || 'Editable SVG artwork · no attribution required · no third-party assets'}
      </p>
    </div>
  );
}
