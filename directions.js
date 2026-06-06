// directions.jsx — Placard direction for Vocab Tabs. Exports to window.
(function () {
  function ArtLayer({
    art,
    fit
  }) {
    if (!art || art._fallback || !art.image) {
      return /*#__PURE__*/React.createElement("div", {
        className: "vt-art vt-art-fallback"
      });
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-art",
      style: {
        backgroundImage: `url("${art.image}")`,
        backgroundSize: fit || 'cover'
      }
    });
  }
  function WordBlock({
    word,
    accent,
    scale
  }) {
    if (!word) return null;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "vt-wordhead"
    }, /*#__PURE__*/React.createElement("h1", {
      className: "vt-word",
      style: {
        fontSize: `calc(${scale} * clamp(3rem, 7.5vw, 6.5rem))`
      }
    }, word.word), /*#__PURE__*/React.createElement(FrequencyDots, {
      weight: word.weight,
      accent: accent
    })), /*#__PURE__*/React.createElement("p", {
      className: "vt-def",
      style: {
        fontSize: `calc(${scale} * clamp(1.05rem, 1.6vw, 1.5rem))`
      }
    }, word.definition), word.example && /*#__PURE__*/React.createElement("p", {
      className: "vt-example",
      style: {
        fontSize: `calc(${scale} * clamp(.95rem, 1.3vw, 1.25rem))`
      }
    }, '"' + word.example + '"'));
  }

  // Gallery Placard: full-bleed art, dark scrim, text lower-left.
  function DirectionPlacard(p) {
    return /*#__PURE__*/React.createElement("div", {
      className: "vt-dir dir-placard",
      style: {
        '--scrim': p.scrim,
        '--accent': p.accent
      }
    }, /*#__PURE__*/React.createElement(ArtLayer, {
      art: p.art
    }), /*#__PURE__*/React.createElement("div", {
      className: "vt-scrim scrim-bl"
    }), /*#__PURE__*/React.createElement("div", {
      className: "vt-corner-tr"
    }, /*#__PURE__*/React.createElement(ArtistPlacard, {
      art: p.art,
      accent: p.accent,
      alwaysOpen: p.alwaysInfo
    })), /*#__PURE__*/React.createElement("div", {
      className: "vt-content vt-content-bl"
    }, /*#__PURE__*/React.createElement(WordBlock, {
      word: p.word,
      accent: p.accent,
      scale: p.textScale
    }), /*#__PURE__*/React.createElement("div", {
      className: "vt-controls"
    }, p.controls)));
  }
  Object.assign(window, {
    DirectionPlacard,
    ArtLayer,
    WordBlock
  });
})();
