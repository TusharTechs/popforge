import { useEffect, useRef, useState } from 'react';
import { Music2, Play, Pause } from 'lucide-react';
import { soundGarden } from './audio';
const tracks = [
  { id: 'moonlit-desk', name: 'Moonlit Desk', vibe: 'Soft keys · 72 BPM', icon: '☾' },
  { id: 'peach-tea', name: 'Peach Tea', vibe: 'Warm groove · 84 BPM', icon: '☀' },
  { id: 'aurora-drift', name: 'Aurora Drift', vibe: 'Floating ambient · 60 BPM', icon: '✦' },
];
export function MusicLibrary({ quiet }: { quiet: boolean }) {
  const [track, setTrack] = useState(tracks[0]),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (quiet) {
      audio.current?.pause();
      setPlaying(false);
    }
  }, [quiet]);
  useEffect(
    () =>
      soundGarden.subscribe(() => {
        if (soundGarden.getState().enabled) {
          audio.current?.pause();
          setPlaying(false);
        }
      }),
    [],
  );
  const play = async () => {
    if (quiet) return;
    try {
      await soundGarden.disable();
      await audio.current?.play();
      setError('');
    } catch {
      setError('Playback could not start. Press play to try again.');
    }
  };
  return (
    <section className="music-library">
      <div className="music-heading">
        <Music2 size={20} />
        <div>
          <h3>A soundtrack for good company.</h3>
          <p>Three original instrumental loops, included for streams, VODs and videos.</p>
        </div>
      </div>
      <div className="music-tracks">
        {tracks.map((t) => (
          <button
            className={t.id === track.id ? 'selected' : ''}
            key={t.id}
            onClick={() => {
              audio.current?.pause();
              setPlaying(false);
              setTrack(t);
            }}
          >
            <span>{t.icon}</span>
            <strong>{t.name}</strong>
            <small>{t.vibe}</small>
          </button>
        ))}
      </div>
      <audio
        ref={audio}
        src={`/music/${track.id}.wav`}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError('This track could not load. Try reloading the page.')}
      />
      <div className="music-playbar">
        <button
          className="button primary"
          disabled={quiet}
          onClick={() => (playing ? audio.current?.pause() : void play())}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}{' '}
          {playing ? 'Pause' : `Play ${track.name}`}
        </button>
        <label>
          Track volume
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="35"
            onChange={(e) => {
              if (audio.current) audio.current.volume = Number(e.target.value) / 100;
            }}
            ref={(el) => {
              if (el && audio.current) audio.current.volume = Number(el.value) / 100;
            }}
          />
        </label>
        <a href={`/music/${track.id}.wav`} download>
          Download WAV
        </a>
      </div>
      {error && <p role="alert">{error}</p>}
      <p className="music-note">
        {quiet ? 'Quiet mode is on. ' : ''}Original synthesized music ·{' '}
        <a href="/music/LICENSE.txt" target="_blank" rel="noreferrer">
          Usage permission
        </a>
        . Start playback in the OBS sound source to include it in your stream.
      </p>
      <details>
        <summary>Explore other creator music</summary>
        <p>
          NCS and NEFFEX have creator-use policies. Check the exact track and current terms before
          use; external music is not bundled with PopForge.
        </p>
        <a href="https://ncs.io/usage-policy" target="_blank" rel="noreferrer">
          NCS usage and credit policy ↗
        </a>
        <a href="https://www.neffexmusic.com/content-creators" target="_blank" rel="noreferrer">
          NEFFEX creator resources ↗
        </a>
      </details>
    </section>
  );
}
