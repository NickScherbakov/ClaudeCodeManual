// app.js — routing, state, rendering, widgets

const STORAGE_KEY = 'cc-trainer-state-v1';

const state = {
  current: null,
  progress: {},   // {chapterId: true}
  lang: 'en',
  concept: {
    goal: '',
    tasks: '',
    process: '',
    resources: '',
    name: '',
  },
  theme: 'dark',
};

const UI = {
  en: {
    brandSub: 'Opus 4.8 · advanced techniques',
    chaptersCrumb: 'Chapters',
    referencesCrumb: 'References',
    chaptersLabel: 'chapters',
    quizTitle: 'Quick check',
    passed: '✓ Completed',
    markDone: 'Mark complete',
    prev: '← Back',
    next: 'Next →',
    reset: 'Reset progress',
    references: 'References',
    resetConfirm: 'Reset all progress and the concept draft?',
    themeTitle: 'Toggle theme',
    langTitle: 'Switch language',
  },
  ru: {
    brandSub: 'Opus 4.8 · продвинутые техники',
    chaptersCrumb: 'Главы',
    referencesCrumb: 'Справочники',
    chaptersLabel: 'глав',
    quizTitle: 'Мини-проверка',
    passed: '✓ Пройдена',
    markDone: 'Отметить пройденной',
    prev: '← Назад',
    next: 'Далее →',
    reset: 'Сбросить прогресс',
    references: 'Справочники',
    resetConfirm: 'Сбросить весь прогресс и концепцию?',
    themeTitle: 'Сменить тему',
    langTitle: 'Switch language',
  },
};

function activeLang() {
  return state.lang === 'ru' ? 'ru' : 'en';
}

function tr(key) {
  return UI[activeLang()][key];
}

function chapters() {
  if (typeof CONTENT !== 'undefined' && CONTENT[activeLang()]?.chapters) {
    return CONTENT[activeLang()].chapters;
  }
  return CHAPTERS;
}

function cheatsheets() {
  if (typeof CONTENT !== 'undefined' && CONTENT[activeLang()]?.cheatsheets) {
    return CONTENT[activeLang()].cheatsheets;
  }
  return CHEATSHEETS;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    Object.assign(state, s);
  } catch (e) {
    console.warn('load failed', e);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
}

function applyLocale() {
  document.documentElement.lang = activeLang();
  document.getElementById('brandSub').textContent = tr('brandSub');
  document.getElementById('resetBtn').textContent = tr('reset');
  document.getElementById('cheatBtn').textContent = tr('references');
  document.getElementById('prevBtn').textContent = tr('prev');
  document.getElementById('nextBtn').textContent = tr('next');
  document.getElementById('themeBtn').title = tr('themeTitle');
  const langBtn = document.getElementById('langBtn');
  langBtn.textContent = activeLang() === 'en' ? 'RU' : 'EN';
  langBtn.title = tr('langTitle');
}

// ---------- Navigation ----------

function renderSidebar() {
  const nav = document.getElementById('chapterNav');
  nav.innerHTML = '';
  const list = chapters();
  list.forEach((ch, idx) => {
    const a = document.createElement('a');
    a.href = '#' + ch.id;
    a.className = 'nav-item';
    if (state.current === ch.id) a.classList.add('active');
    if (state.progress[ch.id]) a.classList.add('done');
    a.innerHTML = `<span class="num"><span>${ch.num}</span></span><span class="nav-title">${ch.title}</span>`;
    nav.appendChild(a);
  });

  // progress bar
  const done = list.filter(c => state.progress[c.id]).length;
  const total = list.length;
  document.getElementById('progressBar').style.width = (done / total * 100) + '%';
  document.getElementById('progressText').textContent = `${done} / ${total} ${tr('chaptersLabel')}`;
}

function goTo(id) {
  const list = chapters();
  const ch = list.find(c => c.id === id) || list[0];
  state.current = ch.id;
  save();
  renderChapter(ch);
  renderSidebar();
  document.getElementById('cheatBtn')?.classList.remove('active');
  document.getElementById('content').scrollTop = 0;
  window.scrollTo(0, 0);
}

function navigateTo(id) {
  if (location.hash !== '#' + id) {
    history.pushState(null, '', '#' + id);
  }
  goTo(id);
}

// ---------- Chapter rendering ----------

