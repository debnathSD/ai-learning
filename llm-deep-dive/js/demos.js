/*
  Interactive demos and figures. Each DEMOS[name](placeholder) replaces a
  <div data-demo="name"> placeholder with its own markup.
*/
(function () {
  'use strict';

  /* ---------- tiny DOM helpers ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      if (kid === null || kid === undefined) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  var uidCount = 0;
  function uid(prefix) { uidCount += 1; return (prefix || 'id') + '-' + uidCount; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function reducedMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function softmax(z) {
    var m = Math.max.apply(null, z);
    var e = z.map(function (v) { return Math.exp(v - m); });
    var sum = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / sum; });
  }
  function pct(p) {
    var v = p * 100;
    if (v >= 10 || v === 0) return Math.round(v) + '%';
    if (v < 0.1) return '<0.1%';
    return v.toFixed(1) + '%';
  }
  function pick(weights) {
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
    return weights.length - 1;
  }

  /* A token chip, with spaces and newlines made visible. */
  function tokText(text) {
    var frag = document.createDocumentFragment();
    var buf = '';
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (c === ' ' || c === '\n') {
        if (buf) { frag.append(document.createTextNode(buf)); buf = ''; }
        frag.append(h('span', { class: 'ws', 'aria-hidden': 'true' }, c === ' ' ? '·' : '↵'));
      } else buf += c;
    }
    if (buf) frag.append(document.createTextNode(buf));
    return frag;
  }
  function chip(text, cls, title) {
    return h('span', { class: 'tok ' + (cls || ''), title: title || null }, tokText(text));
  }

  /* A "Try it" panel that replaces the placeholder. */
  function panel(root, title, intro) {
    var sec = h('section', { class: 'demo', 'aria-label': title });
    sec.append(h('h2', { class: 'demo-title' }, title));
    if (intro) sec.append(h('p', { class: 'demo-intro' }, intro));
    var body = h('div', { class: 'demo-body' });
    sec.append(body);
    root.replaceWith(sec);
    return body;
  }
  /* A static figure that replaces the placeholder. */
  function figure(root, caption, cls) {
    var fig = h('figure', { class: 'fig ' + (cls || '') });
    var body = h('div', { class: 'fig-body' });
    fig.append(body);
    if (caption) fig.append(h('figcaption', null, caption));
    root.replaceWith(fig);
    return body;
  }
  function button(label, cls, onclick) {
    return h('button', { type: 'button', class: 'btn ' + (cls || ''), onclick: onclick }, label);
  }
  function readout(pairs) {
    var dl = h('dl', { class: 'readout' });
    pairs.forEach(function (p) { dl.append(h('div', null, h('dt', null, p[0]), h('dd', null, p[1]))); });
    return dl;
  }
  /* Horizontal bars: rows of [labelNode, value 0..1, isEmphasis] */
  function bars(rows, opts) {
    opts = opts || {};
    var list = h('div', { class: 'bars' + (opts.cls ? ' ' + opts.cls : ''), role: 'list' });
    rows.forEach(function (r) {
      var fill = h('span', { class: 'bar-fill' });
      fill.style.width = Math.max(0, Math.min(1, r.value)) * 100 + '%';
      list.append(h('div', { class: 'bar-row' + (r.emph ? ' is-emph' : ''), role: 'listitem' },
        h('span', { class: 'bar-label' }, r.label),
        h('span', { class: 'bar-track', 'aria-hidden': 'true' }, fill),
        h('span', { class: 'bar-value' }, r.text || pct(r.value))
      ));
    });
    return list;
  }

  var DEMOS = {};

  /* ───────────── Step 1: FineWeb pipeline (figure) ───────────── */
  DEMOS.pipeline = function (root) {
    var stages = [
      ['Common Crawl', 'Billions of raw web pages, crawled since 2007'],
      ['URL filtering', 'Drop malware, spam, marketing, racist and adult sites'],
      ['Text extraction', 'Strip HTML, menus and styling; keep the readable text'],
      ['Language filtering', 'Keep pages that are more than 65% English'],
      ['Deduplication', 'Remove repeated pages and passages'],
      ['PII removal', 'Remove addresses, ID numbers and other personal data'],
      ['FineWeb', 'About 44 TB of text, roughly 15 trillion tokens']
    ];
    var body = figure(root, 'FineWeb\'s pipeline, simplified. It also applies several extra quality filters along the way.', 'flow-fig');
    var ol = h('ol', { class: 'flow' });
    stages.forEach(function (st, i) {
      var cls = i === 0 ? 'flow-src' : (i === stages.length - 1 ? 'flow-out' : '');
      ol.append(h('li', { class: cls }, h('strong', null, st[0]), h('span', null, st[1])));
    });
    body.append(ol);
  };

  /* ───────────── Step 2: BPE tokenizer playground ───────────── */
  /* Like GPT-2/GPT-4 tokenizers, split text into word-like chunks first
     (a word keeps its leading space), so merges never cross chunk boundaries. */
  var CHUNK_RE;
  try { CHUNK_RE = new RegExp(' ?\\p{L}+| ?\\p{N}+| ?[^\\s\\p{L}\\p{N}]+|\\s+(?!\\S)|\\s+', 'gu'); }
  catch (e) { CHUNK_RE = / ?[A-Za-z]+| ?[0-9]+| ?[^\sA-Za-z0-9]+|\s+(?!\S)|\s+/g; }
  function trainBPE(text, maxMerges) {
    var enc = new TextEncoder();
    var chunks = (text.match(CHUNK_RE) || []).map(function (c) { return Array.from(enc.encode(c)); });
    var bytesLen = chunks.reduce(function (a, c) { return a + c.length; }, 0);
    var vocab = new Map();
    for (var i = 0; i < 256; i++) vocab.set(i, [i]);
    var merges = [];
    function flat() { return [].concat.apply([], chunks); }
    var snapshots = [flat()];
    for (var m = 0; m < maxMerges; m++) {
      var counts = new Map();
      chunks.forEach(function (ids) {
        for (var j = 0; j < ids.length - 1; j++) {
          var key = ids[j] * 65536 + ids[j + 1];
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      });
      var best = -1, bestCount = 1;
      counts.forEach(function (c, k) { if (c > bestCount) { best = k; bestCount = c; } });
      if (best < 0) break;
      var a = Math.floor(best / 65536), b = best % 65536, newId = 256 + m;
      chunks = chunks.map(function (ids) {
        var out = [];
        for (var k = 0; k < ids.length;) {
          if (k < ids.length - 1 && ids[k] === a && ids[k + 1] === b) { out.push(newId); k += 2; }
          else { out.push(ids[k]); k += 1; }
        }
        return out;
      });
      vocab.set(newId, vocab.get(a).concat(vocab.get(b)));
      merges.push({ a: a, b: b, id: newId, count: bestCount });
      snapshots.push(flat());
    }
    return { bytesLen: bytesLen, vocab: vocab, merges: merges, snapshots: snapshots };
  }
  var strictDecoder = new TextDecoder('utf-8', { fatal: true });
  function bytesToText(arr) {
    try { return strictDecoder.decode(new Uint8Array(arr)); }
    catch (e) { return '⟨' + arr.map(function (x) { return x.toString(16).padStart(2, '0'); }).join(',') + '⟩'; }
  }

  DEMOS.tokenizer = function (root) {
    var body = panel(root, 'Try it: train a tiny tokenizer',
      'Edit the text, then add merges. Each merge finds the most common pair of neighboring tokens and gives it a new token ID: the vocabulary grows by one and the sequence gets shorter.');
    var DEFAULT = 'the tokenizer finds the most common pair. then the tokenizer merges that pair into a new token. more merges, fewer tokens.';
    var ta = h('textarea', { class: 'input', rows: '3', maxlength: '400', spellcheck: 'false', 'aria-label': 'Text to tokenize' });
    ta.value = DEFAULT;
    var range = h('input', { type: 'range', min: '0', max: '0', step: '1', value: '0', class: 'range', 'aria-label': 'Number of merges' });
    var more = button('Add a merge', 'small');
    var less = button('Undo', 'small secondary');
    var idsBox = h('input', { type: 'checkbox', id: uid('ids') });
    var idsLabel = h('label', { class: 'check', for: idsBox.id }, idsBox, 'Show token IDs');
    var stats = h('div');
    var chips = h('div', { class: 'chips tokbox' });
    var info = h('p', { class: 'merge-info', 'aria-live': 'polite' });
    body.append(
      ta,
      h('div', { class: 'controls' }, more, less, h('label', { class: 'range-wrap' }, h('span', { class: 'sr-only' }, 'Merges'), range), idsLabel),
      stats, chips, info,
      h('p', { class: 'demo-note' }, 'Dots stand for spaces. Like GPT tokenizers, merges stay inside a word and the space in front of it. A real tokenizer is trained once on a huge amount of text (GPT-4\'s has 100,277 tokens); this one learns only from the text above.')
    );
    var model;
    function retrain() {
      model = trainBPE(ta.value || ' ', 60);
      range.max = String(model.merges.length);
      if (+range.value > model.merges.length) range.value = String(model.merges.length);
      draw();
    }
    function draw() {
      var m = +range.value;
      var seq = model.snapshots[m];
      clear(stats);
      stats.append(readout([
        ['Merges', String(m)],
        ['Vocabulary', (256 + m).toLocaleString() + ' tokens'],
        ['Sequence', seq.length + ' tokens, from ' + model.bytesLen + ' bytes']
      ]));
      clear(chips);
      var showIds = idsBox.checked;
      seq.forEach(function (id, i) {
        var text = bytesToText(model.vocab.get(id));
        var c = showIds ? h('span', { class: 'tok num t' + (i % 4), title: text }, String(id)) : chip(text, 't' + (i % 4) + (id >= 256 ? ' merged' : ''), 'Token ' + id);
        chips.append(c);
      });
      if (m === 0) info.textContent = 'No merges yet: every byte is its own token, with an ID from 0 to 255.';
      else {
        var mg = model.merges[m - 1];
        info.textContent = 'Merge ' + m + ': "' + bytesToText(model.vocab.get(mg.a)).replace(/ /g, '·') + '" + "' +
          bytesToText(model.vocab.get(mg.b)).replace(/ /g, '·') + '" became token ' + mg.id + ' (the pair appeared ' + mg.count + ' times).';
      }
      more.disabled = m >= model.merges.length;
      less.disabled = m <= 0;
    }
    ta.addEventListener('input', debounce(retrain, 150));
    range.addEventListener('input', draw);
    more.addEventListener('click', function () { range.value = String(Math.min(+range.max, +range.value + 1)); draw(); });
    less.addEventListener('click', function () { range.value = String(Math.max(0, +range.value - 1)); draw(); });
    idsBox.addEventListener('change', draw);
    retrain();
  };

  /* ───────────── Step 3: one training step ───────────── */
  DEMOS.trainStep = function (root) {
    var body = panel(root, 'Try it: one training step at a time',
      'In this window of training text, the token after "The cat sat on the" was " mat". Each training step nudges the network so that " mat" becomes more likely.');
    var context = ['The', ' cat', ' sat', ' on', ' the'];
    var cands = [' mat', ' floor', ' sofa', ' roof', ' bed', ' table', ' moon', ' keyboard'];
    var init = [0.2, 0.9, 0.5, 0.1, 0.6, 0.4, -0.3, 0.0];
    var LR = 1.0;
    var z = init.slice(), steps = 0;
    var ctx = h('div', { class: 'chips ctx' });
    context.forEach(function (t) { ctx.append(chip(t, 't0')); });
    ctx.append(h('span', { class: 'ctx-arrow', 'aria-hidden': 'true' }, '→'), h('span', { class: 'tok qmark' }, '?'));
    var stats = h('div');
    var barsBox = h('div', { 'aria-live': 'polite' });
    var stepBtn = button('Run a training step', '', function () {
      var p = softmax(z);
      for (var i = 0; i < z.length; i++) z[i] -= LR * (p[i] - (i === 0 ? 1 : 0));
      steps += 1; draw();
    });
    var resetBtn = button('Reset', 'secondary', function () { z = init.slice(); steps = 0; draw(); });
    body.append(ctx, h('div', { class: 'controls' }, stepBtn, resetBtn), stats, barsBox,
      h('p', { class: 'demo-note' }, 'A real step updates billions of parameters using millions of windows at once, and scores all 100,277 tokens. Here we adjust just these 8 scores with the same rule: gradient descent on the loss.'));
    function draw() {
      var p = softmax(z);
      clear(stats);
      stats.append(readout([['Training steps', String(steps)], ['Loss', (-Math.log(p[0])).toFixed(2)], ['Chance of " mat"', pct(p[0])]]));
      clear(barsBox);
      barsBox.append(bars(cands.map(function (c, i) {
        return { label: chip(c, i === 0 ? 't1' : 'plain'), value: p[i], emph: i === 0 };
      })));
    }
    draw();
  };

  /* ───────────── Step 4: tiny language model sampler ───────────── */
  var CORPUS = [
    'the model reads the internet one token at a time.',
    'the model learns to predict the next token.',
    'the next token is chosen at random from a list of likely tokens.',
    'a likely token is not always the right token.',
    'the model writes one token at a time and adds each token to the text.',
    'then the text goes back into the model and the model predicts again.',
    'the model has no memory except the text in front of it.',
    'a good answer is written one step at a time.',
    'a bad answer jumps to the end and hopes for the best.',
    'the internet is full of text and the text is full of patterns.',
    'the model learns the patterns and forgets most of the pages.',
    'sometimes the model remembers a page word for word.',
    'sometimes the model makes up a page that never existed.'
  ];
  function words(str) { return str.toLowerCase().replace(/\./g, ' . ').split(/\s+/).filter(Boolean); }

  DEMOS.sampler = function (root) {
    var body = panel(root, 'Try it: sample from a tiny language model',
      'This toy model learned word statistics from a short training text. At each step it looks at the last word or two, gets probabilities for the next word, and samples one.');
    var toks = [];
    CORPUS.forEach(function (line) { toks = toks.concat(words(line)); });
    var uni = new Map(), bi = new Map(), tri = new Map();
    function inc(map, key, w) { var m = map.get(key); if (!m) { m = new Map(); map.set(key, m); } m.set(w, (m.get(w) || 0) + 1); }
    toks.forEach(function (w, i) {
      uni.set(w, (uni.get(w) || 0) + 1);
      if (i > 0) inc(bi, toks[i - 1], w);
      if (i > 1) inc(tri, toks[i - 2] + ' ' + toks[i - 1], w);
    });
    var sentences = new Set(CORPUS.map(function (l) { return words(l).join(' '); }));

    var prompt = h('input', { class: 'input', type: 'text', value: 'the model', 'aria-label': 'Prompt', maxlength: '60', autocomplete: 'off' });
    var ctxSel = h('select', { class: 'input select', 'aria-label': 'How many words of context' },
      h('option', { value: '1' }, 'Context: last word'), h('option', { value: '2' }, 'Context: last 2 words'));
    var temp = h('input', { type: 'range', min: '0.1', max: '2', step: '0.1', value: '1', class: 'range', 'aria-label': 'Temperature' });
    var tempVal = h('output', null, '1.0');
    var out = h('p', { class: 'gen', 'aria-live': 'polite' });
    var candBox = h('div');
    var verdict = h('p', { class: 'demo-note verdict', 'aria-live': 'polite' });
    var nextBtn = button('Next word', '', function () { step(); render(); });
    var runBtn = button('Write 20 words', 'secondary', function () { for (var i = 0; i < 20; i++) step(); render(); });
    var resetBtn = button('Start over', 'secondary', function () { reset(); render(); });
    var details = h('details', { class: 'corpus' }, h('summary', null, 'Show the training text'),
      h('p', null, CORPUS.join(' ')));
    body.append(
      h('div', { class: 'controls' }, h('label', { class: 'grow' }, h('span', { class: 'sr-only' }, 'Prompt'), prompt), ctxSel),
      h('div', { class: 'controls' }, h('label', { class: 'range-wrap' }, 'Temperature ', temp, ' ', tempVal)),
      h('div', { class: 'controls' }, nextBtn, runBtn, resetBtn),
      out, candBox, verdict, details,
      h('p', { class: 'demo-note' }, 'Temperature is a common sampling setting: low values stick to the likeliest words, high values make rare words more likely. Try 2 words of context to see more copying from the training text.')
    );

    var seq, genStart, lastNote;
    function reset() {
      seq = words(prompt.value || 'the');
      genStart = seq.length;
      lastNote = '';
    }
    function dist() {
      var mode = +ctxSel.value;
      var last = seq[seq.length - 1], last2 = seq.slice(-2).join(' ');
      var table = null, ctxLabel = '', note = '';
      if (mode === 2 && seq.length >= 2 && tri.has(last2)) { table = tri.get(last2); ctxLabel = last2; }
      else if (bi.has(last)) { table = bi.get(last); ctxLabel = last; if (mode === 2) note = 'Those two words never appear together in the training text, so it falls back to one word of context.'; }
      else { table = uni; ctxLabel = ''; note = '"' + last + '" isn\'t in the training text, so it uses overall word frequencies.'; }
      var T = +temp.value;
      var entries = Array.from(table.entries());
      var weights = entries.map(function (e) { return Math.pow(e[1], 1 / T); });
      var sum = weights.reduce(function (a, b) { return a + b; }, 0);
      return { entries: entries, probs: weights.map(function (w) { return w / sum; }), ctx: ctxLabel, note: note };
    }
    function step() {
      var d = dist();
      var i = pick(d.probs);
      seq.push(d.entries[i][0]);
    }
    function render() {
      tempVal.textContent = (+temp.value).toFixed(1);
      clear(out);
      seq.forEach(function (w, i) {
        var text = (w === '.' || i === 0) ? w : ' ' + w;
        if (i < genStart) out.append(document.createTextNode(text));
        else out.append(h('span', { class: 'gen-word' }, text));
      });
      out.append(h('span', { class: 'caret', 'aria-hidden': 'true' }));
      var d = dist();
      var order = d.probs.map(function (p, i) { return i; }).sort(function (a, b) { return d.probs[b] - d.probs[a]; }).slice(0, 5);
      clear(candBox);
      candBox.append(h('p', { class: 'bars-title' }, d.ctx ? 'Next-word probabilities after "' + d.ctx + '"' : 'Next-word probabilities'));
      candBox.append(bars(order.map(function (i) {
        return { label: chip(d.entries[i][0] === '.' ? '.' : ' ' + d.entries[i][0], 'plain'), value: d.probs[i] };
      })));
      if (d.note) candBox.append(h('p', { class: 'demo-note' }, d.note));
      // Was the last finished, generated sentence copied from the training text?
      var gen = seq.slice(genStart);
      var lastDot = seq.lastIndexOf('.');
      verdict.textContent = '';
      if (gen.length && lastDot >= genStart) {
        var prevDot = seq.lastIndexOf('.', lastDot - 1);
        var sent = seq.slice(prevDot + 1, lastDot + 1).join(' ');
        verdict.textContent = sentences.has(sent)
          ? 'The last sentence is copied word for word from the training text: regurgitation.'
          : 'The last sentence never appears in the training text: it\'s a remix.';
      }
    }
    prompt.addEventListener('change', function () { reset(); render(); });
    prompt.addEventListener('keydown', function (e) { if (e.key === 'Enter') { reset(); render(); } });
    ctxSel.addEventListener('change', render);
    temp.addEventListener('input', render);
    reset(); render();
  };

  /* ───────────── Step 5: scrub through a training run ───────────── */
  DEMOS.trainingRun = function (root) {
    var body = panel(root, 'Try it: scrub through a training run',
      'Drag through the 32,000 updates of a GPT-2-sized run. The loss falls fast at first, then slowly, and the generated text goes from gibberish to fluent.');
    var MAX = 32000;
    function loss(stepN) { return 2.9 + 7.9 * Math.pow(1 + stepN / 40, -0.9); }
    var samples = [
      { upTo: 30, label: 'Gibberish', text: 'tg, wnd eoa ,, rhe fl ic a. pmu oh wb ,thhe s, nnr' },
      { upTo: 1500, label: 'Locally coherent, globally nonsense', text: 'the of the city was in a and he said that the new of a time is the' },
      { upTo: 12000, label: 'Grammatical, but drifting', text: 'The city council said the new park would be open in the summer, but the plan was the most of the year for the people.' },
      { upTo: Infinity, label: 'Fluent', text: 'The city council approved the new park on Tuesday. Construction should begin next spring, and officials expect it to open the following summer.' }
    ];
    var slider = h('input', { type: 'range', min: '0', max: '1000', step: '1', value: '0', class: 'range wide', 'aria-label': 'Training step' });
    var stats = h('div');
    var W = 320, H = 170, ml = 36, mr = 12, mt = 10, mb = 30;
    var pw = W - ml - mr, ph = H - mt - mb;
    var lx = function (st) { return ml + (Math.log10(st) / Math.log10(MAX)) * pw; };
    var ly = function (l) { return mt + (1 - (l - 2.5) / (11 - 2.5)) * ph; };
    var chart = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img', 'aria-label': 'Training loss falling from about 10.7 at step 1 to about 2.9 at step 32,000, on a logarithmic step axis.' });
    [3, 5, 7, 9, 11].forEach(function (v) {
      chart.append(s('line', { x1: ml, x2: W - mr, y1: ly(v), y2: ly(v), class: 'grid' }));
      chart.append(s('text', { x: ml - 6, y: ly(v) + 4, class: 'tick', 'text-anchor': 'end' }, String(v)));
    });
    [[1, '1'], [10, '10'], [100, '100'], [1000, '1K'], [10000, '10K'], [32000, '32K']].forEach(function (t) {
      chart.append(s('text', { x: lx(t[0]), y: H - mb + 16, class: 'tick', 'text-anchor': t[0] === 32000 ? 'end' : 'middle' }, t[1]));
    });
    chart.append(s('text', { x: ml + pw / 2, y: H - 2, class: 'axis-label', 'text-anchor': 'middle' }, 'Training step (log scale)'));
    chart.append(s('text', { x: 10, y: mt + ph / 2, class: 'axis-label', 'text-anchor': 'middle', transform: 'rotate(-90 10 ' + (mt + ph / 2) + ')' }, 'Loss'));
    var d = '';
    for (var i = 0; i <= 120; i++) {
      var st = Math.pow(MAX, i / 120);
      d += (i ? 'L' : 'M') + lx(st).toFixed(1) + ' ' + ly(loss(st)).toFixed(1);
    }
    chart.append(s('path', { d: d, class: 'line pre' }));
    var dot = s('circle', { r: 5, class: 'dot pre' });
    chart.append(dot);
    var sampleBox = h('div', { class: 'sample' });
    body.append(h('div', { class: 'controls' }, h('label', { class: 'range-wrap wide' }, h('span', { class: 'sr-only' }, 'Training step'), slider)), stats, chart, sampleBox,
      h('p', { class: 'demo-note' }, 'Illustrative: the curve and the sample texts are made up to match the shape described in the lecture. They are not real outputs.'));
    function fmtTokens(n) {
      if (n >= 1e9) return 'about ' + (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + ' billion';
      return 'about ' + Math.max(1, Math.round(n / 1e6)) + ' million';
    }
    function draw() {
      var stepN = Math.max(1, Math.round(Math.pow(MAX, +slider.value / 1000)));
      var l = loss(stepN);
      dot.setAttribute('cx', lx(stepN)); dot.setAttribute('cy', ly(l));
      clear(stats);
      stats.append(readout([['Step', stepN.toLocaleString() + ' of 32,000'], ['Tokens seen', fmtTokens(stepN * 1e6)], ['Loss', l.toFixed(2)]]));
      var smp = samples.find(function (x) { return stepN <= x.upTo; });
      clear(sampleBox);
      sampleBox.append(h('p', { class: 'sample-label' }, 'Sample text: ' + smp.label.toLowerCase()), h('p', { class: 'sample-text' }, smp.text));
    }
    slider.addEventListener('input', draw);
    draw();
  };

  /* ───────────── Step 6: prompts for a base model ───────────── */
  DEMOS.basePrompts = function (root) {
    var body = panel(root, 'Try it: prompts for a base model',
      'Copy one into a base model, such as Llama 3.1 405B Base on Hyperbolic, and see how it continues. A chat model will behave differently, because it has been post-trained.');
    var prompts = [
      { title: 'Few-shot translation', text: 'English: Korean\n\napple: 사과\nhouse: 집\ndog: 개\nbook: 책\nwater: 물\nschool: 학교\nteacher:' },
      { title: 'An assistant made from a base model', text: 'The following is a conversation between a helpful, knowledgeable AI assistant and a human. The assistant answers clearly and honestly.\n\nHuman: Hi! What\'s the capital of Japan?\nAssistant: The capital of Japan is Tokyo.\n\nHuman: How many legs does a spider have?\nAssistant: A spider has eight legs.\n\nHuman: Why is the sky blue?\nAssistant:' },
      { title: 'A question, or the start of a document?', text: 'What is 2+2?' }
    ];
    prompts.forEach(function (p) {
      var pre = h('pre', { class: 'prompt' }, h('code', null, p.text));
      var copyBtn = button('Copy', 'small secondary');
      copyBtn.addEventListener('click', function () {
        var done = function () { copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1600); };
        try {
          navigator.clipboard.writeText(p.text).then(done, function () { selectText(pre); });
        } catch (e) { selectText(pre); }
      });
      body.append(h('div', { class: 'prompt-card' }, h('div', { class: 'prompt-head' }, h('h3', null, p.title), copyBtn), pre));
    });
    function selectText(node) {
      var r = document.createRange(); r.selectNodeContents(node);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }
  };

  /* ───────────── Step 7: chat view vs token view ───────────── */
  DEMOS.chatTokens = function (root) {
    var body = panel(root, 'Try it: what the model actually sees',
      'Switch between the chat you see and the single token sequence the model is trained on. Then send a message to see where the model starts writing.');
    var base = [
      { role: 'user', text: 'What is 2+2?' },
      { role: 'assistant', text: '2 + 2 = 4.' },
      { role: 'user', text: 'And what is 2 × 3?' },
      { role: 'assistant', text: '2 × 3 = 6.' }
    ];
    var conv = base.slice(), pending = false, view = 'chat';
    var tabChat = h('button', { type: 'button', role: 'tab', class: 'tab' }, 'Chat view');
    var tabTok = h('button', { type: 'button', role: 'tab', class: 'tab' }, 'What the model sees');
    var tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'View' }, tabChat, tabTok);
    var stage = h('div', { class: 'convo', role: 'tabpanel', 'aria-live': 'polite' });
    var input = h('input', { class: 'input', type: 'text', value: 'Why is the sky blue?', maxlength: '80', 'aria-label': 'Your message', autocomplete: 'off' });
    var send = button('Send', '', function () { submit(); });
    var reset = button('Reset', 'secondary', function () { conv = base.slice(); pending = false; render(); });
    body.append(tabs, stage, h('form', { class: 'controls', onsubmit: function (e) { e.preventDefault(); submit(); } }, h('label', { class: 'grow' }, h('span', { class: 'sr-only' }, 'Your message'), input), send, reset),
      h('p', { class: 'demo-note' }, 'Special tokens follow GPT-4o\'s format; other models use different but similar templates. Turns are shown on separate lines for readability. To the model, it\'s one long sequence.'));
    function submit() {
      var text = input.value.trim();
      if (!text) return;
      if (pending) conv.pop();
      conv.push({ role: 'user', text: text });
      pending = true; view = 'tokens'; render();
    }
    function sp(t) { return h('span', { class: 'tok special' }, t); }
    function render() {
      tabChat.setAttribute('aria-selected', String(view === 'chat'));
      tabTok.setAttribute('aria-selected', String(view === 'tokens'));
      clear(stage);
      stage.className = 'convo ' + (view === 'chat' ? 'is-chat' : 'is-tokens');
      if (view === 'chat') {
        conv.forEach(function (m) { stage.append(h('div', { class: 'bubble ' + m.role }, h('span', { class: 'who' }, m.role === 'user' ? 'You' : 'Assistant'), m.text)); });
        if (pending) stage.append(h('div', { class: 'bubble assistant waiting' }, h('span', { class: 'who' }, 'Assistant'), 'The model would now sample a reply, one token at a time…'));
      } else {
        conv.forEach(function (m) {
          stage.append(h('div', { class: 'turn' }, sp('<|im_start|>'), chip(m.role, 'plain'), sp('<|im_sep|>'), h('span', { class: 'turn-text' }, m.text), sp('<|im_end|>')));
        });
        if (pending) {
          stage.append(h('div', { class: 'turn' }, sp('<|im_start|>'), chip('assistant', 'plain'), sp('<|im_sep|>'), h('span', { class: 'caret' }), h('span', { class: 'caret-label' }, 'the model starts sampling here')));
        }
      }
    }
    tabChat.addEventListener('click', function () { view = 'chat'; render(); });
    tabTok.addEventListener('click', function () { view = 'tokens'; render(); });
    render();
  };

  /* ───────────── Step 8: a tool call, frame by frame ───────────── */
  DEMOS.toolUse = function (root) {
    var body = panel(root, 'Try it: a search, step by step', 'Here\'s how a tool call fits into the token sequence, using Karpathy\'s made-up person.');
    function sp(t) { return { k: 'sp', t: t }; }
    var q = [sp('<|im_start|>'), { k: 'role', t: 'user' }, sp('<|im_sep|>'), { k: 'text', t: 'Who is Orson Kovats?' }, sp('<|im_end|>'), sp('<|im_start|>'), { k: 'role', t: 'assistant' }, sp('<|im_sep|>')];
    var search = [sp('<SEARCH_START>'), { k: 'model', t: 'Orson Kovats' }, sp('<SEARCH_END>')];
    var results = [{ k: 'tool', t: 'Search results: no well-known person by this name; a few unrelated pages.' }];
    var answer = [{ k: 'model', t: 'I couldn\'t find any well-known person named Orson Kovats. Where did you come across the name?' }, sp('<|im_end|>')];
    var frames = [
      { cap: 'You ask a question. The assistant\'s turn begins, and the model starts sampling.', seq: q.concat([{ k: 'caret' }]) },
      { cap: 'Instead of guessing, the model emits special tokens that ask for a search.', seq: q.concat(search) },
      { cap: 'The system pauses the model, runs the search and pastes the results into the context window.', seq: q.concat(search, results) },
      { cap: 'The model continues, now reading the results in its working memory.', seq: q.concat(search, results, answer) }
    ];
    var i = 0;
    var cap = h('p', { class: 'frame-cap', 'aria-live': 'polite' });
    var seqBox = h('div', { class: 'convo is-tokens frame' });
    var back = button('Back', 'secondary', function () { if (i > 0) { i--; draw(); } });
    var next = button('Next', '', function () { if (i < frames.length - 1) { i++; draw(); } });
    var count = h('span', { class: 'frame-count' });
    body.append(cap, seqBox, h('div', { class: 'controls' }, back, next, count));
    function draw() {
      var f = frames[i];
      cap.textContent = f.cap;
      count.textContent = 'Step ' + (i + 1) + ' of ' + frames.length;
      clear(seqBox);
      var line = h('div', { class: 'turn' });
      f.seq.forEach(function (p) {
        if (p.k === 'sp') line.append(h('span', { class: 'tok special' }, p.t));
        else if (p.k === 'role') line.append(chip(p.t, 'plain'));
        else if (p.k === 'text') line.append(h('span', { class: 'turn-text' }, p.t));
        else if (p.k === 'model') line.append(h('span', { class: 'turn-text model' }, p.t));
        else if (p.k === 'tool') line.append(h('span', { class: 'tool-out' }, p.t));
        else if (p.k === 'caret') line.append(h('span', { class: 'caret' }));
      });
      seqBox.append(line);
      back.disabled = i === 0; next.disabled = i === frames.length - 1;
    }
    draw();
  };

  /* ───────────── Step 9: tokens to think ───────────── */
  DEMOS.thinkTokens = function (root) {
    var body = panel(root, 'Try it: pick the better training example', null);
    var A = 'The answer is $3. This is because 2 oranges at $2 each cost $4, which leaves $9 for 3 apples, and $9 ÷ 3 = $3.';
    var B = 'The oranges cost 2 × $2 = $4. That leaves $13 − $4 = $9 for the apples. So each apple costs $9 ÷ 3 = $3.';
    function approxTokens(str) { return (str.match(/\$|\d+|[A-Za-z]+|[^\s\w]/g) || []).length; }
    var beforeA = approxTokens('The answer is $');
    var beforeB = approxTokens(B.slice(0, B.lastIndexOf('$3') + 1));
    var verdict = h('div', { class: 'verdict-box', hidden: true, 'aria-live': 'polite' });
    var optA = h('button', { type: 'button', class: 'choice' }, h('span', { class: 'choice-tag' }, 'Answer A'), A);
    var optB = h('button', { type: 'button', class: 'choice' }, h('span', { class: 'choice-tag' }, 'Answer B'), B);
    function cells(n, label) {
      var row = h('div', { class: 'cells', 'aria-hidden': 'true' });
      for (var i = 0; i < n; i++) row.append(h('span', { class: 'cell' }));
      return h('div', { class: 'cells-wrap' }, row, h('p', { class: 'cells-label' }, label));
    }
    function choose(which) {
      optA.classList.toggle('is-picked', which === 'A');
      optB.classList.toggle('is-picked', which === 'B');
      optA.setAttribute('aria-pressed', String(which === 'A'));
      optB.setAttribute('aria-pressed', String(which === 'B'));
      clear(verdict);
      verdict.hidden = false;
      verdict.append(
        h('p', { class: 'verdict-head' }, which === 'B' ? 'Yes: B is the better training example.' : 'Not quite: B is the better training example.'),
        h('p', null, 'Every token gets the same small, fixed amount of computation. A commits to "$3" in about ' + beforeA + ' tokens, so the whole calculation would have to fit in those few tokens; everything after that only justifies an answer already given. B writes each intermediate result down, so later tokens can build on it, and spreads the work over about ' + beforeB + ' tokens before the final answer.'),
        h('p', { class: 'cells-title' }, 'Tokens of computation before the final answer (approximate)'),
        cells(beforeA, 'Answer A: about ' + beforeA),
        cells(beforeB, 'Answer B: about ' + beforeB)
      );
    }
    optA.addEventListener('click', function () { choose('A'); });
    optB.addEventListener('click', function () { choose('B'); });
    body.append(h('div', { class: 'choices' }, optA, optB), verdict);
  };

  /* ───────────── Step 10: letters vs tokens ───────────── */
  DEMOS.spelling = function (root) {
    var body = panel(root, 'Try it: letters versus tokens', 'Flip between the letters you see and the tokens a model sees.');
    var items = [
      { word: 'strawberry', toks: ['str', 'aw', 'berry'], task: 'Count the r\'s', hit: function (ch) { return ch === 'r'; }, answer: '3 r\'s' },
      { word: 'ubiquitous', toks: ['ub', 'iqu', 'itous'], task: 'Every third letter, starting with the first', hit: function (ch, i) { return i % 3 === 0; }, answer: 'u, q, t, s' }
    ];
    var mode = 'letters';
    var bLetters = h('button', { type: 'button', class: 'seg-btn' }, 'Letters');
    var bTokens = h('button', { type: 'button', class: 'seg-btn' }, 'Tokens');
    var box = h('div', { class: 'spell', 'aria-live': 'polite' });
    body.append(h('div', { class: 'segmented', role: 'group', 'aria-label': 'View as' }, bLetters, bTokens), box,
      h('p', { class: 'demo-note' }, 'The token splits are illustrative of a GPT-4-style tokenizer.'));
    function draw() {
      bLetters.setAttribute('aria-pressed', String(mode === 'letters'));
      bTokens.setAttribute('aria-pressed', String(mode === 'tokens'));
      clear(box);
      items.forEach(function (it) {
        var row = h('div', { class: 'spell-row' });
        if (mode === 'letters') {
          var letters = h('div', { class: 'letters' });
          it.word.split('').forEach(function (ch, i) { letters.append(h('span', { class: 'letter' + (it.hit(ch, i) ? ' hit' : '') }, ch)); });
          row.append(h('p', { class: 'spell-task' }, it.task + ': ', h('strong', null, it.answer)), letters);
        } else {
          var tk = h('div', { class: 'chips' });
          it.toks.forEach(function (t, i) { tk.append(chip(t, 't' + (i % 4))); });
          row.append(h('p', { class: 'spell-task' }, it.task + ': the letters are hidden inside ' + it.toks.length + ' tokens'), tk);
        }
        box.append(row);
      });
    }
    bLetters.addEventListener('click', function () { mode = 'letters'; draw(); });
    bTokens.addEventListener('click', function () { mode = 'tokens'; draw(); });
    draw();
  };

  /* ───────────── Step 11: a toy RL loop ───────────── */
  DEMOS.rlSim = function (root) {
    var body = panel(root, 'Try it: a toy reinforcement learning loop',
      'After SFT, this model mostly imitates short answers. Each round it makes 20 attempts at the Emily problem, each attempt is checked against the answer ($3), and whatever led to correct answers gets reinforced.');
    var strategies = [
      { name: 'Blurt the answer right away', succ: 0.15 },
      { name: 'Copy a short labeler-style answer', succ: 0.45 },
      { name: 'Set up an equation', succ: 0.70 },
      { name: 'Work step by step, then double-check', succ: 0.92 }
    ];
    var INIT = [0.40, 0.33, 0.17, 0.10], N = 20, LR = 5;
    var z, round, history, lastAttempts, running = false;
    var policyBox = h('div');
    var grid = h('div', { class: 'attempts', 'aria-label': 'Attempts in the latest round' });
    var stats = h('div');
    var chartBox = h('div');
    var one = button('Run a round', '', function () { runRounds(1); });
    var ten = button('Run 10 rounds', 'secondary', function () { runRounds(10); });
    var reset = button('Reset', 'secondary', function () { if (!running) { init(); draw(); } });
    body.append(h('p', { class: 'bars-title' }, 'How often the model uses each strategy'), policyBox,
      h('div', { class: 'controls' }, one, ten, reset), stats, grid, chartBox,
      h('p', { class: 'demo-note' }, 'A toy simulation. The four strategies stand in for the countless ways a model could write a solution, and in real RL the model\'s parameters change, not a list of four numbers. The update rule here is a basic policy gradient.'));
    function init() { z = INIT.map(Math.log); round = 0; history = []; lastAttempts = []; }
    function doRound() {
      var p = softmax(z), atts = [];
      for (var i = 0; i < N; i++) {
        var st = pick(p);
        atts.push({ s: st, ok: Math.random() < strategies[st].succ });
      }
      var mean = atts.reduce(function (a, x) { return a + (x.ok ? 1 : 0); }, 0) / N;
      var g = [0, 0, 0, 0];
      atts.forEach(function (x) {
        var adv = (x.ok ? 1 : 0) - mean;
        for (var k = 0; k < 4; k++) g[k] += adv * ((k === x.s ? 1 : 0) - p[k]);
      });
      for (var k = 0; k < 4; k++) z[k] += LR * g[k] / N;
      round += 1; history.push(mean); lastAttempts = atts;
    }
    function runRounds(n) {
      if (running) return;
      if (n === 1 || reducedMotion()) { for (var i = 0; i < n; i++) doRound(); draw(); return; }
      running = true; setBusy(true);
      var left = n;
      (function tick() {
        doRound(); draw(); left -= 1;
        if (left > 0) setTimeout(tick, 140); else { running = false; setBusy(false); }
      })();
    }
    function setBusy(b) { one.disabled = b; ten.disabled = b; reset.disabled = b; }
    function draw() {
      var p = softmax(z);
      clear(policyBox);
      policyBox.append(bars(strategies.map(function (st, i) {
        return {
          label: h('span', { class: 'strategy' }, h('span', { class: 'num-badge' }, String(i + 1)),
            h('span', null, st.name, h('span', { class: 'strategy-meta' }, 'Gets the right answer ' + Math.round(st.succ * 100) + '% of the time'))),
          value: p[i], emph: i === 3
        };
      }), { cls: 'wide-labels' }));
      clear(stats);
      var correct = lastAttempts.filter(function (x) { return x.ok; }).length;
      stats.append(readout([['Round', String(round)], ['Latest round', round ? correct + ' of ' + N + ' correct' : 'not run yet']]));
      clear(grid);
      lastAttempts.forEach(function (x, i) {
        grid.append(h('span', { class: 'attempt' + (x.ok ? ' ok' : ' bad'), title: 'Attempt ' + (i + 1) + ': strategy ' + (x.s + 1) + (x.ok ? ', correct' : ', wrong') },
          h('span', { class: 'attempt-s' }, String(x.s + 1)), h('span', { class: 'attempt-mark' }, x.ok ? '✓' : '✗'),
          h('span', { class: 'sr-only' }, x.ok ? 'correct' : 'wrong')));
      });
      clear(chartBox);
      if (history.length) chartBox.append(accuracyChart(history));
    }
    function accuracyChart(hist) {
      var W = 320, H = 130, ml = 34, mr = 12, mt = 16, mb = 26;
      var pw = W - ml - mr, ph = H - mt - mb;
      var n = Math.max(20, hist.length);
      var x = function (i) { return ml + (i / (n - 1)) * pw; };
      var y = function (v) { return mt + (1 - v) * ph; };
      var svgEl = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img', 'aria-label': 'Share of correct attempts per round. Latest: ' + Math.round(hist[hist.length - 1] * 100) + '% in round ' + hist.length + '.' });
      svgEl.append(s('text', { x: ml, y: 10, class: 'chart-title' }, 'Correct attempts per round'));
      [0, 0.5, 1].forEach(function (v) {
        svgEl.append(s('line', { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: 'grid' }));
        svgEl.append(s('text', { x: ml - 6, y: y(v) + 4, class: 'tick', 'text-anchor': 'end' }, Math.round(v * 100) + '%'));
      });
      svgEl.append(s('text', { x: ml, y: H - 6, class: 'tick' }, 'Round 1'));
      svgEl.append(s('text', { x: W - mr, y: H - 6, class: 'tick', 'text-anchor': 'end' }, 'Round ' + n));
      if (hist.length > 1) {
        var dd = hist.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
        svgEl.append(s('path', { d: dd, class: 'line rl' }));
      }
      var li = hist.length - 1;
      svgEl.append(s('circle', { cx: x(li), cy: y(hist[li]), r: 4.5, class: 'dot rl' }));
      return svgEl;
    }
    init(); draw();
  };

  /* ───────────── Step 12: imitation vs RL (figure) ───────────── */
  DEMOS.alphaChart = function (root) {
    var body = figure(root, 'Illustrative shapes, after the AlphaGo Zero paper: imitation levels off near the strength of its human examples, while RL keeps improving past the best humans.', 'chart-fig');
    var W = 340, H = 210, ml = 30, mr = 16, mt = 14, mb = 30;
    var pw = W - ml - mr, ph = H - mt - mb;
    var x = function (t) { return ml + t * pw; };
    var y = function (v) { return mt + (1 - v) * ph; };
    function sl(t) { return 0.05 + 0.6 * (1 - Math.exp(-t / 0.1)); }
    function rl(t) { return 0.02 + Math.pow(1 - Math.exp(-t / 0.38), 1.4); }
    var svgEl = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img', 'aria-label': 'Two illustrative curves of playing strength over training time. Imitation of human experts rises quickly then levels off below the best human players. Reinforcement learning rises more slowly but passes the best humans.' });
    svgEl.append(s('line', { x1: ml, x2: W - mr, y1: y(0), y2: y(0), class: 'axis' }));
    svgEl.append(s('line', { x1: ml, x2: ml, y1: mt, y2: y(0), class: 'axis' }));
    svgEl.append(s('line', { x1: ml, x2: W - mr, y1: y(0.72), y2: y(0.72), class: 'ref' }));
    svgEl.append(s('text', { x: ml + 4, y: y(0.72) - 6, class: 'tick' }, 'Best human players'));
    function path(fn) {
      var d = '';
      for (var i = 0; i <= 100; i++) { var t = i / 100; d += (i ? 'L' : 'M') + x(t).toFixed(1) + ' ' + y(fn(t)).toFixed(1); }
      return d;
    }
    svgEl.append(s('path', { d: path(sl), class: 'line sft' }));
    svgEl.append(s('path', { d: path(rl), class: 'line rl' }));
    svgEl.append(s('circle', { cx: x(1), cy: y(sl(1)), r: 4.5, class: 'dot sft' }));
    svgEl.append(s('circle', { cx: x(1), cy: y(rl(1)), r: 4.5, class: 'dot rl' }));
    svgEl.append(s('text', { x: x(1) - 8, y: y(sl(1)) + 18, class: 'direct', 'text-anchor': 'end' }, 'Imitation'));
    svgEl.append(s('text', { x: x(1) - 8, y: y(rl(1)) - 8, class: 'direct', 'text-anchor': 'end' }, 'RL'));
    svgEl.append(s('text', { x: ml + pw / 2, y: H - 8, class: 'axis-label', 'text-anchor': 'middle' }, 'Training time'));
    svgEl.append(s('text', { x: 12, y: mt + ph / 2, class: 'axis-label', 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (mt + ph / 2) + ')' }, 'Playing strength'));
    var legend = h('ul', { class: 'legend' },
      h('li', null, h('span', { class: 'key sft', 'aria-hidden': 'true' }), 'Imitating expert human games (supervised learning)'),
      h('li', null, h('span', { class: 'key rl', 'aria-hidden': 'true' }), 'Playing itself and reinforcing wins (RL)'));
    body.append(legend, svgEl);
  };

  /* ───────────── Step 13: RLHF ranking ───────────── */
  DEMOS.rlhfRank = function (root) {
    var body = panel(root, 'Try it: be the human in RLHF',
      'Prompt: "Write a joke about pelicans." Tap the five attempts from best to worst. Your ranking is the kind of data a reward model learns from.');
    var jokes = [
      { id: 'a', text: 'Why do pelicans make terrible dinner guests? They always show up with a huge bill.', rm: 0.84 },
      { id: 'b', text: 'Pelicans are large birds that live near water and eat fish.', rm: 0.13 },
      { id: 'c', text: 'What\'s a pelican\'s favorite kind of music? Anything with a lot of bass.', rm: 0.79 },
      { id: 'd', text: 'Pelican pelican joke funny bird ha ha.', rm: 0.06 },
      { id: 'e', text: 'A pelican walks into a fish market and says, "I\'ll take whatever fits in my mouth."', rm: 0.58 }
    ];
    var order = [];
    var list = h('ol', { class: 'rank-list' });
    var result = h('div', { 'aria-live': 'polite' });
    var hack = h('div', { 'aria-live': 'polite' });
    var compare = button('Compare with the reward model', '', function () { showCompare(); });
    var startOver = button('Start over', 'secondary', function () { order = []; clear(result); clear(hack); draw(); });
    body.append(list, h('div', { class: 'controls' }, compare, startOver), result, hack);
    function draw() {
      clear(list);
      jokes.forEach(function (j) {
        var rank = order.indexOf(j.id);
        var b = h('button', { type: 'button', class: 'rank-item' + (rank >= 0 ? ' is-ranked' : ''), 'aria-pressed': String(rank >= 0) },
          h('span', { class: 'rank-badge' }, rank >= 0 ? String(rank + 1) : ''),
          h('span', { class: 'rank-text' }, j.text),
          h('span', { class: 'sr-only' }, rank >= 0 ? ' (ranked ' + (rank + 1) + ')' : ' (not ranked yet)'));
        b.addEventListener('click', function () {
          var r = order.indexOf(j.id);
          if (r >= 0) order.splice(r, 1); else order.push(j.id);
          clear(result); clear(hack); draw();
        });
        list.append(h('li', null, b));
      });
      compare.disabled = order.length < jokes.length;
      compare.textContent = order.length < jokes.length ? 'Rank all five to compare (' + order.length + ' of 5)' : 'Compare with the reward model';
    }
    function showCompare() {
      var rmOrder = jokes.slice().sort(function (a, b) { return b.rm - a.rm; }).map(function (j) { return j.id; });
      var agree = 0, total = 0;
      for (var i = 0; i < order.length; i++) for (var k = i + 1; k < order.length; k++) {
        total += 1;
        if (rmOrder.indexOf(order[i]) < rmOrder.indexOf(order[k])) agree += 1;
      }
      clear(result);
      result.append(
        h('p', { class: 'verdict-head' }, 'You and the reward model agree on ' + agree + ' of ' + total + ' pairs.'),
        h('p', { class: 'bars-title' }, 'A toy reward model\'s scores'),
        bars(jokes.slice().sort(function (a, b) { return b.rm - a.rm; }).map(function (j) {
          return { label: h('span', { class: 'joke-label' }, j.text), value: j.rm, text: j.rm.toFixed(2) };
        }), { cls: 'wide-labels stacked' }),
        h('p', { class: 'demo-note' }, 'Training pushes the reward model to agree with rankings like yours, across many prompts and many people. Then RL uses its scores instead of asking a person every time.'),
        button('Now let RL optimize for too long', 'secondary', function () { showHack(); })
      );
    }
    function showHack() {
      clear(hack);
      hack.append(
        h('div', { class: 'hack' },
          h('p', { class: 'bars-title' }, 'After thousands of RL updates, the top-scoring "joke" is:'),
          h('p', { class: 'hack-text' }, 'the the the the the the the the'),
          readout([['Reward model score', '1.00, its best ever']]),
          h('p', null, 'The reward model is only a lossy simulation of people, and RL found a blind spot. Patching this one case doesn\'t help for long; there are endless others. That\'s why RLHF runs for a few hundred updates and then stops.'))
      );
    }
    draw();
  };

  /* ───────────── Step 15: the whole pipeline (figure) ───────────── */
  DEMOS.summaryFlow = function (root) {
    var body = figure(root, null, 'summary-fig');
    var flow = h('ol', { class: 'flow compact' },
      h('li', null, h('strong', null, 'Your message'), h('span', null, 'typed into ChatGPT')),
      h('li', null, h('strong', null, 'Tokens'), h('span', null, 'wrapped in special tokens, then tokenized into IDs')),
      h('li', null, h('strong', null, 'The neural network'), h('span', null, 'predicts probabilities for the next token')),
      h('li', null, h('strong', null, 'Sample, append, repeat'), h('span', null, 'one token at a time')),
      h('li', { class: 'flow-out' }, h('strong', null, 'The reply'), h('span', null, 'detokenized back into text'))
    );
    var stages = h('div', { class: 'stage-cards' },
      h('div', { class: 'stage-card', 'data-part': '1' }, h('strong', null, 'Pretraining'), h('span', null, 'Knowledge: a lossy recollection of the internet')),
      h('div', { class: 'stage-card', 'data-part': '2' }, h('strong', null, 'SFT'), h('span', null, 'Persona: a simulation of a human labeler')),
      h('div', { class: 'stage-card', 'data-part': '3' }, h('strong', null, 'RL'), h('span', null, 'Reasoning: strategies found through practice'))
    );
    body.append(flow, h('p', { class: 'bars-title' }, 'What shaped the network'), stages);
  };

  window.DEMOS = DEMOS;
  window.LLMUI = { h: h, s: s, clear: clear, chip: chip, uid: uid, reducedMotion: reducedMotion };
})();
