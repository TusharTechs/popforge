import { useEffect, useState } from 'react';
const themes = [
  { id: 'forest', name: 'Forest', color: '#6d9b82' },
  { id: 'plum', name: 'Plum', color: '#ad86b6' },
  { id: 'ocean', name: 'Ocean', color: '#75a8c3' },
  { id: 'charcoal', name: 'Charcoal', color: '#676f65' },
];
export function StudioTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const v = localStorage.getItem('popforge.studio.theme');
      return themes.some((t) => t.id === v) ? v! : 'forest';
    } catch {
      return 'forest';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.studioTheme = theme;
    try {
      localStorage.setItem('popforge.studio.theme', theme);
    } catch {}
    return () => {
      delete document.documentElement.dataset.studioTheme;
    };
  }, [theme]);
  return (
    <div className="studio-theme-picker">
      <span>STUDIO COLOR</span>
      <div role="group" aria-label="Studio background color">
        {themes.map((t) => (
          <button
            type="button"
            key={t.id}
            aria-pressed={theme === t.id}
            onClick={() => setTheme(t.id)}
          >
            <i style={{ background: t.color }} />
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