function renderChapter(ch) {
  const content = document.getElementById('content');
  const crumbs = document.getElementById('crumbs');
  crumbs.textContent = `${tr('chaptersCrumb')} / ${ch.title}`;

  // markdown body
  const html = marked.parse(ch.body);
  content.innerHTML = html;

  // mount widgets
  if (ch.widget === 'conceptWizard') {
    mountConceptWizard(document.getElementById('conceptWizard'));
  } else if (ch.widget === 'parallelAnimator') {
    mountParallelAnimator(document.getElementById('parallelAnimator'));
  }

  // quiz
  if (ch.quiz) {
    const quizEl = document.createElement('div');
    quizEl.className = 'quiz';
    quizEl.innerHTML = `
      <h3>${tr('quizTitle')}</h3>
      <div class="quiz-q">${ch.quiz.q}</div>
      <div class="quiz-options"></div>
      <div class="quiz-feedback" role="status" aria-live="polite" style="display:none"></div>
    `;
    const optsEl = quizEl.querySelector('.quiz-options');
    const feedbackEl = quizEl.querySelector('.quiz-feedback');
    ch.quiz.options.forEach((opt, i) => {
      const o = document.createElement('div');
      o.className = 'quiz-opt';
      o.textContent = opt.text;
      o.setAttribute('role', 'button');
      o.setAttribute('tabindex', '0');
      o.onkeydown = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); o.click(); }
      };
      o.onclick = () => {
        if (feedbackEl.style.display !== 'none') return;
        optsEl.querySelectorAll('.quiz-opt').forEach(e => e.classList.remove('selected'));
        o.classList.add('selected');
        o.classList.add(opt.correct ? 'correct' : 'wrong');
        feedbackEl.style.display = 'block';
        feedbackEl.className = 'quiz-feedback ' + (opt.correct ? 'ok' : 'bad');
        feedbackEl.textContent = (opt.correct ? '✓ ' : '✗ ') + opt.why;
        // highlight correct one if user wrong
        if (!opt.correct) {
          const correctIdx = ch.quiz.options.findIndex(x => x.correct);
          optsEl.children[correctIdx].classList.add('correct');
        }
      };
      optsEl.appendChild(o);
    });
    content.appendChild(quizEl);
  }

  // syntax highlight
  if (window.Prism) Prism.highlightAllUnder(content);

  // nav buttons state
  const list = chapters();
  const idx = list.findIndex(c => c.id === ch.id);
  document.getElementById('prevBtn').disabled = idx === 0;
  document.getElementById('nextBtn').disabled = idx === list.length - 1;
  const doneBtn = document.getElementById('markDoneBtn');
  doneBtn.disabled = false;
  doneBtn.textContent = state.progress[ch.id] ? tr('passed') : tr('markDone');
}

// ---------- Concept Wizard (Глава 0) ----------

