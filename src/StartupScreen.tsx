export function StartupScreen() {
  return (
    <div className="popforge-startup" role="status" aria-live="polite" aria-busy="true">
      <div className="startup-universe" aria-hidden="true">
        <div className="startup-halo" />
        <div className="startup-orbit orbit-near">
          <i />
        </div>
        <div className="startup-orbit orbit-far">
          <i />
        </div>
        <div className="startup-orbit orbit-tilted">
          <i />
        </div>
        <span className="startup-spark spark-a">✦</span>
        <span className="startup-spark spark-b">✧</span>
        <span className="startup-spark spark-c">·</span>
        <div className="startup-mark">
          <svg width="55" height="55" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2 3 14h8l-1 8 11-12h-8l1-8Z" />
          </svg>
        </div>
      </div>
      <div className="startup-wordmark" aria-hidden="true">
        popforge<span>.</span>
      </div>
      <p id="startup-message">Making room for your community</p>
      <span className="startup-caption">A little spark. Something shared.</span>
      <div className="startup-progress" aria-hidden="true">
        <i />
      </div>
      <a className="startup-retry" href="/">
        Try opening PopForge again
      </a>
    </div>
  );
}
