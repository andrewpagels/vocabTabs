// app.jsx — Vocab Tabs main application.
(function () {
  const {
    useState,
    useEffect,
    useRef,
    useCallback
  } = React;
  const SCRIM = 0.62;
  const TEXT_SCALE = 1;
  function ControlBar({
    accent,
    onLess,
    onMore,
    onNext,
    onLearned,
    onManage
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CtrlButton, {
      label: "Show less (\u2193)",
      onClick: onLess,
      accent: accent
    }), /*#__PURE__*/React.createElement(CtrlButton, {
      label: "Show more (\u2191)",
      onClick: onMore,
      accent: accent
    }), /*#__PURE__*/React.createElement(CtrlButton, {
      label: "Next (Space/\u2192)",
      onClick: onNext,
      accent: accent
    }), /*#__PURE__*/React.createElement(CtrlButton, {
      label: "Mark learned (L)",
      onClick: onLearned,
      accent: accent
    }), /*#__PURE__*/React.createElement(CtrlButton, {
      label: "Manage (M)",
      onClick: onManage,
      accent: accent
    }));
  }
  function App() {
    const [words, setWords] = useState(() => window.Vocab.load());
    const [pool, setPool] = useState(null);
    const [art, setArt] = useState(null);
    const [word, setWord] = useState(null);
    const [managing, setManaging] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [toast, setToast] = useState('');
    const [sources, setSources] = useState(() => window.ArtService.getSources());
    const [loading, setLoading] = useState(true);
    const prevArt = useRef(null);
    const prevWord = useRef(null);
    const toastTimer = useRef(null);
    const poolRef = useRef(null);
    const poolRequest = useRef(0);
    const shuffleRequest = useRef(0);
    const flash = useCallback(text => {
      setToast(text);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 1900);
    }, []);
    const shuffle = useCallback(async (wordsArg, poolArg, poolRequestId) => {
      const request = ++shuffleRequest.current;
      const ws = wordsArg || words;
      const p = poolArg && poolArg.length ? poolArg : poolRef.current && poolRef.current.length ? poolRef.current : window.ArtService.FALLBACK;
      const nextArt = window.ArtService.pickRandom(p, prevArt.current && prevArt.current.id);
      const nextWord = window.Vocab.pickWeighted(ws, prevWord.current && prevWord.current.word);
      if (nextArt && nextArt.image) {
        await window.ArtService.preload(nextArt);
      }
      if (request !== shuffleRequest.current || poolRequestId && poolRequestId !== poolRequest.current) return false;
      prevArt.current = nextArt;
      prevWord.current = nextWord;
      setArt(nextArt);
      setWord(nextWord);
      setLoading(false);
      return true;
    }, [words]);

    // initial load
    useEffect(() => {
      let done = false;
      const request = ++poolRequest.current;
      window.ArtService.getPool().then(items => {
        if (done || request !== poolRequest.current) return;
        poolRef.current = items;
        setPool(items);
        shuffle(undefined, items, request);
      }).catch(() => {
        if (done || request !== poolRequest.current) return;
        poolRef.current = window.ArtService.FALLBACK;
        setPool([]);
        shuffle(undefined, window.ArtService.FALLBACK, request);
      });
      const tmr = setTimeout(() => {
        if (request === poolRequest.current && !poolRef.current) shuffle(undefined, undefined, request);
      }, 3500);
      return () => {
        done = true;
        clearTimeout(tmr);
      };
    }, []); // eslint-disable-line

    const accent = window.ArtService.accentFrom(art && art.color);
    function refreshWord(updated, msg) {
      window.Vocab.save(updated);
      setWords(updated);
      const w = updated.find(x => x.word === (word && word.word));
      if (w) setWord({
        ...w
      });
      if (msg) flash(msg);
    }
    const onLess = () => {
      if (!word) return;
      refreshWord(window.Vocab.adjust(words, word.word, -1), 'Showing "' + word.word + '" less often');
    };
    const onMore = () => {
      if (!word) return;
      refreshWord(window.Vocab.adjust(words, word.word, +1), 'Showing "' + word.word + '" more often');
    };
    const onNext = () => shuffle();
    const onLearned = () => {
      if (!word) return;
      const updated = window.Vocab.setLearned(words, word.word, true);
      window.Vocab.save(updated);
      setWords(updated);
      flash('"' + word.word + '" marked as learned');
      shuffle(updated);
    };
    const onImport = parsed => {
      window.Vocab.save(parsed);
      setWords(parsed);
      flash('Imported ' + parsed.length + ' words');
      shuffle(parsed);
    };
    const onAddWord = entry => {
      const {
        words: updated,
        existed
      } = window.Vocab.addWord(words, entry);
      window.Vocab.save(updated);
      setWords(updated);
      flash((existed ? 'Updated "' : 'Added "') + entry.word.trim() + '"');
    };
    const onToggleSource = async (id, enabled) => {
      const next = window.ArtService.setSourceEnabled(id, enabled);
      setSources(next);
      setLoading(true);
      const request = ++poolRequest.current;
      try {
        const merged = await window.ArtService.getPool();
        if (request !== poolRequest.current) return;
        poolRef.current = merged;
        setPool(merged);
        const applied = await shuffle(undefined, merged, request);
        if (!applied) return;
        const label = (next.find(s => s.id === id) || {}).label || 'Source';
        flash(enabled ? label + ' added' : label + ' removed');
      } catch (e) {
        if (request === poolRequest.current) {
          setLoading(false);
          flash('Could not change picture sources');
        }
      }
    };
    const onReset = () => {
      const fresh = window.Vocab.SAMPLE.map(w => ({
        ...w
      }));
      window.Vocab.save(fresh);
      setWords(fresh);
      flash('Reset to sample set');
      shuffle(fresh);
    };

    // keyboard shortcuts — defined after the handlers so they exist when this runs
    useEffect(() => {
      function onKey(e) {
        if (e.key === 'Escape') {
          if (settingsOpen) setSettingsOpen(false);else if (managing) setManaging(false);
          return;
        }
        if (managing || settingsOpen) return; // panel open — don't hijack
        const el = document.activeElement;
        if (el && (el.matches('input, textarea, select') || el.isContentEditable)) return;
        if (el && el.matches('button, a, [role="button"]') && (e.key === ' ' || e.key === 'Enter')) return;
        const k = e.key.toLowerCase();
        if (e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          onNext();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          onMore();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onLess();
        } else if (k === 'l') {
          onLearned();
        } else if (k === 'm') {
          setSettingsOpen(false);
          setManaging(true);
        }
      }
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [managing, settingsOpen, onNext, onMore, onLess, onLearned]);
    const controls = /*#__PURE__*/React.createElement(ControlBar, {
      accent: accent,
      onLess: onLess,
      onMore: onMore,
      onNext: onNext,
      onLearned: onLearned,
      onManage: () => {
        setSettingsOpen(false);
        setManaging(true);
      }
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-root"
    }, /*#__PURE__*/React.createElement(DirectionPlacard, {
      art: art,
      word: word,
      accent: accent,
      scrim: SCRIM,
      textScale: TEXT_SCALE,
      alwaysInfo: false,
      controls: controls
    }), loading && /*#__PURE__*/React.createElement("div", {
      className: "vt-loading"
    }, /*#__PURE__*/React.createElement("div", {
      className: "vt-loading-dot"
    }), /*#__PURE__*/React.createElement("span", null, "finding a picture", '…')), !loading && !words.filter(w => !w.learned).length && /*#__PURE__*/React.createElement("div", {
      className: "vt-empty"
    }, /*#__PURE__*/React.createElement("h2", null, "Every word learned ", '—', " nicely done."), /*#__PURE__*/React.createElement("p", null, "Upload a new CSV or reset the rotation to keep going."), /*#__PURE__*/React.createElement("button", {
      className: "vt-textbtn light",
      onClick: () => {
        setSettingsOpen(false);
        setManaging(true);
      }
    }, "Manage words")), /*#__PURE__*/React.createElement(SourceSettings, {
      open: settingsOpen,
      sources: sources,
      onOpenChange: open => {
        if (open) setManaging(false);
        setSettingsOpen(open);
      },
      onToggleSource: onToggleSource
    }), managing && /*#__PURE__*/React.createElement(ManagePanel, {
      words: words,
      onClose: () => setManaging(false),
      onImport: onImport,
      onAddWord: onAddWord,
      onReset: onReset
    }), /*#__PURE__*/React.createElement(Toast, {
      text: toast
    }));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})();
