/* ----------------------------------------------------------------------------
   That's Right — shared i18n engine
   Each page declares its own COPY = { en:{...}, fr:{...} } and calls
   window.I18n.init(COPY, opts).

   To add a language later:
     (1) add it to LANGS below,
     (2) add a matching COPY["xx"] block on each page that needs it.
   Anything missing falls back to FALLBACK automatically — partial
   translations are safe to ship.
---------------------------------------------------------------------------- */
(function(){
  const LANGS = [
    {code:"en", label:"EN", name:"English"},
    {code:"fr", label:"FR", name:"Français"}
  ];
  // Flip FR_ENABLED to false to hide the switcher and force EN everywhere.
  const FR_ENABLED = true;
  const PUBLIC_LANGS = FR_ENABLED ? LANGS : LANGS.filter(l => l.code === "en");
  const FALLBACK = "en";
  const STORE = {lang:"tr-lang", mode:"tr-mode"};

  // Hand-maintained French pages live at /fr (Vercel resolves to /fr/index.html
  // with trailingSlash:false). Clicking a langpill navigates between / and /fr
  // so Google can index each independently. Pages under /fr/* force lang=fr at
  // boot regardless of localStorage, so the URL stays canonical.
  function langFromPath(){
    const p = location.pathname;
    return (p === "/fr" || p.indexOf("/fr/") === 0) ? "fr" : "en";
  }

  function pathWithoutLocale(){
    const p = location.pathname;
    if(p === "/fr") return "/";
    if(p.indexOf("/fr/") === 0) return p.slice(3); // "/fr/foo" → "/foo"
    return p;
  }

  function localizedHref(code){
    const rest = pathWithoutLocale();
    const prefix = code === "fr" ? "/fr" : "";
    const tail = rest === "/" ? "" : rest;
    const path = (prefix + tail) || "/";
    return path + location.search + location.hash;
  }

  let COPY = null;
  let lang = FALLBACK;
  let mode = null;

  // resolve a key: current-lang mode → current-lang base → fallback mode → fallback base
  function tr(key){
    if(!COPY) return null;
    for(const code of [lang, FALLBACK]){
      const base = COPY[code]; if(!base) continue;
      if(mode){
        const m = base[mode];
        if(m && m[key] !== undefined) return m[key];
      }
      if(base[key] !== undefined) return base[key];
    }
    return null;
  }

  function render(){
    document.querySelectorAll("[data-k]").forEach(el=>{
      const v = tr(el.getAttribute("data-k"));
      if(v !== null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-k-ph]").forEach(el=>{
      const v = tr(el.getAttribute("data-k-ph"));
      if(v !== null) el.placeholder = v;
    });
    document.documentElement.lang = lang;
    document.body.dataset.lang = lang;
    if(mode) document.body.dataset.mode = mode;
    document.querySelectorAll("#langSwitch .langpill").forEach(b=>{
      const on = b.dataset.lang === lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if(window.__afterRender) window.__afterRender();
  }

  function setLang(code){
    // If the click changes language, navigate to the localized URL instead of
    // swapping in place. This keeps /fr/ canonical for SEO and history.
    const target = COPY && COPY[code] ? code : FALLBACK;
    if(target !== lang){
      try{ localStorage.setItem(STORE.lang, target); }catch(e){}
      location.href = localizedHref(target);
      return;
    }
    lang = target;
    render();
  }

  function setMode(m){
    mode = m;
    try{ if(m) localStorage.setItem(STORE.mode, m); }catch(e){}
    render();
  }

  function buildLangSwitch(){
    const wrap = document.getElementById("langSwitch");
    if(!wrap) return;
    wrap.innerHTML = "";
    if(PUBLIC_LANGS.length < 2){ wrap.style.display = "none"; return; }
    PUBLIC_LANGS.forEach((l,i)=>{
      if(i){
        const s = document.createElement("span");
        s.className = "sep"; s.setAttribute("aria-hidden","true"); s.textContent = "·";
        wrap.appendChild(s);
      }
      const b = document.createElement("button");
      b.type = "button"; b.className = "langpill"; b.dataset.lang = l.code;
      b.textContent = l.label; b.title = l.name; b.setAttribute("aria-label", l.name);
      b.addEventListener("click", ()=>setLang(l.code));
      wrap.appendChild(b);
    });
  }

  // URL path wins over everything: /fr/* always renders FR, / always renders EN.
  // localStorage and browser language are only consulted at the root path
  // when no FR-localized variant exists for the current URL.
  function restoreLang(){
    const isPublic = c => PUBLIC_LANGS.some(l => l.code === c);
    const fromPath = langFromPath();
    if(COPY[fromPath] && isPublic(fromPath)){ lang = fromPath; return; }
    let sl = null;
    try{ sl = localStorage.getItem(STORE.lang); }catch(e){}
    if(sl && COPY[sl] && isPublic(sl)){ lang = sl; return; }
    const n = (navigator.language || FALLBACK).slice(0,2).toLowerCase();
    if(COPY[n] && isPublic(n)) lang = n;
  }

  function restoreMode(defaultMode){
    if(!defaultMode){ mode = null; return; }
    let sm = null;
    try{ sm = localStorage.getItem(STORE.mode); }catch(e){}
    mode = sm || defaultMode;
  }

  function init(pageCopy, opts){
    opts = opts || {};
    COPY = pageCopy;
    restoreMode(opts.defaultMode);
    restoreLang();
    buildLangSwitch();
    render();
  }

  // Public API
  window.I18n = {
    init: init,
    tr: tr,
    setLang: setLang,
    setMode: setMode,
    render: render,
    getLang: function(){ return lang; },
    getMode: function(){ return mode; },
    LANGS: LANGS,
    PUBLIC_LANGS: PUBLIC_LANGS,
    FALLBACK: FALLBACK
  };
  // Back-compat: orb.js and inline scripts call window.__tr
  window.__tr = tr;
})();
