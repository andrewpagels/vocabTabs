// ui.jsx — shared UI pieces for Vocab Tabs. Exports to window.
(function () {
  const {
    useState,
    useRef,
    useEffect
  } = React;
  function Icon({
    name,
    accent
  }) {
    const s = {
      width: 18,
      height: 18,
      stroke: 'currentColor',
      strokeWidth: 1.6,
      fill: 'none',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };
    const paths = {
      less: /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14"
      }),
      more: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
        d: "M12 5v14"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14"
      })),
      next: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
        d: "M4 12h14"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M13 6l6 6-6 6"
      })),
      check: /*#__PURE__*/React.createElement("path", {
        d: "M4 12l5 5L20 6"
      }),
      manage: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
        d: "M4 6h16"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4 12h16"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4 18h10"
      })),
      close: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
        d: "M6 6l12 12"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M18 6L6 18"
      })),
      info: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 11v5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 7.5v.5"
      })),
      ext: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
        d: "M14 5h5v5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19 5l-8 8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19 13v6H5V5h6"
      })),
      upload: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
        d: "M12 16V5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 10l5-5 5 5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5 19h14"
      })),
      plus: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
        d: "M12 5v14"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14"
      })),
      settings: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9v.01A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15z"
      }))
    };
    return /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      style: s
    }, paths[name]);
  }

  // Small button used across directions.
  function CtrlButton({
    icon,
    label,
    onClick,
    primary,
    accent,
    compact
  }) {
    const [hover, setHover] = useState(false);
    const style = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: compact ? 0 : 8,
      padding: compact ? '9px' : '9px 14px',
      borderRadius: 999,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      fontFamily: 'Karla, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: '.01em',
      border: '1px solid ' + (hover ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)'),
      background: hover ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.07)',
      color: '#fff',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      transition: 'all .18s ease',
      lineHeight: 1
    };
    if (primary) {
      style.borderColor = accent;
      style.color = accent;
    }
    return /*#__PURE__*/React.createElement("button", {
      style: style,
      onClick: onClick,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      title: label
    }, icon && /*#__PURE__*/React.createElement(Icon, {
      name: icon
    }), " ", !compact && /*#__PURE__*/React.createElement("span", null, label));
  }

  // Frequency indicator: 7 dots, filled up to weight.
  function FrequencyDots({
    weight,
    accent
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-freq",
      title: `Frequency ${weight} of 7`
    }, [1, 2, 3, 4, 5, 6, 7].map(i => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        background: i <= weight ? accent : 'rgba(255,255,255,.25)'
      }
    })));
  }

  // Hover / click reveal placard for image attribution.
  function ArtistPlacard({
    art,
    accent,
    alwaysOpen
  }) {
    const [pinned, setPinned] = useState(false);
    const [hovered, setHovered] = useState(false);
    const show = pinned || hovered || alwaysOpen;
    if (!art || art._fallback) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-placard" + (show ? " open" : ""),
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false)
    }, /*#__PURE__*/React.createElement("button", {
      className: "vt-placard-trigger",
      onClick: () => setPinned(value => !value),
      "aria-label": art.infoLabel || 'About this work',
      "aria-expanded": show,
      "aria-controls": "image-attribution-details"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "info"
    }), " ", /*#__PURE__*/React.createElement("span", null, art.infoLabel || 'About this work')), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-body",
      id: "image-attribution-details",
      "aria-hidden": !show
    }, art.title && /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-title"
    }, art.title), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-artist"
    }, art.artistDisplay || art.artist), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-meta"
    }, [art.date, art.medium].filter(Boolean).join(' \u00b7 ')), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-links"
    }, art.pageUrl && /*#__PURE__*/React.createElement("a", {
      href: art.pageUrl,
      target: "_blank",
      rel: "noopener",
      tabIndex: show ? 0 : -1,
      style: {
        color: accent
      }
    }, art.viewLabel || 'View source', " ", /*#__PURE__*/React.createElement(Icon, {
      name: "ext"
    })), art.wikiUrl && /*#__PURE__*/React.createElement("a", {
      href: art.wikiUrl,
      target: "_blank",
      rel: "noopener",
      tabIndex: show ? 0 : -1,
      style: {
        color: accent
      }
    }, art.artistLinkLabel || `About ${art.artist}`, " ", /*#__PURE__*/React.createElement(Icon, {
      name: "ext"
    })), art.providerUrl && /*#__PURE__*/React.createElement("a", {
      href: art.providerUrl,
      target: "_blank",
      rel: "noopener",
      tabIndex: show ? 0 : -1,
      style: {
        color: accent
      }
    }, art.providerLabel || 'About this source', " ", /*#__PURE__*/React.createElement(Icon, {
      name: "ext"
    })))));
  }
  function SourceSettings({
    open,
    sources,
    onOpenChange,
    onToggleSource
  }) {
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
      const focusable = Array.from(rootRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-settings",
      ref: rootRef,
      onKeyDown: trapFocus
    }, open && /*#__PURE__*/React.createElement("div", {
      className: "vt-settings-panel",
      id: "picture-source-settings",
      ref: panelRef,
      role: "dialog",
      "aria-labelledby": "picture-source-title"
    }, /*#__PURE__*/React.createElement("h2", {
      id: "picture-source-title"
    }, "Picture sources"), /*#__PURE__*/React.createElement("p", null, "Choose one or more collections for your new tabs."), /*#__PURE__*/React.createElement("div", {
      className: "vt-settings-sources"
    }, (sources || []).map(source => {
      const onlyEnabled = enabledCount === 1 && source.enabled;
      return /*#__PURE__*/React.createElement("label", {
        key: source.id,
        className: 'vt-settings-source' + (onlyEnabled ? ' locked' : '')
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: source.enabled,
        disabled: onlyEnabled,
        onChange: e => onToggleSource(source.id, e.target.checked)
      }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, source.label), source.description && /*#__PURE__*/React.createElement("small", null, source.description)), onlyEnabled && /*#__PURE__*/React.createElement("em", null, "Required"));
    }))), /*#__PURE__*/React.createElement("button", {
      ref: triggerRef,
      type: "button",
      className: "vt-settings-trigger",
      "aria-label": "Picture settings",
      "aria-expanded": open,
      "aria-controls": "picture-source-settings",
      onClick: () => onOpenChange(!open)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "settings"
    })));
  }

  // Manage words panel (CSV upload + list).
  function ManagePanel({
    words,
    onClose,
    onImport,
    onAddWord,
    onReset
  }) {
    const fileRef = useRef(null);
    const [msg, setMsg] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [nw, setNw] = useState({
      word: '',
      definition: '',
      example: ''
    });
    const active = words.filter(w => !w.learned);
    const learned = words.filter(w => w.learned);
    function handleFile(e) {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = window.Vocab.parseCSV(reader.result);
        if (!parsed.length) {
          setMsg('No rows found \u2014 check your columns (word, definition, example).');
          return;
        }
        onImport(parsed);
        setMsg(`Imported ${parsed.length} words.`);
      };
      reader.readAsText(f);
    }
    function submitAdd() {
      const word = nw.word.trim();
      if (!word) {
        setMsg('Enter a word to add.');
        return;
      }
      onAddWord({
        word,
        definition: nw.definition,
        example: nw.example
      });
      setNw({
        word: '',
        definition: '',
        example: ''
      });
      setShowAdd(false);
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-modal-scrim",
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      className: "vt-modal",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      className: "vt-modal-head"
    }, /*#__PURE__*/React.createElement("h2", null, "Manage words"), /*#__PURE__*/React.createElement("button", {
      className: "vt-iconbtn",
      onClick: onClose,
      "aria-label": "Close",
      autoFocus: true
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "close"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "vt-upload",
      onClick: () => fileRef.current && fileRef.current.click()
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "upload"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Upload a CSV"), /*#__PURE__*/React.createElement("p", null, "Column A ", /*#__PURE__*/React.createElement("em", null, "word"), " \xB7 Column B ", /*#__PURE__*/React.createElement("em", null, "definition"), " \xB7 Column C ", /*#__PURE__*/React.createElement("em", null, "example sentence"))), /*#__PURE__*/React.createElement("input", {
      ref: fileRef,
      type: "file",
      accept: ".csv,text/csv",
      hidden: true,
      onChange: handleFile
    })), !showAdd ? /*#__PURE__*/React.createElement("button", {
      className: "vt-addbtn",
      onClick: () => {
        setShowAdd(true);
        setMsg('');
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus"
    }), " ", /*#__PURE__*/React.createElement("span", null, "Add new word")) : /*#__PURE__*/React.createElement("div", {
      className: "vt-addform"
    }, /*#__PURE__*/React.createElement("input", {
      className: "vt-addinput",
      placeholder: "Word",
      autoFocus: true,
      value: nw.word,
      onChange: e => setNw({
        ...nw,
        word: e.target.value
      }),
      onKeyDown: e => {
        if (e.key === 'Enter') submitAdd();
      }
    }), /*#__PURE__*/React.createElement("textarea", {
      className: "vt-addinput",
      placeholder: "Definition",
      rows: 2,
      value: nw.definition,
      onChange: e => setNw({
        ...nw,
        definition: e.target.value
      })
    }), /*#__PURE__*/React.createElement("textarea", {
      className: "vt-addinput",
      placeholder: "Example sentence",
      rows: 2,
      value: nw.example,
      onChange: e => setNw({
        ...nw,
        example: e.target.value
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "vt-addform-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "vt-textbtn",
      onClick: () => {
        setShowAdd(false);
        setNw({
          word: '',
          definition: '',
          example: ''
        });
      }
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      className: "vt-addsave",
      onClick: submitAdd
    }, "Add word"))), msg && /*#__PURE__*/React.createElement("div", {
      className: "vt-msg"
    }, msg), /*#__PURE__*/React.createElement("div", {
      className: "vt-counts"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, active.length), " in rotation"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, learned.length), " learned"), /*#__PURE__*/React.createElement("button", {
      className: "vt-textbtn",
      onClick: onReset
    }, "Reset to sample set")), /*#__PURE__*/React.createElement("div", {
      className: "vt-wordlist"
    }, words.map(w => /*#__PURE__*/React.createElement("div", {
      key: w.word,
      className: "vt-wordrow" + (w.learned ? " learned" : "")
    }, /*#__PURE__*/React.createElement("div", {
      className: "vt-wordrow-main"
    }, /*#__PURE__*/React.createElement("span", {
      className: "vt-wordrow-word"
    }, w.word), /*#__PURE__*/React.createElement("span", {
      className: "vt-wordrow-def"
    }, w.definition)), /*#__PURE__*/React.createElement("div", {
      className: "vt-wordrow-side"
    }, w.learned ? /*#__PURE__*/React.createElement("span", {
      className: "vt-tag"
    }, "learned") : /*#__PURE__*/React.createElement("span", {
      className: "vt-tag freq"
    }, "freq ", w.weight)))))));
  }

  // Toast feedback
  function Toast({
    text
  }) {
    if (!text) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-toast",
      role: "status",
      "aria-live": "polite"
    }, text);
  }
  Object.assign(window, {
    Icon,
    CtrlButton,
    FrequencyDots,
    ArtistPlacard,
    SourceSettings,
    ManagePanel,
    Toast
  });
})();
