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
    upload: <g><path d="M12 16V5" /><path d="M7 10l5-5 5 5" /><path d="M5 19h14" /></g>,
    plus: <g><path d="M12 5v14" /><path d="M5 12h14" /></g>,
    settings: <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9v.01A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15z" />
    </g>
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

// Hover / click reveal placard for image attribution.
function ArtistPlacard({ art, accent, alwaysOpen }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const show = pinned || hovered || alwaysOpen;
  if (!art || art._fallback) return null;
  return (
    <div className={"vt-placard" + (show ? " open" : "")}
         onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button className="vt-placard-trigger" onClick={() => setPinned(value => !value)}
              aria-label={art.infoLabel || 'About this work'} aria-expanded={show}
              aria-controls="image-attribution-details">
        <Icon name="info" /> <span>{art.infoLabel || 'About this work'}</span>
      </button>
      <div className="vt-placard-body" id="image-attribution-details" aria-hidden={!show}>
        {art.title && <div className="vt-placard-title">{art.title}</div>}
        <div className="vt-placard-artist">{art.artistDisplay || art.artist}</div>
        <div className="vt-placard-meta">
          {[art.date, art.medium].filter(Boolean).join(' \u00b7 ')}
        </div>
        <div className="vt-placard-links">
          {art.pageUrl && <a href={art.pageUrl} target="_blank" rel="noopener" tabIndex={show ? 0 : -1} style={{ color: accent }}>
            {art.viewLabel || 'View source'} <Icon name="ext" />
          </a>}
          {art.wikiUrl && <a href={art.wikiUrl} target="_blank" rel="noopener" tabIndex={show ? 0 : -1} style={{ color: accent }}>
            {art.artistLinkLabel || `About ${art.artist}`} <Icon name="ext" />
          </a>}
          {art.providerUrl && <a href={art.providerUrl} target="_blank" rel="noopener" tabIndex={show ? 0 : -1} style={{ color: accent }}>
            {art.providerLabel || 'About this source'} <Icon name="ext" />
          </a>}
        </div>
      </div>
    </div>
  );
}

function SourceSettings({ open, sources, onOpenChange, onToggleSource }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      const firstChoice = panelRef.current && panelRef.current.querySelector('input:not(:disabled)');
      if (firstChoice) firstChoice.focus();
    } else if (wasOpen.current && triggerRef.current) {
      triggerRef.current.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) onOpenChange(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onOpenChange]);

  const enabledCount = (sources || []).filter(s => s.enabled).length;

  function trapFocus(e) {
    if (!open || e.key !== 'Tab' || !rootRef.current) return;
    const focusable = Array.from(rootRef.current.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  return (
    <div className="vt-settings" ref={rootRef} onKeyDown={trapFocus}>
      {open && (
        <div className="vt-settings-panel" id="picture-source-settings" ref={panelRef}
             role="dialog" aria-labelledby="picture-source-title">
          <h2 id="picture-source-title">Picture sources</h2>
          <p>Choose one or more collections for your new tabs.</p>
          <div className="vt-settings-sources">
            {(sources || []).map(source => {
              const onlyEnabled = enabledCount === 1 && source.enabled;
              return (
                <label key={source.id} className={'vt-settings-source' + (onlyEnabled ? ' locked' : '')}>
                  <input type="checkbox" checked={source.enabled} disabled={onlyEnabled}
                         onChange={e => onToggleSource(source.id, e.target.checked)} />
                  <span>
                    <strong>{source.label}</strong>
                    {source.description && <small>{source.description}</small>}
                  </span>
                  {onlyEnabled && <em>Required</em>}
                </label>
              );
            })}
          </div>
        </div>
      )}
      <button ref={triggerRef} type="button" className="vt-settings-trigger"
              aria-label="Picture settings" aria-expanded={open}
              aria-controls="picture-source-settings"
              onClick={() => onOpenChange(!open)}>
        <Icon name="settings" />
      </button>
    </div>
  );
}

// Manage words panel (CSV upload + list).
function ManagePanel({ words, onClose, onImport, onAddWord, onReset }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [nw, setNw] = useState({ word: '', definition: '', example: '' });
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

  function submitAdd() {
    const word = nw.word.trim();
    if (!word) { setMsg('Enter a word to add.'); return; }
    onAddWord({ word, definition: nw.definition, example: nw.example });
    setNw({ word: '', definition: '', example: '' });
    setShowAdd(false);
  }

  return (
    <div className="vt-modal-scrim" onClick={onClose}>
      <div className="vt-modal" onClick={e => e.stopPropagation()}>
        <div className="vt-modal-head">
          <h2>Manage words</h2>
          <button className="vt-iconbtn" onClick={onClose} aria-label="Close" autoFocus><Icon name="close" /></button>
        </div>

        <div className="vt-upload" onClick={() => fileRef.current && fileRef.current.click()}>
          <Icon name="upload" />
          <div>
            <strong>Upload a CSV</strong>
            <p>Column A <em>word</em> &middot; Column B <em>definition</em> &middot; Column C <em>example sentence</em></p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
        </div>

        {!showAdd ? (
          <button className="vt-addbtn" onClick={() => { setShowAdd(true); setMsg(''); }}>
            <Icon name="plus" /> <span>Add new word</span>
          </button>
        ) : (
          <div className="vt-addform">
            <input
              className="vt-addinput"
              placeholder="Word"
              autoFocus
              value={nw.word}
              onChange={e => setNw({ ...nw, word: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') submitAdd(); }}
            />
            <textarea
              className="vt-addinput"
              placeholder="Definition"
              rows={2}
              value={nw.definition}
              onChange={e => setNw({ ...nw, definition: e.target.value })}
            />
            <textarea
              className="vt-addinput"
              placeholder="Example sentence"
              rows={2}
              value={nw.example}
              onChange={e => setNw({ ...nw, example: e.target.value })}
            />
            <div className="vt-addform-actions">
              <button className="vt-textbtn" onClick={() => { setShowAdd(false); setNw({ word: '', definition: '', example: '' }); }}>Cancel</button>
              <button className="vt-addsave" onClick={submitAdd}>Add word</button>
            </div>
          </div>
        )}
        {msg && <div className="vt-msg">{msg}</div>}

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
  return <div className="vt-toast" role="status" aria-live="polite">{text}</div>;
}

Object.assign(window, { Icon, CtrlButton, FrequencyDots, ArtistPlacard, SourceSettings, ManagePanel, Toast });
})();