const WIZARD_STEPS = {
  en: [
    {
      key: 'goal',
      title: 'Node 1: Desired outcome',
      hint: 'Describe the ideal end state. What should be true after the workflow runs? Write the result, not the activity.',
      placeholder: 'Template: "There is [artifact] with [properties]."\n\nExample: "There is a contract-risk report with 5-50 confirmed risks, each with a clause reference, severity, and rationale."',
    },
    {
      key: 'tasks',
      title: 'Node 2: Decomposition',
      hint: 'What tasks must become true for the outcome to exist? For each task: input -> output.',
      placeholder: 'Task A: [takes ...] -> [returns ...]\nTask B: [takes ...] -> [returns ...]\n\nExample:\nA: contract text -> candidate risks\nB: each candidate risk -> refuted / survives\nC: surviving risks -> markdown report',
    },
    {
      key: 'process',
      title: 'Node 3: Process',
      hint: 'How do the tasks relate over time? This determines whether you need sequential steps, parallel work, loops, or verification.',
      placeholder: 'Example:\nA -> B -> C sequentially\nB runs 3 independent reviewers per candidate risk\nA uses loop-until-dry because the number of risks is unknown',
    },
    {
      key: 'resources',
      title: 'Node 4: Resources',
      hint: 'Choose resources last, after the shape of the work is clear: agents, schemas, tools, model, and budget.',
      placeholder: 'Example:\nA: one agent with RESULT_SCHEMA\nB: 3 reviewers with VERDICT_SCHEMA through pipeline + parallel\nC: one agent without schema to write markdown\nModel: Opus 4.8 by default',
    },
  ],
  ru: [
    {
      key: 'goal',
      title: 'Узел 1: Цель',
      hint: 'Конечное состояние. Что станет истинным, когда система отработала? Описывайте результат, не процесс.',
      placeholder: 'Шаблон: «существует [ЧТО] с [КАКИМИ СВОЙСТВАМИ]»\n\nПример: «существует отчёт из 5-50 подтверждённых рисков из договора, каждый с пунктом, критичностью и обоснованием»',
    },
    {
      key: 'tasks',
      title: 'Узел 2: Декомпозиция',
      hint: 'Какие задачи нужно решить, чтобы цель стала истинной? Для каждой: что берёт на входе, что отдаёт на выходе.',
      placeholder: 'Задача A: [берёт ...] -> [отдаёт ...]\nЗадача B: [берёт ...] -> [отдаёт ...]\n\nПример:\nA: текст договора -> список потенциальных рисков\nB: каждый риск -> опровергнут / подтверждён\nC: подтверждённые риски -> отчёт markdown',
    },
    {
      key: 'process',
      title: 'Узел 3: Процессы',
      hint: 'Как задачи связаны во времени? От этого зависит, нужны ли последовательные шаги, параллельная работа, циклы или проверка.',
      placeholder: 'Например:\nA -> B -> C последовательно\nB запускает 3 независимые проверки для каждого риска\nA использует loop-until-dry, если рисков заранее неизвестно сколько',
    },
    {
      key: 'resources',
      title: 'Узел 4: Ресурсы',
      hint: 'Ресурсы выбираются последними: агенты, схемы, инструменты, модель и бюджет.',
      placeholder: 'Например:\nA: один agent с RESULT_SCHEMA\nB: 3 проверки с VERDICT_SCHEMA через pipeline + parallel\nC: один agent без схемы для markdown-отчёта\nМодель: Opus 4.8 по умолчанию',
    },
  ],
};

const WIZARD_UI = {
  en: {
    summaryTitle: '✓ Your concept',
    summaryHint: 'Copy this concept and give it to Claude Code as a prompt. It becomes the blueprint for project/system.js.',
    systemName: 'System name:',
    unnamed: '(unnamed)',
    goal: 'Desired outcome',
    tasks: 'Decomposition',
    process: 'Process',
    resources: 'Resources',
    promptTitle: 'Prompt for Claude Code:',
    prompt: 'Read this concept and create project/system.js: a workflow for this task. Use structured output (schema), pipeline for multi-stage work, and adversarial verification for result checking.',
    empty: '(not filled)',
    back: '← Edit',
    backStep: '← Back',
    next: 'Next →',
    showConcept: 'Show concept',
    copy: 'Copy concept',
    copied: '✓ Copied',
  },
  ru: {
    summaryTitle: '✓ Ваша концепция',
    summaryHint: 'Скопируйте концепцию и передайте Claude Code как промпт. Это станет чертежом для project/system.js.',
    systemName: 'Название системы:',
    unnamed: '(без названия)',
    goal: 'Цель',
    tasks: 'Декомпозиция',
    process: 'Процессы',
    resources: 'Ресурсы',
    promptTitle: 'Промпт для Claude Code:',
    prompt: 'Прочитай эту концепцию и создай project/system.js — workflow для этой задачи. Используй structured output (schema), pipeline для многостадийной работы и adversarial verify для проверки результатов.',
    empty: '(не заполнено)',
    back: '← Редактировать',
    backStep: '← Назад',
    next: 'Далее →',
    showConcept: 'Показать концепцию',
    copy: 'Скопировать концепцию',
    copied: '✓ Скопировано',
  },
};

