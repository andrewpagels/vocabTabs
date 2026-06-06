// directions.jsx — Placard direction for Vocab Tabs. Exports to window.
(function () {

function ArtLayer({ art, fit }) {
  if (!art || art._fallback || !art.image) {
    return <div className="vt-art vt-art-fallback" />;
  }
  return <div className="vt-art" style={{ backgroundImage: `url("${art.image}")`, backgroundSize: fit || 'cover' }} />;
}

function WordBlock({ word, accent, scale }) {
  if (!word) return null;
  return (
    <React.Fragment>
      <div className="vt-wordhead">
        <h1 className="vt-word" style={{ fontSize: `calc(${scale} * clamp(3rem, 7.5vw, 6.5rem))` }}>{word.word}</h1>
        <FrequencyDots weight={word.weight} accent={accent} />
      </div>
      <p className="vt-def" style={{ fontSize: `calc(${scale} * clamp(1.05rem, 1.6vw, 1.5rem))` }}>{word.definition}</p>
      {word.example && (
        <p className="vt-example" style={{ fontSize: `calc(${scale} * clamp(.95rem, 1.3vw, 1.25rem))` }}>
          {'"' + word.example + '"'}
        </p>
      )}
    </React.Fragment>
  );
}

// Gallery Placard: full-bleed art, dark scrim, text lower-left.
function DirectionPlacard(p) {
  return (
    <div className="vt-dir dir-placard" style={{ '--scrim': p.scrim, '--accent': p.accent }}>
      <ArtLayer art={p.art} />
      <div className="vt-scrim scrim-bl" />
      <div className="vt-corner-tr">
        <ArtistPlacard art={p.art} accent={p.accent} alwaysOpen={p.alwaysInfo} />
      </div>
      <div className="vt-content vt-content-bl">
        <WordBlock word={p.word} accent={p.accent} scale={p.textScale} />
        <div className="vt-controls">{p.controls}</div>
      </div>
    </div>
  );
}

Object.assign(window, { DirectionPlacard, ArtLayer, WordBlock });
})();
