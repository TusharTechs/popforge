import { MusicLibrary } from './MusicLibrary';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  AudioLines,
  Check,
  ExternalLink,
  Headphones,
  Music2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundGarden } from './audio';
import { MOODS, type LoungeState } from '../shared/lounge';

export function useSoundAtmosphere(lounge: LoungeState) {
  const last = useRef<string | null>(null);
  useEffect(
    () => soundGarden.setAtmosphere(lounge.mood, lounge.energy),
    [lounge.mood, lounge.energy],
  );
  useEffect(() => {
    const fx = lounge.effects.at(-1);
    if (fx && last.current !== fx.id) {
      if (last.current && Date.now() - fx.at < 1500) soundGarden.chime(fx.kind);
      last.current = fx.id;
    }
  }, [lounge.effects]);
}
export function AudioDock({
  lounge,
  sourceUrl,
  standalone = false,
}: {
  lounge: LoungeState;
  sourceUrl?: string;
  standalone?: boolean;
}) {
  const audio = useSyncExternalStore(soundGarden.subscribe, soundGarden.getState);
  const mood = MOODS.find((m) => m.id === lounge.mood)!;
  return (
    <section
      className={`audio-dock ${standalone ? 'standalone' : ''}`}
      aria-label="Ambient sound mixer"
    >
      <div className="sound-title">
        <span className="sound-icon">
          <Headphones size={18} />
        </span>
        <div>
          <h3>The sound of being here.</h3>
          <p>{mood.name} · Original procedural soundscape</p>
        </div>
        <span className={`sound-equalizer ${audio.running ? 'playing' : ''}`} aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} />
          ))}
        </span>
        <button
          className={`button ${audio.running ? 'secondary' : 'primary'}`}
          onClick={() => (audio.enabled ? soundGarden.disable() : soundGarden.enable())}
        >
          {audio.enabled ? <Pause size={14} /> : <Play size={14} />}{' '}
          {audio.enabled ? 'Pause sound' : 'Enable sound'}
        </button>
      </div>
      <div className="sound-mix">
        {(['master', 'music', 'rain', 'wind'] as const).map((key) => (
          <label key={key}>
            <span>
              {key === 'master' ? (
                <Volume2 size={13} />
              ) : key === 'music' ? (
                <Music2 size={13} />
              ) : (
                <AudioLines size={13} />
              )}
              {{ master: 'Volume', music: 'Soft keys', rain: 'Rainfall', wind: 'Night air' }[key]}
              <b>{Math.round(audio.mix[key] * 100)}%</b>
            </span>
            <input
              type="range"
              aria-label={`${key} volume`}
              min="0"
              max="100"
              value={Math.round(audio.mix[key] * 100)}
              onChange={(e) => soundGarden.setMix({ [key]: Number(e.target.value) / 100 })}
            />
          </label>
        ))}
      </div>
      <div className="sound-footer">
        <button
          className={`chime-toggle ${audio.mix.chimes ? 'on' : ''}`}
          role="switch"
          aria-checked={audio.mix.chimes}
          onClick={() => soundGarden.setMix({ chimes: !audio.mix.chimes })}
        >
          <span>{audio.mix.chimes && <Check size={10} />}</span>Gentle reaction chimes
        </button>
        <span>
          {lounge.energy === 'quiet' ? (
            <>
              <VolumeX size={12} />
              Quiet mode · all sound paused
            </>
          ) : audio.running ? (
            <>
              <span className="status-dot" />
              Playing in this browser
            </>
          ) : (
            <>Sound starts only when you press play</>
          )}
        </span>
      </div>
      <MusicLibrary quiet={lounge.energy === 'quiet'} />
      {audio.error && (
        <p className="sound-error" role="alert">
          {audio.error}
        </p>
      )}
      {sourceUrl && (
        <div className="sound-source-note">
          <MonitorGlyph />
          <p>
            For stream audio, add the{' '}
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              OBS sound source <ExternalLink size={10} />
            </a>{' '}
            and press Enable sound once using OBS Interact. Choose one playback surface to avoid
            doubled audio.
          </p>
        </div>
      )}
    </section>
  );
}
function MonitorGlyph() {
  return (
    <span className="sound-note-icon">
      <Headphones size={15} />
    </span>
  );
}