function mountConceptWizard(host) {
  if (!host) return;
  let step = 0;

  function render() {
    const steps = WIZARD_STEPS[activeLang()];
    const ui = WIZARD_UI[activeLang()];
    const s = steps[step];
    const isLast = step === steps.length;

    host.innerHTML = `
      <div class="wizard">
        <div class="wizard-steps">
          ${steps.map((_, i) => {
            const cls = i < step ? 'done' : (i === step ? 'active' : '');
            return `<div class="wizard-step ${cls}"></div>`;
          }).join('')}
        </div>
        ${isLast ? renderSummary() : `
          <h3>${s.title}</h3>
          <p style="color:var(--fg-mute); font-size:14px;">${s.hint}</p>
          <textarea id="wizard-input" placeholder="${s.placeholder.replace(/"/g, '&quot;')}">${state.concept[s.key] || ''}</textarea>
          <div class="wizard-nav">
            <button id="wiz-back" ${step === 0 ? 'disabled' : ''}>${ui.backStep}</button>
            <button id="wiz-next" class="primary">${step === steps.length - 1 ? ui.showConcept : ui.next}</button>
          </div>
        `}
      </div>
    `;

    if (!isLast) {
      const input = host.querySelector('#wizard-input');
      input.oninput = () => {
        state.concept[s.key] = input.value;
        save();
      };
      host.querySelector('#wiz-back').onclick = () => { step--; render(); };
      host.querySelector('#wiz-next').onclick = () => { step++; render(); };
    } else {
      host.querySelector('#wiz-back-final')?.addEventListener('click', () => { step--; render(); });
      host.querySelector('#wiz-copy')?.addEventListener('click', copyConcept);
      host.querySelector('#wiz-name')?.addEventListener('input', e => {
        state.concept.name = e.target.value;
        save();
      });
    }
  }

  function renderSummary() {
    const c = state.concept;
    const ui = WIZARD_UI[activeLang()];
    return `
      <h3 style="color:var(--ok)">${ui.summaryTitle}</h3>
      <p style="color:var(--fg-mute); font-size:14px;">${ui.summaryHint}</p>

      <label style="display:block; margin:12px 0 6px; font-size:13px;">${ui.systemName}</label>
      <input id="wiz-name" type="text" value="${(c.name || '').replace(/"/g, '&quot;')}"
             placeholder="contract-risk-analyzer"
             style="width:100%; padding:10px; background:var(--bg-elev); color:var(--fg); border:1px solid var(--border); border-radius:8px; font-family:inherit;" />

      <div class="wizard-summary">## Concept: ${c.name || ui.unnamed}

### ${ui.goal}
${c.goal || ui.empty}

### ${ui.tasks}
${c.tasks || ui.empty}

### ${ui.process}
${c.process || ui.empty}

### ${ui.resources}
${c.resources || ui.empty}

---
${ui.promptTitle}
"${ui.prompt}"</div>

      <div class="wizard-nav">
        <button id="wiz-back-final">${ui.back}</button>
        <button id="wiz-copy" class="primary">${ui.copy}</button>
      </div>
    `;
  }

  function copyConcept() {
    const text = host.querySelector('.wizard-summary').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = host.querySelector('#wiz-copy');
      const orig = btn.textContent;
      btn.textContent = WIZARD_UI[activeLang()].copied;
      setTimeout(() => btn.textContent = orig, 1500);
    });
  }

  render();
}

// ---------- Parallel vs Sequential Animator ----------

