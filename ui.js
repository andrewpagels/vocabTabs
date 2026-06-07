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

  // Hover / click reveal placard for artwork attribution.
  function ArtistPlacard({
    art,
    accent,
    alwaysOpen
  }) {
    const [open, setOpen] = useState(false);
    const show = open || alwaysOpen;
    if (!art || art._fallback) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-placard" + (show ? " open" : ""),
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false)
    }, /*#__PURE__*/React.createElement("button", {
      className: "vt-placard-trigger",
      onClick: () => setOpen(o => !o),
      "aria-label": "About this work"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "info"
    }), " ", /*#__PURE__*/React.createElement("span", null, "About this work")), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-title"
    }, art.title), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-artist"
    }, art.artistDisplay || art.artist), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-meta"
    }, [art.date, art.medium].filter(Boolean).join(' \u00b7 ')), /*#__PURE__*/React.createElement("div", {
      className: "vt-placard-links"
    }, /*#__PURE__*/React.createElement("a", {
      href: art.pageUrl,
      target: "_blank",
      rel: "noopener",
      style: {
        color: accent
      }
    }, "View at the Art Institute ", /*#__PURE__*/React.createElement(Icon, {
      name: "ext"
    })), /*#__PURE__*/React.createElement("a", {
      href: art.wikiUrl,
      target: "_blank",
      rel: "noopener",
      style: {
        color: accent
      }
    }, "About ", art.artist, " ", /*#__PURE__*/React.createElement(Icon, {
      name: "ext"
    })))));
  }

  // Manage words panel (CSV upload + list).
  function ManagePanel({
    words,
    onClose,
    onImport,
    onReset
  }) {
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
        if (!parsed.length) {
          setMsg('No rows found \u2014 check your columns (word, definition, example).');
          return;
        }
        onImport(parsed);
        setMsg(`Imported ${parsed.length} words.`);
      };
      reader.readAsText(f);
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
      "aria-label": "Close"
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
    })), msg && /*#__PURE__*/React.createElement("div", {
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
      className: "vt-toast"
    }, text);
  }
  Object.assign(window, {
    Icon,
    CtrlButton,
    FrequencyDots,
    ArtistPlacard,
    ManagePanel,
    Toast
  });
})();
