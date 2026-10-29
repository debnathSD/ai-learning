/*
  App shell: hash routing, progress (saved in this browser), quizzes,
  lecture player, glossary, theme and navigation.
*/
(function () {
  'use strict';

  var T = window.TUTORIAL;
  var D = window.DEMOS || {};
  var UI = window.LLMUI;
  var h = UI.h, clear = UI.clear;
  var STEPS = T.steps, PARTS = T.parts;

  function toSec(t) { var p = t.split(':').map(Number); return p[0] * 3600 + p[1] * 60 + p[2]; }
  function clock(sec) {
    var hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
    return hh + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
  STEPS.forEach(function (st, i) { st.n = i + 1; st.i = i; st.a = toSec(st.start); st.b = toSec(st.end); });
  function mins(st) { return Math.max(1, Math.round((st.b - st.a) / 60)); }
  function yt(sec) { return T.video.url + '&t=' + sec + 's'; }
  function embed(a, b) {
    return 'https://www.youtube-nocookie.com/embed/' + T.video.id + '?start=' + a + '&end=' + b + '&rel=0&playsinline=1&autoplay=1';
  }

  /* ---------- progress, saved in this browser ---------- */
  var KEY = 'llm-deep-dive:v1';
  var state = { done: {}, quiz: {}, last: null, theme: null };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state.done = saved.done || {};
      state.quiz = saved.quiz || {};
      state.last = saved.last || null;
      state.theme = saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : null;
    }
  } catch (e) { /* storage unavailable: progress lasts for this visit only */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function doneCount() { return STEPS.filter(function (st) { return state.done[st.id]; }).length; }
  function nextUnfinished() {
    var last = STEPS.findIndex(function (st) { return st.id === state.last; });
    for (var k = Math.max(0, last); k < STEPS.length; k++) if (!state.done[STEPS[k].id]) return STEPS[k];
    for (var j = 0; j < STEPS.length; j++) if (!state.done[STEPS[j].id]) return STEPS[j];
    return STEPS[0];
  }

  /* ---------- elements ---------- */
  var main = document.getElementById('main');
  var rail = document.getElementById('rail-nav');
  var strip = document.getElementById('strip');
  var stripLabel = document.getElementById('strip-label');
  var sheet = document.getElementById('sheet');
  var sheetNav = document.getElementById('sheet-nav');
  var menuBtn = document.getElementById('menu-btn');
  var sheetClose = document.getElementById('sheet-close');
  var themeBtn = document.getElementById('theme-btn');

  /* ---------- navigation ---------- */
  function stepList(currentId) {
    var wrap = h('div', { class: 'steplist' });
    PARTS.forEach(function (part) {
      var group = h('div', { class: 'part-group', 'data-part': String(part.n) });
      group.append(h('p', { class: 'part-name' }, h('span', { class: 'part-dot', 'aria-hidden': 'true' }), 'Part ' + part.n + ': ' + part.name));
      var ol = h('ol', { class: 'steps' });
      STEPS.filter(function (st) { return st.part === part.n; }).forEach(function (st) {
        var done = !!state.done[st.id], cur = st.id === currentId;
        ol.append(h('li', null, h('a', {
          href: '#/step/' + st.id,
          class: 'step-link' + (cur ? ' is-current' : '') + (done ? ' is-done' : ''),
          'aria-current': cur ? 'page' : null
        },
          h('span', { class: 'step-num', 'aria-hidden': 'true' }, String(st.n)),
          h('span', { class: 'step-title' }, st.title, done ? h('span', { class: 'sr-only' }, ' (done)') : null),
          h('span', { class: 'step-min' }, mins(st) + ' min')
        )));
      });
      group.append(ol);
      wrap.append(group);
    });
    wrap.append(h('p', { class: 'nav-extra' },
      h('a', { href: '#/glossary', class: currentId === 'glossary' ? 'is-current' : null, 'aria-current': currentId === 'glossary' ? 'page' : null }, 'Glossary of key terms')));
    return wrap;
  }
  function renderNav(currentId) {
    clear(rail); rail.append(stepList(currentId));
    clear(sheetNav); sheetNav.append(stepList(currentId));
    clear(strip);
    STEPS.forEach(function (st) {
      var done = !!state.done[st.id];
      strip.append(h('a', {
        href: '#/step/' + st.id,
        class: 'seg' + (done ? ' is-done' : '') + (st.id === currentId ? ' is-current' : ''),
        'data-part': String(st.part),
        title: st.n + '. ' + st.title,
        'aria-label': 'Step ' + st.n + ': ' + st.title + (done ? ', done' : ''),
        'aria-current': st.id === currentId ? 'step' : null
      }));
    });
    stripLabel.textContent = doneCount() + ' of ' + STEPS.length + ' done';
  }

  /* ---------- home ---------- */
  var heroPlayed = false;
  try { heroPlayed = sessionStorage.getItem('llm-deep-dive:hero') === '1'; } catch (e) { /* ignore */ }

  function renderHome() {
    document.title = 'LLM Deep Dive: a step-by-step companion';
    clear(main);
    var count = doneCount();
    var resume = nextUnfinished();

    var title = h('h1', { class: 'hero-title' });
    title.append(h('span', { class: 'sr-only' }, 'From the internet to ChatGPT, one token at a time.'));
    var toks = ['From', ' the', ' internet', ' to', ' Chat', 'G', 'PT', ',', ' one', ' token', ' at', ' a', ' time', '.'];
    var chips = toks.map(function (t, i) { return h('span', { class: 'htok t' + (i % 4), 'aria-hidden': 'true' }, t); });
    chips.forEach(function (c, i) { if (i) title.append(h('wbr')); title.append(c); });
    title.append(h('span', { class: 'caret', 'aria-hidden': 'true' }));

    var cta;
    if (count === STEPS.length) cta = h('a', { class: 'btn', href: '#/step/summary' }, 'Review the grand summary');
    else if (count > 0) cta = h('a', { class: 'btn', href: '#/step/' + resume.id }, 'Continue with step ' + resume.n);
    else cta = h('a', { class: 'btn', href: '#/step/' + STEPS[0].id }, 'Start with step 1');

    var hero = h('section', { class: 'hero' },
      title,
      h('p', { class: 'hero-note' }, 'Each chip is one token, split roughly the way GPT-4\'s tokenizer splits it.'),
      h('p', { class: 'hero-lead' }, 'A step-by-step, interactive companion to Andrej Karpathy\'s lecture ',
        h('a', { href: T.video.url, target: '_blank', rel: 'noopener' }, 'Deep Dive into LLMs like ChatGPT'),
        '. Fifteen short steps cover how models like ChatGPT are built, why they behave the way they do, and how to use them well.'),
      h('div', { class: 'hero-actions' }, cta, h('a', { class: 'btn secondary', href: T.video.url, target: '_blank', rel: 'noopener' }, 'Watch the full lecture'))
    );

    var how = h('section', { class: 'how', 'aria-labelledby': 'how-h' },
      h('h2', { id: 'how-h' }, 'How each step works'),
      h('ol', { class: 'how-list' },
        h('li', null, h('strong', null, 'Read'), ' a short explanation of one part of the lecture.'),
        h('li', null, h('strong', null, 'Watch'), ' that part of the video. Every step links straight to its timestamps.'),
        h('li', null, h('strong', null, 'Try'), ' the interactive demo, then check yourself with a quick quiz.')
      ),
      h('p', { class: 'muted' }, count ? 'You\'ve finished ' + count + ' of ' + STEPS.length + ' steps. Progress is saved in this browser.' : 'Your progress is saved in this browser as you go.')
    );

    var syllabus = h('section', { class: 'syllabus', 'aria-label': 'All steps' });
    PARTS.forEach(function (part) {
      var steps = STEPS.filter(function (st) { return st.part === part.n; });
      var total = steps.reduce(function (a, st) { return a + (st.b - st.a); }, 0);
      var block = h('div', { class: 'syl-part', 'data-part': String(part.n) },
        h('h2', { class: 'syl-h' }, h('span', { class: 'part-dot', 'aria-hidden': 'true' }), 'Part ' + part.n + ': ' + part.name),
        h('p', { class: 'syl-blurb' }, part.blurb + ' About ' + Math.round(total / 60) + ' minutes of lecture.'));
      var ol = h('ol', { class: 'syl-steps' });
      steps.forEach(function (st) {
        var done = !!state.done[st.id];
        ol.append(h('li', null, h('a', { href: '#/step/' + st.id, class: 'syl-link' + (done ? ' is-done' : '') },
          h('span', { class: 'step-num', 'aria-hidden': 'true' }, String(st.n)),
          h('span', { class: 'syl-title' }, st.title, done ? h('span', { class: 'sr-only' }, ' (done)') : null),
          h('span', { class: 'syl-time' }, clock(st.a) + ', ' + mins(st) + ' min')
        )));
      });
      block.append(ol);
      syllabus.append(block);
    });

    var about = h('section', { class: 'about' },
      h('h2', null, 'About the lecture'),
      h('p', null, h('a', { href: T.video.url, target: '_blank', rel: 'noopener' }, T.video.title), ' by ', T.video.author,
        ' was published on ' + T.video.published + ' and runs 3 hours 31 minutes. It\'s a general-audience walk through the full training stack behind ChatGPT, plus mental models for the "psychology" of LLMs and how to use them well.'),
      h('p', { class: 'muted' }, 'These are unofficial study notes written for learning, not affiliated with the lecturer. Model names and rankings reflect early 2025, when the lecture was recorded.')
    );

    main.append(hero, how, syllabus, about);
    renderNav(null);

    if (!heroPlayed && !UI.reducedMotion()) {
      heroPlayed = true;
      try { sessionStorage.setItem('llm-deep-dive:hero', '1'); } catch (e) { /* ignore */ }
      chips.forEach(function (c) { c.classList.add('pending'); });
      var k = 0;
      (function reveal() {
        if (k >= chips.length) return;
        chips[k].classList.remove('pending');
        chips[k].classList.add('pop');
        k += 1;
        setTimeout(reveal, k < 2 ? 260 : 95);
      })();
    }
  }

  /* ---------- step pages ---------- */
  function watchBlock(st) {
    var box = h('section', { class: 'watch', 'aria-label': 'Lecture segment' });
    box.append(h('p', { class: 'watch-when' }, 'Lecture ', h('strong', null, clock(st.a) + ' to ' + clock(st.b)), ', about ' + mins(st) + ' minutes'));
    var player = h('div', { class: 'player', hidden: true });
    var playBtn = h('button', { type: 'button', class: 'btn secondary' }, 'Play it here');
    playBtn.addEventListener('click', function () {
      if (!player.hidden) { clear(player); player.hidden = true; playBtn.textContent = 'Play it here'; return; }
      player.hidden = false;
      player.append(h('iframe', {
        src: embed(st.a, st.b), title: 'Lecture segment: ' + st.title,
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin'
      }));
      playBtn.textContent = 'Close the player';
    });
    box.append(h('div', { class: 'watch-actions' },
      h('a', { class: 'btn', href: yt(st.a), target: '_blank', rel: 'noopener' }, 'Watch on YouTube'), playBtn));
    if (st.chapters.length > 1) {
      var ul = h('ul', { class: 'chapters', 'aria-label': 'Chapters in this segment' });
      st.chapters.forEach(function (c) {
        var sec = toSec(c[1]);
        ul.append(h('li', null, h('a', { href: yt(sec), target: '_blank', rel: 'noopener' }, h('span', { class: 'ch-time' }, clock(sec)), c[0])));
      });
      box.append(ul);
    }
    box.append(player);
    return box;
  }

  function quizBlock(st) {
    var sec = h('section', { class: 'quiz', 'aria-labelledby': 'quiz-h' }, h('h2', { id: 'quiz-h' }, 'Check yourself'));
    var answers = state.quiz[st.id] || {};
    var score = h('div', { class: 'quiz-score', 'aria-live': 'polite' });
    var painters = [];
    st.quiz.forEach(function (q, qi) {
      var box = h('div', { class: 'q', role: 'group', 'aria-labelledby': 'q-' + st.id + '-' + qi });
      box.append(h('p', { class: 'q-text', id: 'q-' + st.id + '-' + qi }, h('span', { class: 'q-num' }, (qi + 1) + '.'), ' ' + q.q));
      var opts = h('div', { class: 'opts' });
      var buttons = q.options.map(function (o, oi) {
        var b = h('button', { type: 'button', class: 'opt' }, h('span', { class: 'opt-mark', 'aria-hidden': 'true' }), h('span', { class: 'opt-text' }, o), h('span', { class: 'sr-only opt-status' }));
        b.addEventListener('click', function () {
          if (answers[qi] !== undefined) return;
          answers[qi] = oi;
          state.quiz[st.id] = answers; save();
          paint(); paintScore();
        });
        opts.append(b);
        return b;
      });
      var fb = h('div', { class: 'q-feedback', 'aria-live': 'polite' });
      box.append(opts, fb);
      sec.append(box);
      function paint() {
        var chosen = answers[qi];
        buttons.forEach(function (b, oi) {
          b.classList.remove('is-correct', 'is-wrong', 'is-dim');
          b.querySelector('.opt-status').textContent = '';
          b.disabled = chosen !== undefined;
          if (chosen === undefined) return;
          if (oi === q.answer) { b.classList.add('is-correct'); b.querySelector('.opt-status').textContent = ' (correct answer)'; }
          else if (oi === chosen) { b.classList.add('is-wrong'); b.querySelector('.opt-status').textContent = ' (your answer)'; }
          else b.classList.add('is-dim');
        });
        clear(fb);
        if (chosen !== undefined) {
          var ok = chosen === q.answer;
          fb.className = 'q-feedback ' + (ok ? 'ok' : 'bad');
          fb.append(h('p', null, h('strong', null, ok ? 'Correct. ' : 'Not quite. '), q.why));
        }
      }
      painters.push(paint);
      paint();
    });
    function paintScore() {
      clear(score);
      var n = Object.keys(answers).length;
      if (n < st.quiz.length) return;
      var right = st.quiz.filter(function (q, qi) { return answers[qi] === q.answer; }).length;
      var retry = h('button', { type: 'button', class: 'link-btn' }, 'Try the quiz again');
      retry.addEventListener('click', function () {
        Object.keys(answers).forEach(function (k) { delete answers[k]; });
        state.quiz[st.id] = answers; save();
        painters.forEach(function (p) { p(); }); paintScore();
        var first = sec.querySelector('.opt'); if (first) first.focus();
      });
      score.append(h('p', null, 'You got ' + right + ' of ' + st.quiz.length + ' right. '), retry);
    }
    sec.append(score);
    paintScore();
    return sec;
  }

  function finishBlock(st) {
    var nav = h('nav', { class: 'step-nav', 'aria-label': 'Step navigation' });
    var next = STEPS[st.i + 1], prev = STEPS[st.i - 1];
    function paint() {
      clear(nav);
      var done = !!state.done[st.id];
      var primary;
      if (!done) {
        primary = h('button', { type: 'button', class: 'btn big' }, next ? 'Mark done and continue' : 'Mark done and finish');
        primary.addEventListener('click', function () {
          state.done[st.id] = true; save();
          location.hash = next ? '#/step/' + next.id : '#/';
        });
      } else {
        primary = h('a', { class: 'btn big', href: next ? '#/step/' + next.id : '#/' }, next ? 'Continue to step ' + next.n : 'Back to the overview');
      }
      var toggle = h('button', { type: 'button', class: 'link-btn' }, done ? 'Mark this step as not done' : 'Mark done without moving on');
      toggle.addEventListener('click', function () {
        if (state.done[st.id]) delete state.done[st.id]; else state.done[st.id] = true;
        save(); paint(); renderNav(st.id);
        nav.querySelector('.link-btn').focus();
      });
      nav.append(
        h('p', { class: 'next-label' }, next ? 'Next: ' + next.title : 'This is the last step.'),
        primary,
        h('div', { class: 'step-nav-row' },
          prev ? h('a', { href: '#/step/' + prev.id, class: 'btn secondary' }, 'Previous step') : h('a', { href: '#/', class: 'btn secondary' }, 'Overview'),
          toggle)
      );
    }
    paint();
    return nav;
  }

  function renderStep(i) {
    var st = STEPS[i], part = PARTS[st.part - 1];
    document.title = st.n + '. ' + st.title + ' | LLM Deep Dive';
    state.last = st.id; save();
    clear(main);
    var art = h('article', { class: 'step', 'data-part': String(st.part) });
    art.append(
      h('p', { class: 'kicker' }, h('span', { class: 'part-dot', 'aria-hidden': 'true' }), 'Part ' + part.n + ': ' + part.name, h('span', { class: 'kicker-step' }, 'Step ' + st.n + ' of ' + STEPS.length)),
      h('h1', { class: 'step-h1' }, st.title),
      h('p', { class: 'lead' }, st.lead),
      watchBlock(st)
    );
    var prose = h('div', { class: 'prose', html: st.body });
    art.append(prose);
    if (st.takeaways && st.takeaways.length) {
      art.append(h('section', { class: 'takeaways' }, h('h2', null, 'In short'), h('ul', null, st.takeaways.map(function (t) { return h('li', null, t); }))));
    }
    if (st.terms && st.terms.length) {
      var dl = h('dl', { class: 'terms' });
      st.terms.forEach(function (t) { dl.append(h('div', null, h('dt', null, t[0]), h('dd', null, t[1]))); });
      art.append(h('section', { class: 'terms-sec' }, h('h2', null, 'Key terms'), dl));
    }
    if (st.quiz && st.quiz.length) art.append(quizBlock(st));
    art.append(finishBlock(st));
    main.append(art);
    Array.prototype.slice.call(prose.querySelectorAll('[data-demo]')).forEach(function (el) {
      var fn = D[el.getAttribute('data-demo')];
      if (!fn) return;
      try { fn(el, st); } catch (e) {
        if (window.console) console.error(e);
        el.replaceWith(h('p', { class: 'demo-note' }, 'This demo couldn\'t load in your browser.'));
      }
    });
    renderNav(st.id);
  }

  /* ---------- glossary ---------- */
  function renderGlossary() {
    document.title = 'Glossary | LLM Deep Dive';
    clear(main);
    var seen = {}, terms = [];
    STEPS.forEach(function (st) {
      (st.terms || []).forEach(function (t) {
        var key = t[0].toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        terms.push({ term: t[0], def: t[1], st: st });
      });
    });
    terms.sort(function (a, b) { return a.term.localeCompare(b.term); });
    var filter = h('input', { class: 'input', type: 'search', placeholder: 'Filter terms', 'aria-label': 'Filter terms', autocomplete: 'off' });
    var dl = h('dl', { class: 'terms glossary' });
    var empty = h('p', { class: 'muted', hidden: true }, 'No terms match. Try a shorter word.');
    var rows = terms.map(function (t) {
      var row = h('div', { 'data-part': String(t.st.part) },
        h('dt', null, t.term),
        h('dd', null, t.def, ' ', h('a', { href: '#/step/' + t.st.id, class: 'term-step' }, 'Step ' + t.st.n + ': ' + t.st.title)));
      row.dataset.q = (t.term + ' ' + t.def).toLowerCase();
      dl.append(row);
      return row;
    });
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase(), shown = 0;
      rows.forEach(function (r) { var hit = !q || r.dataset.q.indexOf(q) >= 0; r.hidden = !hit; if (hit) shown += 1; });
      empty.hidden = shown > 0;
    });
    main.append(h('article', { class: 'glossary-page' },
      h('h1', { class: 'step-h1' }, 'Glossary'),
      h('p', { class: 'lead' }, terms.length + ' key terms from the tutorial, each linked to the step that explains it.'),
      filter, empty, dl));
    renderNav('glossary');
  }

  /* ---------- routing ---------- */
  var firstRoute = true;
  function route() {
    var hash = location.hash.replace(/^#\/?/, '');
    var bits = hash.split('/');
    if (sheet.open) sheet.close();
    if (bits[0] === 'step') {
      var i = STEPS.findIndex(function (st) { return st.id === bits[1]; });
      if (i >= 0) renderStep(i); else renderHome();
    } else if (bits[0] === 'glossary') renderGlossary();
    else renderHome();
    if (!firstRoute) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    firstRoute = false;
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable], dialog')) return;
    var m = location.hash.match(/^#\/step\/(.+)$/);
    if (!m) return;
    var i = STEPS.findIndex(function (st) { return st.id === m[1]; });
    if (i < 0) return;
    var j = e.key === 'ArrowRight' ? i + 1 : i - 1;
    if (j >= 0 && j < STEPS.length) location.hash = '#/step/' + STEPS[j].id;
  });

  /* ---------- mobile steps sheet ---------- */
  menuBtn.addEventListener('click', function () {
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    var cur = sheet.querySelector('.is-current') || sheet.querySelector('a');
    if (cur) cur.focus();
  });
  sheetClose.addEventListener('click', function () { if (sheet.close) sheet.close(); else sheet.removeAttribute('open'); });
  sheet.addEventListener('click', function (e) {
    if (e.target === sheet) sheet.close();
    if (e.target.closest && e.target.closest('a')) sheet.close();
  });

  /* ---------- theme ---------- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function effectiveTheme() { return state.theme || (mq && mq.matches ? 'dark' : 'light'); }
  function applyTheme() {
    if (state.theme) document.documentElement.setAttribute('data-theme', state.theme);
    else document.documentElement.removeAttribute('data-theme');
    var dark = effectiveTheme() === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.querySelector('.theme-label').textContent = dark ? 'Light' : 'Dark';
  }
  themeBtn.addEventListener('click', function () {
    state.theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
    save(); applyTheme();
  });
  if (mq && mq.addEventListener) mq.addEventListener('change', applyTheme);

  applyTheme();
  route();
})();
