/* 不務正業行銷人 — 讀 content.json 產生頁面，再用 GSAP ScrollTrigger 加動態。
   想改內容請改 content.json，這個檔案不用動。 */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = hasGsap && !reduceMotion;

  /* ---------- 小工具（一律用 textContent，避免 content.json 內容被當成 HTML） ---------- */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  // 只放行 http(s) / mailto / 站內相對路徑
  function safeUrl(raw, allowMail = false) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      const u = new URL(raw, location.href);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
      if (allowMail && u.protocol === 'mailto:') return u.href;
    } catch (_) { /* ignore */ }
    return null;
  }
  function link(a, href) {
    a.href = href;
    try {
      if (new URL(href).origin !== location.origin && !href.startsWith('mailto:')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    } catch (_) { /* ignore */ }
    return a;
  }

  /* ---------- 辨識網址類型 ---------- */
  function detect(raw) {
    let u;
    try { u = new URL(raw); } catch (_) { return { type: 'link' }; }
    const host = u.hostname.replace(/^(www|m)\./, '');
    const path = u.pathname;
    let m;

    if (host === 'youtu.be') {
      m = path.match(/^\/([\w-]{11})/);
      if (m) return { type: 'youtube', id: m[1], vertical: false };
    }
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      if ((m = path.match(/^\/shorts\/([\w-]{11})/))) return { type: 'youtube', id: m[1], vertical: true };
      if ((m = path.match(/^\/(?:embed|live)\/([\w-]{11})/))) return { type: 'youtube', id: m[1], vertical: false };
      const v = u.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return { type: 'youtube', id: v, vertical: false };
    }
    if (host === 'instagram.com') {
      m = path.match(/^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
      if (m) return { type: 'instagram', embed: `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed/` };
    }
    if (host === 'threads.net' || host === 'threads.com') {
      m = path.match(/^\/@([\w.]+)\/post\/([\w-]+)/);
      if (m) return { type: 'threads', embed: `https://www.threads.com/@${m[1]}/post/${m[2]}/embed` };
    }
    return { type: 'link' };
  }

  /* ---------- 文字逐字拆開（text reveal 用） ---------- */
  function splitChars(node, label = true) {
    const text = node.textContent;
    if (label) node.setAttribute('aria-label', text);
    node.textContent = '';
    const chars = [];
    for (const c of Array.from(text)) {
      if (c === ' ') { node.appendChild(document.createTextNode(' ')); continue; }
      const mask = el('span', 'ch-mask');
      mask.setAttribute('aria-hidden', 'true');
      const ch = el('span', 'ch', c);
      mask.appendChild(ch);
      node.appendChild(mask);
      chars.push(ch);
    }
    return chars;
  }

  /* ---------- 渲染：首屏 ---------- */
  function renderHero(h = {}) {
    $('#heroKicker').textContent = h.kicker || '';
    $('#heroIntro').textContent = h.intro || '';
    $('#heroByline').textContent = h.byline || '';

    const title = $('#heroTitle');
    const lines = Array.isArray(h.titleLines) && h.titleLines.length ? h.titleLines : ['不務正業', '行銷人'];
    title.setAttribute('aria-label', lines.join(''));
    lines.forEach((t, i) => {
      const line = el('span', 'hero__line', t);
      if (i === lines.length - 1) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'squiggle');
        svg.setAttribute('viewBox', '0 0 200 20');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', 'M2 12 Q 27 0 52 10 T 102 10 T 152 10 T 198 8');
        p.setAttribute('pathLength', '1');
        p.style.strokeDasharray = '1';
        svg.appendChild(p);
        line.appendChild(svg);
      }
      title.appendChild(line);
    });

    const btns = $('#heroButtons');
    (h.buttons || []).forEach((b, i) => {
      const a = el('a', 'btn' + (i ? ' btn--ghost' : ''), b.label);
      a.href = b.href || '#';
      btns.appendChild(a);
    });
  }

  const PAGE = document.body.dataset.page || 'home';
  function renderNav(items = []) {
    const nav = $('#nav');
    // 在其他頁時，#works 這類站內錨點要帶回首頁
    const fix = (h) => (PAGE !== 'home' && h && h.startsWith('#') ? 'index.html' + h : h || '#');
    $('.brand').href = PAGE === 'home' ? '#hero' : 'index.html';
    items.forEach((n) => {
      const a = el('a', null, n.label);
      a.href = fix(n.href);
      if (PAGE === 'about' && n.href === 'about.html') a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });
  }

  /* ---------- 渲染：自我介紹頁 ---------- */
  function renderAbout(a = {}) {
    $('#aboutKicker').textContent = a.kicker || '';
    $('#aboutTitle').textContent = a.title || '關於我';
    $('#aboutLead').textContent = a.lead || '';
    const body = $('#aboutBody');
    (a.paragraphs || []).forEach((t) => body.appendChild(el('p', null, t)));
    const photo = $('#aboutPhoto');
    const src = safeUrl(a.photo);
    if (src) { photo.src = src; photo.alt = a.photoAlt || ''; }
    const btns = $('#aboutButtons');
    (a.buttons || []).forEach((b, i) => {
      const x = el('a', 'btn' + (i ? ' btn--ghost' : ''), b.label);
      x.href = (b.href || '#').startsWith('#') ? 'index.html' + b.href : b.href || '#';
      btns.appendChild(x);
    });

    $('#aboutDoesTitle').textContent = a.doesTitle || '';
    const does = $('#aboutDoes');
    (a.does || []).forEach((d) => {
      const c = el('div', 'tool card-item');
      c.appendChild(el('span', 'tool__emoji', d.emoji || '✨'));
      c.appendChild(el('span', 'tool__name', d.title));
      c.appendChild(el('span', 'tool__note', d.note || ''));
      does.appendChild(c);
    });
    $('#aboutFactsTitle').textContent = a.factsTitle || '';
    const facts = $('#aboutFacts');
    (a.facts || []).forEach((f) => {
      const c = el('div', 'fact card-item');
      c.appendChild(el('span', 'fact__label', f.label));
      c.appendChild(el('span', 'fact__value', f.value));
      facts.appendChild(c);
    });
    if (!(a.does || []).length) { $('#aboutDoesTitle').remove(); does.remove(); }
    if (!(a.facts || []).length) { $('#aboutFactsTitle').remove(); facts.remove(); }
  }

  /* ---------- 渲染：卡片 ---------- */
  function facade(kind, label, cover, ratio) {
    const b = el('button', `facade facade--${kind}`);
    b.type = 'button';
    b.style.setProperty('--ratio', ratio);
    const c = safeUrl(cover);
    if (c) b.style.backgroundImage = `url("${c}")`;
    if (kind === 'youtube') b.appendChild(el('span', 'facade__play'));
    else b.appendChild(el('span', 'facade__label', label));
    b.appendChild(el('span', 'facade__hint', kind === 'youtube' ? '點一下播放' : '點一下載入貼文'));
    b.setAttribute('aria-label', `載入${label}：點擊後才會載入內容`);
    return b;
  }

  function mountEmbed(btn, src, title, height) {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = title;
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    if (height) iframe.style.height = height + 'px';
    else iframe.style.aspectRatio = btn.style.getPropertyValue('--ratio').replace(/\s/g, '') || '16/9';
    btn.replaceWith(iframe);
    refreshSoon();
  }

  function buildCard(item) {
    const card = el('article', 'card');
    const media = el('div', 'card__media');
    const info = detect(item.url);
    const url = safeUrl(item.url);
    const title = item.title || '';
    let mediaUsed = true;
    let linkText = '前往原文 ↗';

    if (info.type === 'youtube') {
      const ratio = info.vertical ? '9/16' : '16/9';
      const b = facade('youtube', 'YouTube', item.cover || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`, ratio);
      b.addEventListener('click', () =>
        mountEmbed(b, `https://www.youtube-nocookie.com/embed/${info.id}?autoplay=1&rel=0&playsinline=1`, title || 'YouTube 影片'));
      media.appendChild(b);
      linkText = '在 YouTube 開啟 ↗';
    } else if (info.type === 'instagram' || info.type === 'threads') {
      const isIg = info.type === 'instagram';
      const b = facade(info.type, isIg ? 'Instagram' : 'Threads', item.cover, isIg ? '4/5' : '4/3');
      b.addEventListener('click', () => {
        const w = media.clientWidth || 340;
        const h = Number(item.embedHeight) || (isIg ? Math.round(w * 1.25 + 210) : 520);
        mountEmbed(b, info.embed, title || (isIg ? 'Instagram 貼文' : 'Threads 貼文'), h);
      });
      media.appendChild(b);
      linkText = isIg ? '在 Instagram 開啟 ↗' : '在 Threads 開啟 ↗';
    } else if (safeUrl(item.image)) {
      const img = document.createElement('img');
      img.src = safeUrl(item.image);
      img.alt = item.alt || title;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (item.ratio) { img.style.aspectRatio = String(item.ratio).replace(/\s/g, ''); img.style.objectFit = 'cover'; }
      img.addEventListener('load', refreshSoon, { once: true });
      if (url) { const a = link(el('a'), url); a.setAttribute('aria-label', title || '開啟連結'); a.appendChild(img); media.appendChild(a); }
      else media.appendChild(img);
      linkText = item.linkLabel || '前往看看 ↗';
    } else {
      mediaUsed = false;
      linkText = item.linkLabel || '前往看看 ↗';
    }
    if (mediaUsed) card.appendChild(media);

    const body = el('div', 'card__body');
    if (Array.isArray(item.tags) && item.tags.length) {
      const tags = el('div', 'tags');
      item.tags.forEach((t) => tags.appendChild(el('span', 'tag', t)));
      body.appendChild(tags);
    }
    body.appendChild(el('h3', 'card__title', title));
    if (item.note) body.appendChild(el('p', 'card__note', item.note));
    if (url) {
      const a = link(el('a', 'card__link', info.type === 'link' && !mediaUsed ? (item.linkLabel || '前往看看 ↗') : linkText), url);
      body.appendChild(a);
    }
    card.appendChild(body);
    return card;
  }

  function renderWorks(w = {}) {
    $('#worksTitle').textContent = w.title || '';
    $('#worksSub').textContent = w.subtitle || '';
    const wall = $('#wall');
    const items = (w.items || []).filter((i) => i && !i.hidden);
    if (!items.length) { wall.appendChild(el('p', 'empty', w.empty || '敬請期待')); wall.style.columns = '1'; return; }
    items.forEach((i) => wall.appendChild(buildCard(i)));
  }

  /* ---------- 渲染：工具與提示詞 ---------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = el('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { /* ignore */ }
      ta.remove();
      return ok;
    }
  }

  function renderTools(t = {}) {
    $('#toolsTitle').textContent = t.title || '';
    $('#toolsSub').textContent = t.subtitle || '';

    const tools = (t.tools || []).filter((x) => x && !x.hidden);
    const toolGrid = $('#toolGrid');
    if (tools.length) $('#toolsHeading').textContent = t.toolsHeading || '工具箱';
    else { $('#toolsHeading').remove(); toolGrid.remove(); }
    tools.forEach((x) => {
      const url = safeUrl(x.url);
      const card = url ? link(el('a', 'tool'), url) : el('div', 'tool');
      card.classList.add('card-item');
      card.appendChild(el('span', 'tool__emoji', x.emoji || '✨'));
      card.appendChild(el('span', 'tool__name', x.name));
      if (x.tag) { const tg = el('div', 'tags'); tg.style.margin = '6px 0 0'; tg.appendChild(el('span', 'tag', x.tag)); card.appendChild(tg); }
      card.appendChild(el('span', 'tool__note', x.note || ''));
      if (url) card.appendChild(el('span', 'tool__go', '去看看 ↗'));
      toolGrid.appendChild(card);
    });

    const prompts = (t.prompts || []).filter((x) => x && !x.hidden);
    const grid = $('#promptGrid');
    if (prompts.length) $('#promptsHeading').textContent = t.promptsHeading || '提示詞';
    else { $('#promptsHeading').remove(); grid.remove(); }
    prompts.forEach((p) => {
      const card = el('article', 'prompt card-item');
      if (p.tag) { const tg = el('div', 'tags'); tg.appendChild(el('span', 'tag', p.tag)); card.appendChild(tg); }
      card.appendChild(el('h3', 'prompt__title', p.title));
      if (p.note) card.appendChild(el('p', 'prompt__note', p.note));
      card.appendChild(el('pre', 'prompt__code', p.prompt || ''));
      const actions = el('div', 'prompt__actions');
      const copy = el('button', 'pbtn pbtn--main', '複製提示詞');
      copy.type = 'button';
      let timer;
      copy.addEventListener('click', async () => {
        const ok = await copyText(p.prompt || '');
        copy.textContent = ok ? '已複製 ✓' : '複製失敗，請手動選取';
        clearTimeout(timer);
        timer = setTimeout(() => { copy.textContent = '複製提示詞'; }, 1800);
      });
      const more = el('button', 'pbtn', '展開全文');
      more.type = 'button';
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', () => {
        const open = card.classList.toggle('is-open');
        more.textContent = open ? '收合' : '展開全文';
        more.setAttribute('aria-expanded', String(open));
        refreshSoon();
      });
      actions.append(copy, more);
      card.appendChild(actions);
      grid.appendChild(card);
    });
  }

  /* ---------- 渲染：頁尾 ---------- */
  function renderFooter(f = {}) {
    if (f.id) $('#contact').id = f.id;
    if (f.id && PAGE !== 'home') $('#contact').id = 'contact';
    $('#footHeadline').textContent = f.headline || '';
    $('#footText').textContent = f.text || '';
    const ul = $('#socials');
    (f.socials || []).forEach((s) => {
      const url = safeUrl(s.url, true);
      if (!url) return;
      const li = el('li');
      const a = link(el('a', null, `${s.icon ? s.icon + ' ' : ''}${s.label}`), url);
      li.appendChild(a);
      ul.appendChild(li);
    });
    $('#footCopy').textContent = `© ${new Date().getFullYear()} ${f.copyright || ''}`;
  }

  /* ---------- 動態（GSAP + ScrollTrigger） ---------- */
  let refreshTimer;
  function refreshSoon() {
    if (!hasGsap) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  }

  const THEMES = {
    cream:  { bg: '#fff7df', fg: '#062c72' },
    yellow: { bg: '#fbb704', fg: '#062c72' },
    navy:   { bg: '#062c72', fg: '#fff7df' },
  };
  const root = document.documentElement;

  function setTheme(name, instant) {
    const t = THEMES[name] || THEMES.cream;
    root.setAttribute('data-theme-now', name);
    if (!hasGsap) { root.style.backgroundColor = t.bg; root.style.color = t.fg; return; }
    gsap.to(root, { backgroundColor: t.bg, color: t.fg, duration: instant || reduceMotion ? 0 : 0.7, ease: 'power2.out', overwrite: 'auto' });
  }

  function initMotion() {
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });   // 手機網址列收合時不要一直重算

    /* 區塊切換：背景色漸變 */
    document.querySelectorAll('[data-theme]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => { if (self.isActive) setTheme(sec.dataset.theme); },
      });
    });

    /* 頁首：往下滑藏起來，往上滑出現 */
    const header = $('#header');
    let hidden = false;
    const showHeader = () => { if (hidden) { hidden = false; gsap.to(header, { yPercent: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' }); } };
    const hideHeader = () => { if (!hidden) { hidden = true; gsap.to(header, { yPercent: -160, duration: 0.35, ease: 'power2.out', overwrite: 'auto' }); } };
    if (!reduceMotion) {
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          const y = self.scroll();
          if (y < 80 || self.direction === -1) showHeader();
          else if (self.direction === 1) hideHeader();
        },
      });
      header.addEventListener('focusin', showHeader);
    }

    if (reduceMotion) return;

    if ($('#hero')) {
    /* 首屏：標題 text reveal */
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    const lines = document.querySelectorAll('.hero__line');
    const titleChars = [];
    lines.forEach((ln) => {
      const svg = ln.querySelector('svg');
      const textNode = Array.from(ln.childNodes).find((n) => n.nodeType === 3);
      const span = el('span', null, textNode.textContent);
      ln.replaceChild(span, textNode);
      span.style.display = 'inline-block';
      titleChars.push(...splitChars(span, false));
      if (svg) ln.appendChild(svg);
    });
    gsap.set(titleChars, { yPercent: 115, rotate: 8 });
    gsap.set(['#heroKicker', '#heroByline', '#heroButtons', '.scroll-cue'], { autoAlpha: 0, y: 16 });
    gsap.set('#heroIntro', { autoAlpha: 0, y: 20 });
    gsap.set('#heroLogo', { autoAlpha: 0, scale: 0.7, rotate: -8 });
    tl.to('#heroKicker', { autoAlpha: 1, y: 0, duration: 0.6 })
      .to(titleChars, { yPercent: 0, rotate: 0, duration: 0.9, stagger: 0.06 }, '-=0.3')
      .to('.squiggle path', { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', startAt: { strokeDashoffset: 1 } }, '-=0.4')
      .to('#heroLogo', { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(1.8)' }, '-=1.1')
      .to('#heroIntro', { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.5')
      .to(['#heroByline', '#heroButtons', '.scroll-cue'], { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 }, '-=0.4');

    gsap.to('#heroLogo', { y: -10, rotate: 2, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
    gsap.to('.scroll-cue', { y: 6, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    /* 首屏裝飾：捲動時輕微視差 */
    gsap.to('.sun', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.ray', { yPercent: -60, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* 區塊標題：進場時逐字顯現 */
    document.querySelectorAll('.section__title, .footer__headline').forEach((h) => {
      const chars = splitChars(h);
      gsap.set(chars, { yPercent: 115 });
      ScrollTrigger.create({
        trigger: h, start: 'top 88%', once: true,
        onEnter: () => gsap.to(chars, { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.05 }),
      });
    });
    gsap.utils.toArray('.section__sub, .subhead, .footer__text, .socials li, .footer__copy').forEach((n) => {
      gsap.set(n, { autoAlpha: 0, y: 18 });
      ScrollTrigger.create({ trigger: n, start: 'top 92%', once: true, onEnter: () => gsap.to(n, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }) });
    });

    /* 卡片：stagger 淡入（同一批進入畫面的一起錯開） */
    const cards = gsap.utils.toArray('.card, .card-item');
    gsap.set(cards, { autoAlpha: 0, y: 44, scale: 0.96 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%', once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', stagger: 0.12, overwrite: true, clearProps: 'transform' }),
    });
  }

  /* ---------- 啟動 ---------- */
  async function init() {
    let data;
    try {
      const res = await fetch('content.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      const main = $('main');
      main.innerHTML = '';
      const box = el('div', 'notice');
      box.appendChild(el('p', null, '讀不到 content.json 😢'));
      box.appendChild(el('p', null, '如果你是直接雙擊開 index.html，請改用本機伺服器預覽（作法請看 README）；或檢查 content.json 有沒有少逗號、少引號。'));
      main.appendChild(box);
      console.error('content.json 載入失敗：', err);
      return;
    }

    if (data.site && data.site.title) document.title = data.site.title;
    if (data.site && data.site.description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = data.site.description;
    }
    renderNav(data.nav);
    if (PAGE === 'about') {
      if (data.about && data.about.pageTitle) document.title = data.about.pageTitle;
      renderAbout(data.about);
    } else {
      renderHero(data.hero);
      renderWorks(data.works);
      renderTools(data.tools);
    }
    renderFooter(data.footer);

    setTheme('cream', true);
    initMotion();
    if (hasGsap && document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  init();
})();
