// ui.jsx — shared UI pieces for Vocab Tabs. Exports to window.
(function () {
const { useState, useRef, useEffect } = React;

function Icon({ name, accent }) {
  const s = { width: 18, height: 18, stroke: 'currentColor', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    less: <path d="M5 12h14" />,
    more: <g><path d="M12 5v14" /><path d="M5 12h14" /></g>,
    next: <g><path d="M4 12h14" /><path d="M13 6l6 6-6 6" /></g>,
    check: <path d="M4 12l5 5L20 6" />,
    manage: <g><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></g>,
    close: <g><path d="M6 6l12 12" /><path d="M18 6L6 18" /></g>,
    info: <g><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5v.5" /></g>,
    ext: <g><path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M19 13v6H5V5h6" /></g>,
    upload: <g><path d="M12 16V5" /><path d="M7 10l5-5 5 5" /><path d="M5 19h14" /></g>
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name]}</svg>;
}

// Small button used across directions.
function CtrlButton({ icon, label, onClick, primary, accent, compact }) {
  const [hover, setHover] = useState(false);
  const style = {
    display: 'inline-flex', alignItems: 'center', gap: compact ? 0 : 8,
    padding: compact ? '9px' : '9px 14px',
    borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'Karla, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '.01em',
    border: '1px solid ' + (hover ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)'),
    background: hover ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.07)',
    color: '#fff', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    transition: 'all .18s ease', lineHeight: 1
  };
  if (primary) { style.borderColor = accent; style.color = accent; }
  return (
    <button style={style} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} title={label}>
      {icon && <Icon name={icon} />} {!compact && <span>{label}</span>}
    </button>
  );
}

// Frequency indicator: 7 dots, filled up to weight.
function FrequencyDots({ weight, accent }) {
  return (
    <div className="vt-freq" title={`Frequency ${weight} of 7`}>
      {[1,2,3,4,5,6,7].map(i => (
        <span key={i} style={{ background: i <= weight ? accent : 'rgba(255,255,255,.25)' }} />
      ))}
    </div>
  );
}

// Hover / click reveal placard for artwork attribution.
function ArtistPlacard({ art, accent, alwaysOpen }) {
  const [open, setOpen] = useState(false);
  const show = open || alwaysOpen;
  if (!art || art._fallback) return null;
  return (
    <div className={"vt-placard" + (show ? " open" : "")}
         onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="vt-placard-trigger" onClick={() => setOpen(o => !o)} aria-label="About this work">
        <Icon name="info" /> <span>About this work</span>
      </button>
      <div className="vt-placard-body">
        <div className="vt-placard-title">{art.title}</div>
        <div className="vt-placard-artist">{art.artistDisplay || art.artist}</div>
        <div className="vt-placard-meta">
          {[art.date, art.medium].filter(Boolean).join(' \u00b7 ')}
        </div>
        <div className="vt-placard-links">
          <a href={art.pageUrl} target="_blank" rel="noopener" style={{ color: accent }}>
            {art.viewLabel || 'View source'} <Icon name="ext" />
          </a>
          <a href={art.wikiUrl} target="_blank" rel="noopener" style={{ color: accent }}>
            About {art.artist} <Icon name="ext" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Manage words panel (CSV upload + list).
function ManagePanel({ words, sources, onToggleSource, onClose, onImport, onReset }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const active = words.filter(w => !w.learned);
  const learned = words.filter(w => w.learned);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = window.Vocab.parseCSV(reader.result);
      if (!parsed.length) { setMsg('No rows found \u2014 check your columns (word, definition, example).'); return; }
      onImport(parsed);
      setMsg(`Imported ${parsed.length} words.`);
    };
    reader.readAsText(f);
  }

  return (
    <div className="vt-modal-scrim" onClick={onClose}>
      <div className="vt-modal" onClick={e => e.stopPropagation()}>
        <div className="vt-modal-head">
          <h2>Manage words</h2>
          <button className="vt-iconbtn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>

        <div className="vt-upload" onClick={() => fileRef.current && fileRef.current.click()}>
          <Icon name="upload" />
          <div>
            <strong>Upload a CSV</strong>
            <p>Column A <em>word</em> &middot; Column B <em>definition</em> &middot; Column C <em>example sentence</em></p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
        </div>
        {msg && <div className="vt-msg">{msg}</div>}

        <div className="vt-sources">
          <div className="vt-sources-head">Art sources</div>
          {(sources || []).map(s => {
            const onlyEnabled = sources.filter(x => x.enabled).length === 1 && s.enabled;
            return (
              <label key={s.id} className={"vt-source-row" + (onlyEnabled ? " locked" : "")}>
                <input
                  type="checkbox"
                  checked={s.enabled}
                  disabled={onlyEnabled}
                  onChange={(e) => onToggleSource(s.id, e.target.checked)}
                />
                <span>{s.label}</span>
                {onlyEnabled && <em className="vt-source-hint">at least one required</em>}
              </label>
            );
          })}
        </div>

        <div className="vt-counts">
          <span><strong>{active.length}</strong> in rotation</span>
          <span><strong>{learned.length}</strong> learned</span>
          <button className="vt-textbtn" onClick={onReset}>Reset to sample set</button>
        </div>

        <div className="vt-wordlist">
          {words.map((w) => (
            <div key={w.word} className={"vt-wordrow" + (w.learned ? " learned" : "")}>
              <div className="vt-wordrow-main">
                <span className="vt-wordrow-word">{w.word}</span>
                <span className="vt-wordrow-def">{w.definition}</span>
              </div>
              <div className="vt-wordrow-side">
                {w.learned ? <span className="vt-tag">learned</span>
                           : <span className="vt-tag freq">freq {w.weight}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Toast feedback
function Toast({ text }) {
  if (!text) return null;
  return <div className="vt-toast">{text}</div>;
}

Object.assign(window, { Icon, CtrlButton, FrequencyDots, ArtistPlacard, ManagePanel, Toast });
})();
