import { StudioSelect } from './StudioSelect';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CloudRain,
  Coffee,
  Heart,
  HeartHandshake,
  Leaf,
  MessageCircle,
  Moon,
  Pause,
  Play,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Sunset,
  Timer,
  Trash2,
  VolumeX,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import type { Command, ForgeState } from '../shared/engine';
import {
  MOODS,
  BREAK_MESSAGES,
  jarProgress,
  type Mood,
  type EffectKind,
  type Energy,
} from '../shared/lounge';
import { SceneFrame } from './SceneFrame';
import { AudioDock } from './AudioDock';

type Props = {
  state: ForgeState;
  now: number;
  command: (c: Command, success?: string) => Promise<boolean>;
  demo: (text: string, user?: string) => Promise<void>;
  demoMode: boolean;
  connected: boolean;
  soundUrl: string;
  openOverlay: () => void;
};
const moodIcons = { starlight: Moon, rain: CloudRain, aurora: Waves, sunset: Sunset };
export const energyOptions: { id: Energy; name: string; icon: typeof Leaf; description: string }[] =
  [
    { id: 'gentle', name: 'Gentle', icon: Leaf, description: 'Soft movement and low-key sound' },
    { id: 'balanced', name: 'Balanced', icon: Sun, description: 'A little life in the room' },
    { id: 'party', name: 'Party', icon: Zap, description: 'Bigger bursts, same control' },
    { id: 'quiet', name: 'Quiet', icon: VolumeX, description: 'No sound or celebration bursts' },
  ];
export const reactions: { id: EffectKind; name: string; command: string; icon: typeof Heart }[] = [
  { id: 'hearts', name: 'Send some love', command: '!heart', icon: Heart },
  { id: 'lanterns', name: 'Light a lantern', command: '!glow', icon: Wind },
  { id: 'stars', name: 'Make a wish', command: '!star', icon: Star },
  { id: 'confetti', name: 'Tiny celebration', command: '!hype', icon: Sparkles },
];