function mountParallelAnimator(host) {
  if (!host) return;
  const isRu = activeLang() === 'ru';
  const tasks = [
    { name: 'angle-1 (legal)', dur: 1800 },
    { name: 'angle-2 (financial)', dur: 1200 },
    { name: 'angle-3 (operational)', dur: 1600 },
  ];

  host.innerHTML = `
    <div class="animator">
      <h3 style="margin-top:0">Sequential vs Parallel</h3>
      <p style="color:var(--fg-mute); font-size:14px; margin:4px 0 16px">
        ${isRu ? 'Три исполнителя, длительность' : 'Three agents, durations'} ${tasks.map(t => (t.dur/1000)+'s').join(' / ')}.
        Sequential = ${tasks.reduce((s,t)=>s+t.dur,0)/1000}s. Parallel = ${Math.max(...tasks.map(t=>t.dur))/1000}s.
      </p>

      <div>
        <div style="font-size:13px; font-weight:600; margin:8px 0">${isRu ? 'Sequential (await подряд)' : 'Sequential (await one after another)'}</div>
        <div id="seqRows"></div>
        <div style="text-align:right; font-size:13px; color:var(--fg-mute); margin-top:4px">${isRu ? 'Итог' : 'Total'}: <span id="seqTotal">—</span></div>
      </div>

      <div style="margin-top:24px">
        <div style="font-size:13px; font-weight:600; margin:8px 0">${isRu ? 'Parallel (одновременно)' : 'Parallel (at the same time)'}</div>
        <div id="parRows"></div>
        <div style="text-align:right; font-size:13px; color:var(--fg-mute); margin-top:4px">${isRu ? 'Итог' : 'Total'}: <span id="parTotal">—</span></div>
      </div>

      <div class="anim-ctrls">
        <button id="animRun" class="primary">▶ ${isRu ? 'Запустить' : 'Run'}</button>
        <button id="animReset">${isRu ? 'Сброс' : 'Reset'}</button>
        <span style="color:var(--fg-mute); font-size:12px; align-self:center; margin-left:auto">
          ${isRu ? 'Ускоренно в 3×' : 'Shown at 3× speed'}
        </span>
      </div>
    </div>
  `;

  function makeRow(t) {
    const row = document.createElement('div');
    row.className = 'anim-row';
    row.innerHTML = `
      <div class="anim-label">${t.name}</div>
      <div class="anim-track"><div class="anim-bar"></div></div>
      <div class="anim-time">—</div>
    `;
    return row;
  }

  const seqRows = host.querySelector('#seqRows');
  const parRows = host.querySelector('#parRows');
  const seqEls = tasks.map(t => { const r = makeRow(t); seqRows.appendChild(r); return r; });
  const parEls = tasks.map(t => { const r = makeRow(t); parRows.appendChild(r); return r; });

  function reset() {
    [...seqEls, ...parEls].forEach(r => {
      r.querySelector('.anim-bar').style.width = '0%';
      r.querySelector('.anim-bar').textContent = '';
      r.querySelector('.anim-time').textContent = '—';
    });
    host.querySelector('#seqTotal').textContent = '—';
    host.querySelector('#parTotal').textContent = '—';
  }

  function runBar(rowEl, dur) {
    return new Promise(resolve => {
      const bar = rowEl.querySelector('.anim-bar');
      const time = rowEl.querySelector('.anim-time');
      const start = performance.now();
      const duration = dur / 3; // 3x speed
      bar.textContent = 'agent...';
      function tick(now) {
        const elapsed = now - start;
        const pct = Math.min(100, elapsed / duration * 100);
        bar.style.width = pct + '%';
        time.textContent = (elapsed * 3 / 1000).toFixed(1) + (isRu ? 'с' : 's');
        if (pct < 100) requestAnimationFrame(tick);
        else { bar.textContent = '✓ ' + (dur/1000) + (isRu ? 'с' : 's'); resolve(); }
      }
      requestAnimationFrame(tick);
    });
  }

  async function run() {
    reset();
    const runBtn = host.querySelector('#animRun');
    runBtn.disabled = true;

    // Sequential
    const seqStart = performance.now();
    for (let i = 0; i < tasks.length; i++) {
      await runBar(seqEls[i], tasks[i].dur);
    }
    host.querySelector('#seqTotal').textContent = ((performance.now() - seqStart) * 3 / 1000).toFixed(1) + 'с';

    // Parallel
    const parStart = performance.now();
    await Promise.all(tasks.map((t, i) => runBar(parEls[i], t.dur)));
    host.querySelector('#parTotal').textContent = ((performance.now() - parStart) * 3 / 1000).toFixed(1) + 'с';

    runBtn.disabled = false;
  }

  host.querySelector('#animRun').onclick = run;
  host.querySelector('#animReset').onclick = reset;
}

// ---------- Cheatsheets ----------

function renderCheatsheets() {
  const content = document.getElementById('content');
  const crumbs = document.getElementById('crumbs');
  crumbs.textContent = tr('referencesCrumb');

  const parseBody = (body) => {
    if (typeof marked !== 'undefined' && marked.parse) return marked.parse(body);
    return '<pre>' + body.replace(/</g, '&lt;') + '</pre>';
  };

  const html = cheatsheets().map(cs => `
    <div style="margin-bottom:2rem">
      <h2>${cs.title}</h2>
      ${parseBody(cs.body)}
    </div>
  `).join('<hr style="margin:2rem 0; border-color:var(--border)">');

  content.innerHTML = html;
  if (window.Prism) Prism.highlightAllUnder(content);
  content.scrollTop = 0;

  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  document.getElementById('cheatBtn').classList.add('active');
  document.getElementById('prevBtn').disabled = true;
  document.getElementById('nextBtn').disabled = true;
  document.getElementById('markDoneBtn').textContent = tr('markDone');
  document.getElementById('markDoneBtn').disabled = true;
}

// ---------- Event handlers ----------

