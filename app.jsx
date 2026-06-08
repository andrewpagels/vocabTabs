// app.jsx — Vocab Tabs main application.
(function () {
const { useState, useEffect, useRef, useCallback } = React;

const SCRIM = 0.62;
const TEXT_SCALE = 1;

function ControlBar({ accent, onLess, onMore, onNext, onLearned, onManage }) {
  return (
    <React.Fragment>
      <CtrlButton label="Show less (↓)" onClick={onLess} accent={accent} />
      <CtrlButton label="Show more (↑)" onClick={onMore} accent={accent} />
      <CtrlButton label="Next (Space/→)" onClick={onNext} accent={accent} />
      <CtrlButton label="Mark learned (L)" onClick={onLearned} accent={accent} />
      <CtrlButton label="Manage (M)" onClick={onManage} accent={accent} />
    </React.Fragment>
  );
}

function App() {
  const [words, setWords] = useState(() => window.Vocab.load());
  const [pool, setPool] = useState(null);
  const [art, setArt] = useState(null);
  const [word, setWord] = useState(null);
  const [managing, setManaging] = useState(false);
  const [toast, setToast] = useState('');
  const [sources, setSources] = useState(() => window.ArtService.getSources());
  const [loading, setLoading] = useState(true);
  const prevArt = useRef(null);
  const prevWord = useRef(null);
  const toastTimer = useRef(null);
  const poolRef = useRef(null);

  const flash = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1900);
  }, []);

  const shuffle = useCallback(async (wordsArg) => {
    const ws = wordsArg || words;
    const p = poolRef.current && poolRef.current.length ? poolRef.current : window.ArtService.FALLBACK;
    const nextArt = window.ArtService.pickRandom(p, prevArt.current && prevArt.current.id);
    const nextWord = window.Vocab.pickWeighted(ws, prevWord.current && prevWord.current.word);
    prevArt.current = nextArt; prevWord.current = nextWord;
    if (nextArt && nextArt.image) {
      await window.ArtService.preload(nextArt);
    }
    setArt(nextArt); setWord(nextWord); setLoading(false);
  }, [words]);

  // initial load
  useEffect(() => {
    let done = false;
    window.ArtService.getPool()
      .then(items => { poolRef.current = items; setPool(items); if (!done) shuffle(); })
      .catch(() => { poolRef.current = window.ArtService.FALLBACK; setPool([]); if (!done) shuffle(); });
    const tmr = setTimeout(() => { if (!poolRef.current) shuffle(); }, 3500);
    return () => { done = true; clearTimeout(tmr); };
  }, []); // eslint-disable-line

  const accent = window.ArtService.accentFrom(art && art.color);

  function refreshWord(updated, msg) {
    window.Vocab.save(updated);
    setWords(updated);
    const w = updated.find(x => x.word === (word && word.word));
    if (w) setWord({ ...w });
    if (msg) flash(msg);
  }

  const onLess = () => { if (!word) return; refreshWord(window.Vocab.adjust(words, word.word, -1), 'Showing "' + word.word + '" less often'); };
  const onMore = () => { if (!word) return; refreshWord(window.Vocab.adjust(words, word.word, +1), 'Showing "' + word.word + '" more often'); };
  const onNext = () => shuffle();
  const onLearned = () => {
    if (!word) return;
    const updated = window.Vocab.setLearned(words, word.word, true);
    window.Vocab.save(updated); setWords(updated);
    flash('"' + word.word + '" marked as learned');
    shuffle(updated);
  };
  const onImport = (parsed) => {
    window.Vocab.save(parsed); setWords(parsed);
    flash('Imported ' + parsed.length + ' words');
    shuffle(parsed);
  };
  const onAddWord = (entry) => {
    const { words: updated, existed } = window.Vocab.addWord(words, entry);
    window.Vocab.save(updated); setWords(updated);
    flash((existed ? 'Updated "' : 'Added "') + entry.word.trim() + '"');
  };
  const onToggleSource = async (id, enabled) => {
    const next = window.ArtService.setSourceEnabled(id, enabled);
    setSources(next);
    const merged = await window.ArtService.getPool();
    poolRef.current = merged; setPool(merged);
    shuffle();
    const label = (next.find(s => s.id === id) || {}).label || 'Source';
    flash(enabled ? label + ' added' : label + ' removed');
  };

  const onReset = () => {
    const fresh = window.Vocab.SAMPLE.map(w => ({ ...w }));
    window.Vocab.save(fresh); setWords(fresh);
    flash('Reset to sample set'); shuffle(fresh);
  };

  // keyboard shortcuts — defined after the handlers so they exist when this runs
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { if (managing) setManaging(false); return; }
      if (managing) return; // panel open — don't hijack
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); onMore(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); onLess(); }
      else if (k === 'l') { onLearned(); }
      else if (k === 'm') { setManaging(true); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [managing, onNext, onMore, onLess, onLearned]);

  const controls = <ControlBar accent={accent} onLess={onLess} onMore={onMore} onNext={onNext} onLearned={onLearned} onManage={() => setManaging(true)} />;

  return (
    <div className="vt-root">
      <div className="vt-wordmark">Vocab&nbsp;Tabs</div>
      <DirectionPlacard art={art} word={word} accent={accent}
                        scrim={SCRIM} textScale={TEXT_SCALE} alwaysInfo={false}
                        controls={controls} />

      {loading && (
        <div className="vt-loading"><div className="vt-loading-dot" /><span>finding a painting{'…'}</span></div>
      )}

      {(!loading && (!words.filter(w => !w.learned).length)) && (
        <div className="vt-empty">
          <h2>Every word learned {'—'} nicely done.</h2>
          <p>Upload a new CSV or reset the rotation to keep going.</p>
          <button className="vt-textbtn light" onClick={() => setManaging(true)}>Manage words</button>
        </div>
      )}

      {managing && <ManagePanel words={words} sources={sources}
                                onToggleSource={onToggleSource}
                                onClose={() => setManaging(false)}
                                onImport={onImport} onAddWord={onAddWord} onReset={onReset} />}
      <Toast text={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
