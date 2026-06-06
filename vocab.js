// vocab.js — vocabulary store for Vocab Tabs.
// window.Vocab: load(), save(), parseCSV(text), pickWeighted(prevWord), adjust(word, delta), setLearned(word, bool)
(function () {
  const KEY = 'vocabtabs.words.v1';

  const SAMPLE = [
    ['ineffable', 'Too great or extreme to be expressed in words.', 'Standing beneath the cathedral dome, she felt an ineffable sense of awe.'],
    ['susurrus', 'A whispering or rustling sound.', 'The susurrus of the wind through the pines lulled the campers to sleep.'],
    ['halcyon', 'Denoting a period of time that was idyllically happy and peaceful.', 'He often spoke of the halcyon days of his childhood summers by the lake.'],
    ['ephemeral', 'Lasting for a very short time.', 'Fame can be ephemeral, vanishing as quickly as it arrives.'],
    ['sonder', 'The realization that each passerby is living a life as vivid as your own.', 'Crossing the crowded plaza, a wave of sonder stopped her mid-step.'],
    ['petrichor', 'The pleasant earthy smell after rain falls on dry ground.', 'The first storm of spring filled the air with petrichor.'],
    ['quixotic', 'Exceedingly idealistic; unrealistic and impractical.', 'His quixotic plan to sail around the world on a raft worried his friends.'],
    ['limerence', 'The state of being infatuated or obsessed with another person.', 'In the grip of limerence, he reread her messages a dozen times.'],
    ['sublime', 'Of such excellence or beauty as to inspire great admiration or awe.', 'The view from the summit was utterly sublime.'],
    ['mellifluous', 'A sound that is sweet and smooth, pleasing to hear.', 'The narrator\u2019s mellifluous voice made the audiobook a joy.'],
    ['ebullient', 'Cheerful and full of energy.', 'She gave an ebullient speech that left the whole room smiling.'],
    ['numinous', 'Having a strong religious or spiritual quality; suggesting the presence of divinity.', 'The ancient grove had a numinous stillness that hushed every visitor.'],
    ['serendipity', 'The occurrence of events by chance in a happy or beneficial way.', 'Finding that bookshop was pure serendipity.'],
    ['vellichor', 'The strange wistfulness of used bookshops.', 'A quiet vellichor settled over him among the dusty shelves.'],
    ['perspicacious', 'Having a ready insight into and understanding of things.', 'Her perspicacious questions cut straight to the heart of the matter.'],
    ['saudade', 'A deep emotional state of melancholic longing for something absent.', 'The old song filled him with saudade for a home he had left long ago.'],
    ['effulgent', 'Shining brightly; radiant.', 'The effulgent dawn spilled gold across the harbor.'],
    ['lacuna', 'An unfilled space or gap.', 'There was a curious lacuna in the historical record of those years.'],
    ['apricity', 'The warmth of the sun in winter.', 'They lingered on the bench, savoring the apricity of the February afternoon.'],
    ['eloquent', 'Fluent or persuasive in speaking or writing.', 'Her eloquent letter changed the committee\u2019s mind.']
  ].map(([word, definition, example]) => ({ word, definition, example, weight: 3, learned: false }));

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && Array.isArray(raw) && raw.length) return raw;
    } catch (e) {}
    return SAMPLE.map(w => ({ ...w }));
  }

  function save(words) {
    try { localStorage.setItem(KEY, JSON.stringify(words)); } catch (e) {}
  }

  // Minimal RFC-4180-ish CSV parser (handles quotes, commas, newlines in quotes).
  function parseCSV(text) {
    const rows = [];
    let field = '', row = [], inQ = false;
    text = text.replace(/\r\n?/g, '\n');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    // Drop a header row if it looks like one
    const out = [];
    rows.forEach((r, idx) => {
      const word = (r[0] || '').trim();
      const definition = (r[1] || '').trim();
      const example = (r[2] || '').trim();
      if (!word) return;
      if (idx === 0 && /^word$/i.test(word) && /^def/i.test(definition || 'def')) return;
      out.push({ word, definition, example, weight: 3, learned: false });
    });
    return out;
  }

  function active(words) { return words.filter(w => !w.learned); }

  function pickWeighted(words, prevWord) {
    const pool = active(words);
    if (!pool.length) return null;
    if (pool.length === 1) return pool[0];
    const candidates = pool.filter(w => w.word !== prevWord);
    const list = candidates.length ? candidates : pool;
    const total = list.reduce((s, w) => s + Math.max(1, w.weight || 3), 0);
    let r = Math.random() * total;
    for (const w of list) {
      r -= Math.max(1, w.weight || 3);
      if (r <= 0) return w;
    }
    return list[list.length - 1];
  }

  function adjust(words, word, delta) {
    const w = words.find(x => x.word === word);
    if (w) w.weight = Math.min(7, Math.max(1, (w.weight || 3) + delta));
    return [...words];
  }

  function setLearned(words, word, val) {
    const w = words.find(x => x.word === word);
    if (w) w.learned = val;
    return [...words];
  }

  window.Vocab = { load, save, parseCSV, pickWeighted, adjust, setLearned, active, SAMPLE };
})();