function bindEvents() {
  document.getElementById('prevBtn').onclick = () => {
    const list = chapters();
    const idx = list.findIndex(c => c.id === state.current);
    if (idx > 0) navigateTo(list[idx - 1].id);
  };
  document.getElementById('nextBtn').onclick = () => {
    const list = chapters();
    const idx = list.findIndex(c => c.id === state.current);
    if (idx < list.length - 1) navigateTo(list[idx + 1].id);
  };
  document.getElementById('markDoneBtn').onclick = () => {
    state.progress[state.current] = !state.progress[state.current];
    save();
    renderSidebar();
    const ch = chapters().find(c => c.id === state.current);
    const isDone = state.progress[ch.id];
    document.getElementById('markDoneBtn').textContent = isDone ? tr('passed') : tr('markDone');
    if (isDone) showSharePrompt(ch);
  };
  document.getElementById('themeBtn').onclick = () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    save();
    applyTheme();
  };
  document.getElementById('langBtn').onclick = () => {
    state.lang = activeLang() === 'en' ? 'ru' : 'en';
    save();
    applyLocale();
    renderSidebar();
    const currentExists = chapters().some(c => c.id === state.current);
    if (location.hash === '#cheatsheets') renderCheatsheets();
    else goTo(currentExists ? state.current : chapters()[0].id);
  };
  document.getElementById('resetBtn').onclick = () => {
    if (!confirm(tr('resetConfirm'))) return;
    localStorage.removeItem(STORAGE_KEY);
    state.progress = {};
    state.concept = { goal: '', tasks: '', process: '', resources: '', name: '' };
    state.current = chapters()[0].id;
    save();
    renderSidebar();
    goTo(chapters()[0].id);
  };

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (id === 'cheatsheets') { renderCheatsheets(); return; }
    if (id && chapters().find(c => c.id === id)) goTo(id);
  });

  document.getElementById('cheatBtn').addEventListener('click', e => {
    e.preventDefault();
    location.hash = 'cheatsheets';
    renderCheatsheets();
  });

  document.getElementById('chapterNav').addEventListener('click', e => {
    const a = e.target.closest('.nav-item');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    navigateTo(id);
  });
}

// ---------- Share prompt ----------

function showSharePrompt(ch) {
  const existing = document.getElementById('sharePrompt');
  if (existing) existing.remove();

  const url = 'https://nickscherbakov.github.io/ClaudeCodeManual/';
  const tweetText = encodeURIComponent(
    `Прошёл «${ch.title}» в бесплатном курсе по Workflow tool Claude Code.\n15 глав + 14 лабов — открывается в браузере:\n${url}`
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const div = document.createElement('div');
  div.id = 'sharePrompt';
  div.innerHTML = `
    <div style="margin-top:2rem;padding:1rem 1.25rem;border-radius:10px;background:var(--bg-elev);border:1px solid var(--border);display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <span style="flex:1;min-width:180px;font-size:14px;color:var(--fg-dim)">Глава пройдена! Если курс полезен — помогите другим его найти:</span>
      <a href="${twitterUrl}" target="_blank" rel="noopener" style="padding:7px 14px;border-radius:7px;background:#1da1f233;border:1px solid #1da1f266;color:#1da1f2;text-decoration:none;font-size:13px;font-weight:600;white-space:nowrap">Поделиться в X</a>
      <a href="https://github.com/NickScherbakov/ClaudeCodeManual" target="_blank" rel="noopener" style="padding:7px 14px;border-radius:7px;background:#f6a61a22;border:1px solid #f6a61a66;color:#f6a61a;text-decoration:none;font-size:13px;font-weight:600;white-space:nowrap">⭐ Star on GitHub</a>
      <button onclick="document.getElementById('sharePrompt').remove()" style="padding:7px 10px;border-radius:7px;background:transparent;border:1px solid var(--border);color:var(--fg-dim);cursor:pointer;font-size:12px">✕</button>
    </div>`;

  const footer = document.getElementById('chapterNav-foot');
  footer.parentNode.insertBefore(div, footer);
  div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---------- Init ----------

function init() {
  load();
  applyTheme();
  applyLocale();
  bindEvents();
  renderSidebar();
  const startId = location.hash.slice(1) || state.current || chapters()[0].id;
  if (startId === 'cheatsheets') renderCheatsheets();
  else goTo(startId);
}

init();