export function Lounge({
  state,
  now,
  command,
  demo,
  demoMode,
  connected,
  soundUrl,
  openOverlay,
}: Props) {
  const l = state.lounge;
  const mood = MOODS.find((m) => m.id === l.mood)!;
  const [demoName, setDemoName] = useState('moonfriend');
  const [intensity, setIntensity] = useState(l.intensity);
  useEffect(() => setIntensity(l.intensity), [l.intensity]);
  const [kindNote, setKindNote] = useState('');
  const [tab, setTab] = useState<'wall' | 'pending'>('wall');
  const voteTotal = l.vibeVotes.reduce((a, b) => a + b, 0);
  const favorite = voteTotal ? l.vibeVotes.indexOf(Math.max(...l.vibeVotes)) : -1;
  const activeBreak = l.break.status !== 'idle';
  return (
    <>
      <div className="page-heading lounge-heading">
        <div>
          <div className="eyebrow">
            <Heart size={12} /> GOOD COMPANY IS THE WHOLE POINT.
          </div>
          <h1>
            A softer place <span>to be live.</span>
          </h1>
          <p>Some moments need a little magic. Some just need a little room to breathe.</p>
        </div>
        <button className="button secondary" onClick={openOverlay}>
          <Radio size={15} />
          Put it on stream
          <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="lounge-topline">
        <span>
          <span className="status-dot" />
          Your community’s little corner of the internet
        </span>
        <div>
          <Heart size={12} />
          {l.hearts} hearts
          <Star size={12} />
          {l.stars} {l.stars === 1 ? 'wish' : 'wishes'}
          <Wind size={12} />
          {l.lanterns} {l.lanterns === 1 ? 'lantern' : 'lanterns'}
        </div>
      </div>
      <div className="lounge-layout">
        <div className="lounge-main">
          <section className={`lounge-world mood-${l.mood}`}>
            <div className="world-topline">
              <span>
                <i />
                THE COZY LOUNGE
              </span>
              <span>{activeBreak ? 'ON A LITTLE BREATHER' : mood.name.toUpperCase()}</span>
            </div>
            <div className="world-canvas">
              <SceneFrame
                state={state}
                ambientOnly
                onInteract={demoMode ? () => void demo('!glow', demoName) : undefined}
              />
              <div className="world-copy">
                <span>
                  {activeBreak
                    ? 'STAY A LITTLE. WE’VE GOT THE LIGHTS.'
                    : 'A LITTLE WORLD, MADE WARMER BY YOU.'}
                </span>
                <h2>
                  {activeBreak
                    ? 'You can take your time.'
                    : l.mood === 'rain'
                      ? 'Let the world wait.'
                      : l.mood === 'aurora'
                        ? 'Somewhere between magic and home.'
                        : l.mood === 'sunset'
                          ? 'Good company. Golden hour.'
                          : 'There’s a light on for you.'}
                </h2>
                <p>{activeBreak ? l.break.message : mood.description}</p>
              </div>
              {demoMode && (
                <div className="world-interaction">
                  <Sparkles size={12} />
                  Click the sky to send a demo lantern
                </div>
              )}
              {l.wall[0] && (
                <div className="world-kindness">
                  <Heart size={12} />
                  <div>
                    <p>“{l.wall[0].text}”</p>
                    <span>— {l.wall[0].user} · approved community note</span>
                  </div>
                </div>
              )}
            </div>
            <div className="world-bottom">
              <span>
                <ShieldCheck size={13} />
                Only approved notes appear on stream
              </span>
              <label className="world-toggle">
                <input
                  type="checkbox"
                  checked={l.showBackground}
                  onChange={(e) =>
                    void command(
                      { type: 'ambience', showBackground: e.target.checked },
                      e.target.checked
                        ? 'The lounge atmosphere is now in your OBS source.'
                        : 'OBS returned to the published scene.',
                    )
                  }
                />
                <span />
                Use as OBS background
              </label>
            </div>
          </section>
          <AudioDock lounge={l} sourceUrl={soundUrl} />
          <section className="panel mood-panel">
            <div className="panel-heading">
              <h2>
                <Waves size={17} />
                Set the feeling
              </h2>
              <span className="lounge-small-label">YOU PICK. CHAT CAN SUGGEST.</span>
            </div>
            <div className="mood-grid">
              {MOODS.map((m) => {
                const Icon = moodIcons[m.id];
                return (
                  <button
                    key={m.id}
                    className={`mood-card mood-${m.id} ${l.mood === m.id ? 'selected' : ''}`}
                    onClick={() => void command({ type: 'ambience', mood: m.id })}
                  >
                    <div className="mood-swatch">
                      <Icon size={25} />
                      <span>{l.mood === m.id ? <Check size={12} /> : m.emoji}</span>
                    </div>
                    <strong>{m.name}</strong>
                    <span>{m.description}</span>
                  </button>
                );
              })}
            </div>
            <div className="energy-controls">
              <span>ROOM ENERGY</span>
              <div>
                {energyOptions.map((e) => (
                  <button
                    key={e.id}
                    className={l.energy === e.id ? 'selected' : ''}
                    title={e.description}
                    onClick={() =>
                      void command(
                        { type: 'ambience', energy: e.id },
                        e.id === 'quiet'
                          ? 'Quiet mode on. Sound and reaction bursts are paused.'
                          : `${e.name} energy is on.`,
                      )
                    }
                  >
                    <e.icon size={13} />
                    {e.name}
                  </button>
                ))}
              </div>
              <label>
                <Sparkles size={13} />
                Sparkle
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(intensity * 100)}
                  aria-label="Particle intensity"
                  onChange={(e) => setIntensity(Number(e.target.value) / 100)}
                  onPointerUp={() => void command({ type: 'ambience', intensity })}
                  onKeyUp={(e) => {
                    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))
                      void command({ type: 'ambience', intensity });
                  }}
                />
                <b>{Math.round(intensity * 100)}%</b>
              </label>
            </div>
          </section>
          <section className="panel kindness-panel">
            <div className="panel-heading">
              <h2>
                <HeartHandshake size={17} />A wall of little good things
              </h2>
              <span className="kindness-tabs">
                <button className={tab === 'wall' ? 'selected' : ''} onClick={() => setTab('wall')}>
                  On the wall <b>{l.wall.length}</b>
                </button>
                <button
                  className={tab === 'pending' ? 'selected' : ''}
                  onClick={() => setTab('pending')}
                >
                  For approval <b>{l.pending.length}</b>
                </button>
              </span>
            </div>
            {tab === 'wall' ? (
              l.wall.length ? (
                <div className="kindness-grid">
                  {l.wall.map((k, i) => (
                    <article key={k.id} className={`kind-note note-${i % 3}`}>
                      <span>✦</span>
                      <p>“{k.text}”</p>
                      <footer>
                        <strong>{k.user}</strong>
                        <small>{k.source === 'demo' ? 'DEMO' : 'TWITCH'}</small>
                        <button
                          aria-label={`Remove note by ${k.user}`}
                          onClick={() => void command({ type: 'removeKindness', id: k.id })}
                        >
                          <X size={12} />
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="kindness-empty">
                  <HeartHandshake size={30} />
                  <h3>No perfect words needed.</h3>
                  <p>
                    A thank-you. An inside joke. A tiny “glad you’re here.”
                    <br />
                    Chat can send <code>!kind your message</code>. You choose what goes on the wall.
                  </p>
                  <button className="text-button" onClick={() => setTab('pending')}>
                    Check the approval queue
                    <ArrowRight size={13} />
                  </button>
                </div>
              )
            ) : (
              <div className="approval-list">
                {l.pending.length ? (
                  l.pending.map((k) => (
                    <article key={k.id}>
                      <div>
                        <span>
                          {k.user} <small>{k.source}</small>
                        </span>
                        <p>{k.text}</p>
                      </div>
                      <button
                        className="approve-note"
                        aria-label={`Approve note by ${k.user}`}
                        onClick={() =>
                          void command(
                            { type: 'approveKindness', id: k.id },
                            'A little kindness is now on the wall.',
                          )
                        }
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Dismiss note by ${k.user}`}
                        onClick={() => void command({ type: 'dismissKindness', id: k.id })}
                      >
                        <X size={14} />
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="empty-pending">
                    <ShieldCheck size={25} />
                    <p>No notes waiting. New submissions stay here until you approve them.</p>
                  </div>
                )}
              </div>
            )}
            {demoMode && (
              <form
                className="kindness-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (kindNote.trim().length >= 3) {
                    void demo(`!kind ${kindNote.trim()}`, demoName);
                    setKindNote('');
                    setTab('pending');
                  }
                }}
              >
                <Heart size={15} />
                <input
                  aria-label="Demo kindness note"
                  placeholder="Try a little kindness as a demo chatter…"
                  value={kindNote}
                  onChange={(e) => setKindNote(e.target.value)}
                  maxLength={160}
                />
                <button className="button small secondary" disabled={kindNote.trim().length < 3}>
                  <Send size={13} />
                  Send for approval
                </button>
              </form>
            )}
          </section>
        </div>
        <div className="lounge-side">
          <CarePanel state={state} now={now} command={command} />
          <section className="panel reaction-panel">
            <div className="panel-heading">
              <h2>
                <Sparkles size={16} />A little instant joy
              </h2>
              <span className="lounge-small-label">FREE FOR CHAT</span>
            </div>
            <p>Four tiny ways to say, “I’m here with you.”</p>
            <div className="reaction-grid">
              {reactions.map((r) => (
                <button
                  key={r.id}
                  onClick={() =>
                    demoMode
                      ? void demo(r.command, demoName)
                      : void command({ type: 'celebrate', kind: r.id })
                  }
                  disabled={!connected || l.energy === 'quiet'}
                >
                  <span className={`reaction-icon reaction-${r.id}`}>
                    <r.icon size={23} />
                  </span>
                  <strong>{r.name}</strong>
                  <code>{r.command}</code>
                </button>
              ))}
            </div>
            {demoMode && (
              <label className="lounge-demo-user">
                DEMO CHATTER
                <input
                  value={demoName}
                  maxLength={30}
                  aria-label="Lounge demo chatter"
                  onChange={(e) => setDemoName(e.target.value.replace(/[^\w-]/g, ''))}
                />
              </label>
            )}
            <div className="reaction-hint">
              <ShieldCheck size={12} />
              {l.energy === 'quiet'
                ? 'Quiet mode keeps contributions, skips the bursts.'
                : 'Gentle, rate-limited bursts. No spam avalanche.'}
            </div>
          </section>
          <section className="panel kindness-jar">
            <div className="panel-heading">
              <h2>
                <Heart size={16} />
                The kindness jar
              </h2>
              <span>{l.jars} filled today</span>
            </div>
            <div className="jar-art">
              <div className="jar-lid" />
              <div className="jar-glass">
                <div
                  className="jar-fill"
                  style={{ height: `${(jarProgress(l.hearts) / 12) * 90 + 8}%` }}
                />
                {Array.from({ length: Math.min(jarProgress(l.hearts), 8) }, (_, i) => (
                  <Heart
                    key={i}
                    size={13 + (i % 3) * 3}
                    fill="currentColor"
                    style={{
                      left: `${18 + ((i * 27) % 55)}%`,
                      bottom: `${12 + ((i * 19) % 53)}%`,
                      transform: `rotate(${i % 2 ? 15 : -15}deg)`,
                    }}
                  />
                ))}
                <span>
                  made of
                  <br />
                  <b>good company</b>
                </span>
              </div>
              <i>✦</i>
              <i>+</i>
            </div>
            <h3>
              {jarProgress(l.hearts)} <span>/ 12 hearts</span>
            </h3>
            <p>
              {l.hearts === 0
                ? 'It starts with one small act of kindness.'
                : `${12 - jarProgress(l.hearts)} more hearts to fill the next jar.`}
            </p>
            <span className="jar-command">
              Chat can type <code>!heart</code> or <code>!hug</code>
            </span>
          </section>
          <section className="panel vibe-vote-panel">
            <div className="panel-heading">
              <h2>
                <MessageCircle size={16} />
                How’s the room feeling?
              </h2>
              <button
                className="icon-button"
                aria-label="Reset mood suggestions"
                onClick={() => void command({ type: 'resetVibes' })}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <p>One suggestion per account. The final say is yours.</p>
            <div className="vibe-votes">
              {MOODS.map((m, i) => (
                <button
                  key={m.id}
                  disabled={!demoMode}
                  onClick={() => void demo(m.command, demoName)}
                >
                  <span
                    className="vibe-fill"
                    style={{ width: `${voteTotal ? (l.vibeVotes[i] / voteTotal) * 100 : 0}%` }}
                  />
                  <span>{m.emoji}</span>
                  <strong>{m.name}</strong>
                  <b>{l.vibeVotes[i]}</b>
                </button>
              ))}
            </div>
            <div className="vibe-footer">
              <span>{voteTotal} mood suggestions</span>
              {favorite >= 0 && (
                <button
                  onClick={() => void command({ type: 'ambience', mood: MOODS[favorite].id })}
                >
                  Use chat’s pick
                  <Check size={12} />
                </button>
              )}
            </div>
            <code>!vibe starlight / rain / aurora / sunset</code>
          </section>
        </div>
      </div>
      <div className="lounge-endnote">
        <Heart size={13} />
        <p>You don’t have to perform every second to belong here. Neither does your community.</p>
        <span>MADE WITH A LITTLE EXTRA CARE</span>
      </div>
    </>
  );
}

export function CarePanel({
  state,
  now,
  command,
}: {
  state: ForgeState;
  now: number;
  command: Props['command'];
}) {
  const [duration, setDuration] = useState(120);
  const [message, setMessage] = useState(state.lounge.break.message);
  const [care, setCare] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('popforge.care.v1') ?? 'null');
      if (saved && Number.isFinite(saved.startedAt) && now - saved.startedAt < 24 * 3600000)
        return {
          ...saved,
          enabled: !!saved.enabled,
          interval: [30, 45, 60, 90].includes(saved.interval) ? saved.interval : 45,
        };
    } catch {}
    return { startedAt: now, enabled: false, interval: 45, nextAt: now + 45 * 60000 };
  });
  useEffect(() => {
    try {
      localStorage.setItem('popforge.care.v1', JSON.stringify(care));
    } catch {}
  }, [care]);
  const due = care.enabled && now >= care.nextAt && state.lounge.break.status === 'idle';
  const elapsed = Math.max(0, Math.floor((now - care.startedAt) / 60000));
  const b = state.lounge.break;
  const active = b.status !== 'idle';
  const left = Math.min(b.duration, Math.max(0, Math.ceil((b.deadline - now) / 1000)));
  const takeBreak = async () => {
    if (
      await command(
        { type: 'takeBreak', duration, message: message.trim() },
        'You’re on a breather. Chat can keep the lights on.',
      )
    )
      setCare({ ...care, nextAt: now + care.interval * 60000 });
  };
  return (
    <section className={`panel care-panel ${active ? 'on-a-break' : ''}`}>
      <div className="panel-heading">
        <h2>
          <Coffee size={17} />
          Your little creator corner
        </h2>
        <span className="care-flower">✿</span>
      </div>
      <div className="care-intro">
        <span className="care-eyebrow">
          {active ? 'THIS MOMENT CAN WAIT FOR YOU.' : 'YOU’RE A PERSON BEFORE A PERFORMER.'}
        </span>
        <h3>
          {active ? 'Take your time.' : due ? 'A little pause, maybe?' : 'Good to have you here.'}
        </h3>
        <p>
          {active
            ? 'Your community has a cozy place to be. Come back when you’re ready.'
            : due
              ? 'You asked for a gentle nudge. Stretch, grab water, or keep going. It’s your call.'
              : 'A pause doesn’t need an apology. We’ll keep your corner of the internet warm.'}
        </p>
      </div>
      {active ? (
        <div className="breather-active">
          <div
            className={`breathing-orb ${state.settings.reducedMotion || state.lounge.energy === 'quiet' ? 'still' : ''}`}
          >
            <span />
            <span />
            <span />
            <Heart size={23} />
          </div>
          <span className="breath-caption">
            {b.status === 'resting'
              ? 'No rush. Come back when you’re ready.'
              : (now - (b.deadline - b.duration * 1000)) % 12000 < 4000
                ? 'A little room to breathe.'
                : (now - (b.deadline - b.duration * 1000)) % 12000 < 6000
                  ? 'Nothing to prove right now.'
                  : 'Let the moment slow down.'}
          </span>
          <div className="breather-clock">
            {b.status === 'resting'
              ? 'Take your time'
              : `${Math.floor(left / 60)
                  .toString()
                  .padStart(2, '0')}:${(left % 60).toString().padStart(2, '0')}`}
            <small>
              {b.status === 'resting'
                ? 'The timer ended. The pause is still yours.'
                : 'A gentle timer, not a deadline.'}
            </small>
          </div>
          <button
            className="button primary full"
            onClick={async () => {
              if (
                await command({ type: 'returnFromBreak' }, 'Welcome back. We kept the lights on.')
              )
                setCare({ ...care, nextAt: now + care.interval * 60000 });
            }}
          >
            <Heart size={14} />
            I’m back
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="break-duration">
            {[60, 120, 300].map((d) => (
              <button
                className={duration === d ? 'selected' : ''}
                key={d}
                onClick={() => setDuration(d)}
              >
                {d / 60} min
              </button>
            ))}
          </div>
          <label className="break-message-label">
            A NOTE FOR YOUR COMMUNITY
            <textarea
              rows={2}
              aria-label="Break message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={120}
            />
          </label>
          <button
            className="button primary full"
            disabled={message.trim().length < 3}
            onClick={takeBreak}
          >
            <Coffee size={15} />
            Take a breather
            <ArrowUpRight size={14} />
          </button>
          {due && (
            <button
              className="snooze-break"
              onClick={() => setCare({ ...care, nextAt: now + 10 * 60000 })}
            >
              I’m good. Nudge me in 10 minutes.
            </button>
          )}
        </>
      )}
      <div className="care-reminders">
        <label>
          <span>
            Gentle break nudges<small>Private to this browser. Always optional.</small>
          </span>
          <button
            role="switch"
            aria-checked={care.enabled}
            aria-label="Gentle break nudges"
            className={`switch ${care.enabled ? 'checked' : ''}`}
            onClick={() =>
              setCare({ ...care, enabled: !care.enabled, nextAt: now + care.interval * 60000 })
            }
          >
            <span />
          </button>
        </label>
        {care.enabled && (
          <div className="reminder-interval">
            <span>Every</span>
            <StudioSelect
              aria-label="Break nudge interval"
              value={care.interval}
              onChange={(e) =>
                setCare({
                  ...care,
                  interval: Number(e.target.value),
                  nextAt: now + Number(e.target.value) * 60000,
                })
              }
            >
              {[30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </StudioSelect>
          </div>
        )}
        <span className="studio-session">
          <Timer size={11} />
          Studio session ·{' '}
          {elapsed < 60 ? `${elapsed} min` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`}{' '}
          <span>✦</span> You set the pace.
        </span>
      </div>
    </section>
  );
}

export function LoungeOverlay({ state, now }: { state: ForgeState; now: number }) {
  const l = state.lounge;
  const b = l.break;
  const left = Math.min(b.duration, Math.max(0, Math.ceil((b.deadline - now) / 1000)));
  const active = b.status !== 'idle';
  return (
    <>
      <div className="ambient-overlay-title">
        <span>✦ POPFORGE · GOOD COMPANY</span>
        <h2>{active ? 'On a little breather.' : MOODS.find((m) => m.id === l.mood)!.name}</h2>
        <p>{active ? b.message : 'Little moments. Good company. Glad you’re here.'}</p>
      </div>
      {active && (
        <div className="ambient-break-clock">
          <Coffee size={18} />
          <strong>
            {b.status === 'resting'
              ? 'No rush.'
              : `${Math.floor(left / 60)
                  .toString()
                  .padStart(2, '0')}:${(left % 60).toString().padStart(2, '0')}`}
          </strong>
          <span>
            {b.status === 'resting'
              ? 'Back when they’re ready.'
              : 'Taking a little time. Keeping the lights on.'}
          </span>
        </div>
      )}
      <div className="ambient-overlay-stats">
        <span>
          <Heart size={15} />
          {l.hearts} hearts
        </span>
        <span>
          <Wind size={15} />
          {l.lanterns} {l.lanterns === 1 ? 'lantern' : 'lanterns'}
        </span>
        <span>
          <Star size={15} />
          {l.stars} {l.stars === 1 ? 'wish' : 'wishes'}
        </span>
        <b>{active ? '!glow · !heart · !star' : '!vibe · !kind · !heart'}</b>
      </div>
      {l.wall[0] && (
        <div className="ambient-overlay-kindness">
          <Heart size={16} />
          <div>
            <p>“{l.wall[0].text}”</p>
            <span>— {l.wall[0].user}</span>
          </div>
        </div>
      )}
    </>
  );
}

export function PrivateCareNudge({
  state,
  now,
  command,
}: {
  state: ForgeState;
  now: number;
  command: Props['command'];
}) {
  const [care, setCare] = useState<any>(null);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem('popforge.care.v1') ?? 'null');
      if (value?.enabled && Number.isFinite(value.nextAt)) setCare(value);
      else setCare(null);
    } catch {
      setCare(null);
    }
  }, [now]);
  if (!care || now < care.nextAt || state.lounge.break.status !== 'idle') return null;
  const postpone = (minutes: number) => {
    const next = { ...care, nextAt: now + minutes * 60000 };
    try {
      localStorage.setItem('popforge.care.v1', JSON.stringify(next));
    } catch {}
    setCare(next);
  };
  return (
    <aside className="private-care-nudge" role="status">
      <Coffee size={18} />
      <div>
        <strong>A little pause, maybe?</strong>
        <p>
          You asked for a gentle nudge. A sip of water, a stretch, or a minute to yourself. Your
          call.
        </p>
      </div>
      <button
        onClick={async () => {
          if (
            await command({
              type: 'takeBreak',
              duration: 120,
              message: 'Take your time. We’re keeping the lights on.',
            })
          )
            postpone(care.interval || 45);
        }}
      >
        Take a breather
        <ArrowRight size={13} />
      </button>
      <button onClick={() => postpone(10)}>In 10 minutes</button>
      <span>ONLY YOU SEE THIS</span>
    </aside>
  );
}
