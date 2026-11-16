// Xavfsiz kod bajarish: foydalanuvchi kodi faqat brauzerda, sandbox="allow-scripts" iframe ichida
// (opaque origin — sayt cookie/localStorage/API'ga kira olmaydi). Serverda kod HECH QACHON bajarilmaydi.

export type SandboxMode = 'web' | 'js' | 'react';
export interface CodeFiles {
  html: string;
  css: string;
  js: string;
}
export interface SandboxTest {
  e: string; // ishonchli test ifodasi (kontent mualliflari yozadi)
}
export interface ConsoleEntry {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}
export interface TestResult {
  ok: boolean;
  error?: string;
}
export interface RunOutcome {
  results: TestResult[];
  logs: ConsoleEntry[];
  error: string | null;
  timedOut: boolean;
}

export const CDN = {
  react: 'https://unpkg.com/react@18.3.1/umd/react.development.js',
  reactDom: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  babel: 'https://unpkg.com/@babel/standalone@7.26.4/babel.min.js',
};

const LOOP_LIMIT = 200_000;
/** allow-same-origin YO'Q: kod sayt cookie/storage/API'ga kira olmaydi. allow-forms — submit hodisalari uchun */
export const SANDBOX_FLAGS = 'allow-scripts allow-forms';

/**
 * Cheksiz sikllardan himoya: for/while/do sikllari tanasining boshiga hisoblagich qo'shadi.
 * Satrlar, izohlar, template va regex literal'larni o'tkazib yuboradi.
 */
export function protectLoops(code: string): string {
  let out = '';
  let i = 0;
  let id = 0;
  const n = code.length;
  const guard = () => {
    const v = `__lp${id++}`;
    return { decl: v, stmt: `if(++${v}>${LOOP_LIMIT})throw new RangeError("Cheksiz sikl? / Infinite loop? (>${LOOP_LIMIT} iterations)");` };
  };
  const decls: string[] = [];
  const isIdent = (c: string) => /[A-Za-z0-9_$]/.test(c);
  let lastSignificant = '';

  const skipString = (q: string) => {
    let j = i + 1;
    while (j < n) {
      if (code[j] === '\\') j += 2;
      else if (code[j] === q) {
        j++;
        break;
      } else if (q === '`' && code[j] === '$' && code[j + 1] === '{') {
        // ${ ... } ichini oddiy kod sifatida o'tkazib yuboramiz (soddalashtirilgan: qavslar balansi)
        let depth = 1;
        j += 2;
        while (j < n && depth > 0) {
          if (code[j] === '{') depth++;
          else if (code[j] === '}') depth--;
          j++;
        }
      } else j++;
    }
    out += code.slice(i, j);
    i = j;
  };

  while (i < n) {
    const c = code[i];
    const next = code[i + 1];
    if (c === '/' && next === '/') {
      const j = code.indexOf('\n', i);
      const end = j === -1 ? n : j;
      out += code.slice(i, end);
      i = end;
      continue;
    }
    if (c === '/' && next === '*') {
      const j = code.indexOf('*/', i + 2);
      const end = j === -1 ? n : j + 2;
      out += code.slice(i, end);
      i = end;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      skipString(c);
      lastSignificant = c;
      continue;
    }
    if (c === '/' && (lastSignificant === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSignificant))) {
      // regex literal
      let j = i + 1;
      let inClass = false;
      while (j < n && code[j] !== '\n') {
        if (code[j] === '\\') j += 2;
        else {
          if (code[j] === '[') inClass = true;
          else if (code[j] === ']') inClass = false;
          else if (code[j] === '/' && !inClass) {
            j++;
            break;
          }
          j++;
        }
      }
      while (j < n && /[a-z]/i.test(code[j])) j++;
      out += code.slice(i, j);
      i = j;
      lastSignificant = '/';
      continue;
    }
    // for ( ... ) {   while ( ... ) {   do {
    const prev = i > 0 ? code[i - 1] : '';
    if (!isIdent(prev)) {
      const word = /^(for|while|do)\b/.exec(code.slice(i, i + 6));
      if (word) {
        const kw = word[1];
        let j = i + kw.length;
        if (kw === 'do') {
          while (j < n && /\s/.test(code[j])) j++;
          if (code[j] === '{') {
            const g = guard();
            decls.push(g.decl);
            out += code.slice(i, j + 1) + g.stmt;
            i = j + 1;
            lastSignificant = '{';
            continue;
          }
        } else {
          while (j < n && /\s/.test(code[j])) j++;
          if (code[j] === '(') {
            let depth = 0;
            let k = j;
            for (; k < n; k++) {
              const ch = code[k];
              if (ch === '"' || ch === "'" || ch === '`') {
                const q = ch;
                k++;
                while (k < n && code[k] !== q) {
                  if (code[k] === '\\') k++;
                  k++;
                }
                continue;
              }
              if (ch === '(') depth++;
              else if (ch === ')') {
                depth--;
                if (depth === 0) break;
              }
            }
            let m = k + 1;
            while (m < n && /\s/.test(code[m])) m++;
            if (code[m] === '{') {
              const g = guard();
              decls.push(g.decl);
              out += code.slice(i, m + 1) + g.stmt;
              i = m + 1;
              lastSignificant = '{';
              continue;
            }
          }
        }
      }
    }
    out += c;
    if (!/\s/.test(c)) lastSignificant = c;
    i++;
  }
  return decls.length ? `var ${decls.map((d) => `${d}=0`).join(',')};${out}` : out;
}

/** JSON'ni <script> ichiga xavfsiz joylash */
const embed = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/** iframe ichidagi runtime: console, xatolar, shim'lar, testlar */
function runtimeScript(): string {
  return String.raw`
(function(){
  var CFG = window.__CV_CFG; var RUN = CFG.runId; var send = function(m){ m.source='codeverse'; m.runId=RUN; try{ parent.postMessage(m,'*'); }catch(e){} };
  var fmt = function(v){ try{ if(typeof v==='string') return v; if(v instanceof Error) return v.name+': '+v.message; if(typeof v==='function') return v.toString().slice(0,80); if(v===undefined) return 'undefined'; if(typeof v==='object' && v!==null && v.nodeType) return '<'+(v.tagName||'node').toLowerCase()+'>'; return JSON.stringify(v, function(k,x){ return typeof x==='bigint'? String(x): x; }) ?? String(v); }catch(e){ return String(v); } };
  var logs = []; window.__CV_LOGS = logs;
  ['log','info','warn','error'].forEach(function(level){
    var orig = console[level];
    console[level] = function(){
      var text = Array.prototype.map.call(arguments, fmt).join(' ');
      if (level==='error' && /Warning: You are importing createRoot|ReactDOM.render is no longer supported|Download the React DevTools/.test(text)) return;
      logs.push(text); send({ type:'console', level: level, text: text });
      try{ orig.apply(console, arguments); }catch(e){}
    };
  });
  window.__CV_ERR = null;
  window.addEventListener('error', function(e){ var msg = ((e.error && e.error.name ? e.error.name+': '+e.error.message : e.message) + (e.lineno? ' (line '+e.lineno+')':'')).replace("Failed to execute 'appendChild' on 'Node': ", ''); window.__CV_ERR = window.__CV_ERR || msg; send({ type:'console', level:'error', text: msg }); });
  window.addEventListener('unhandledrejection', function(e){ var msg = 'Unhandled promise: '+fmt(e.reason); send({ type:'console', level:'error', text: msg }); });
  // Shim'lar: opaque origin'da localStorage yo'q; modal oynalar konsolga yoziladi
  var mem = {}; var storage = { getItem:function(k){ return Object.prototype.hasOwnProperty.call(mem,k)? mem[k]: null; }, setItem:function(k,v){ mem[k]=String(v); }, removeItem:function(k){ delete mem[k]; }, clear:function(){ mem={}; }, key:function(i){ return Object.keys(mem)[i] ?? null; }, get length(){ return Object.keys(mem).length; } };
  try{ Object.defineProperty(window,'localStorage',{ value: storage, configurable:true }); }catch(e){}
  try{ Object.defineProperty(window,'sessionStorage',{ value: storage, configurable:true }); }catch(e){}
  window.alert = function(m){ console.info('[alert] '+fmt(m)); };
  window.confirm = function(m){ console.info('[confirm] '+fmt(m)); return true; };
  window.prompt = function(m, d){ console.info('[prompt] '+fmt(m)); return d ?? ''; };
  // Soxta API: Fetch darslari uchun (tashqi tarmoqqa chiqilmaydi)
  var DB = {
    '/users': [ { id:1, name:'Aziza', city:'Toshkent' }, { id:2, name:'Bekzod', city:'Samarqand' }, { id:3, name:'Dilnoza', city:'Buxoro' } ],
    '/users/1': { id:1, name:'Aziza', city:'Toshkent' },
    '/todos': [ { id:1, title:'HTML o\'rganish', done:true }, { id:2, title:'CSS o\'rganish', done:true }, { id:3, title:'JavaScript o\'rganish', done:false } ],
    '/posts/1': { id:1, title:'CODEVERSE', body:'Kod yozib o\'rganamiz!' },
    '/quote': { text:'Talk is cheap. Show me the code.', author:'Linus Torvalds' }
  };
  window.fetch = function(url, opts){
    return new Promise(function(resolve, reject){
      setTimeout(function(){
        var u; try{ u = new URL(String(url), 'https://api.codeverse.dev'); }catch(e){ return reject(new TypeError('Invalid URL')); }
        if (u.hostname !== 'api.codeverse.dev') return reject(new TypeError('Failed to fetch: sandbox faqat https://api.codeverse.dev ga ruxsat beradi'));
        var method = (opts && opts.method || 'GET').toUpperCase();
        var body = method === 'GET' ? DB[u.pathname] : (function(){ try{ return Object.assign({ id: 101 }, JSON.parse(opts.body||'{}')); }catch(e){ return { id:101 }; } })();
        var ok = body !== undefined; var status = ok ? (method==='POST'?201:200) : 404; var text = JSON.stringify(ok ? body : { error:'Not found' });
        resolve({ ok: ok, status: status, statusText: ok?'OK':'Not Found', url: u.href, headers: { get: function(){ return 'application/json'; } }, json: function(){ return Promise.resolve(JSON.parse(text)); }, text: function(){ return Promise.resolve(text); } });
      }, 30);
    });
  };
  function runUser(){
    var code = CFG.code;
    if (CFG.mode === 'react') {
      if (!window.Babel || !window.React || !window.ReactDOM) { var m='React/Babel yuklanmadi (internet aloqasini tekshiring)'; window.__CV_ERR=m; send({type:'console',level:'error',text:m}); return; }
      try { code = window.Babel.transform(code, { presets: ['react'], filename: 'App.jsx' }).code; }
      catch(e){ var msg='SyntaxError: '+(e.message||e); window.__CV_ERR=msg; send({type:'console',level:'error',text:msg}); return; }
    }
    var s = document.createElement('script'); s.textContent = code + '\n//# sourceURL=main.js'; document.body.appendChild(s);
    if (CFG.mode === 'react' && !window.__CV_ERR) {
      try {
        var App = (0, eval)('typeof App !== "undefined" ? App : undefined');
        var rootEl = document.getElementById('root');
        if (App && rootEl && !rootEl.hasChildNodes()) {
          var I = window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED; if (I) I.usingClientEntryPoint = true;
          var root = window.ReactDOM.createRoot(rootEl);
          window.ReactDOM.flushSync(function(){ root.render(window.React.createElement(App)); });
        }
      } catch(e){ var em=(e.name||'Error')+': '+e.message; window.__CV_ERR = window.__CV_ERR || em; send({type:'console',level:'error',text:em}); }
    }
  }
  function helpers(){
    var $ = function(s){ return document.querySelector(s); };
    var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
    var css = function(s, p){ var el = typeof s==='string'? $(s): s; return el ? getComputedStyle(el).getPropertyValue(p).trim() : null; };
    var text = function(s){ var el = typeof s==='string'? $(s): s; return el ? el.textContent.replace(/\s+/g,' ').trim() : null; };
    var exists = function(s){ return !!$(s); };
    var fn = function(name){ try{ return (0,eval)(name); }catch(e){ return undefined; } };
    var tick = function(ms){ return new Promise(function(r){ setTimeout(r, ms==null?30:ms); }); };
    return { $:$, $$:$$, css:css, text:text, exists:exists, logs:logs, fn:fn, tick:tick };
  }
  async function runTests(){
    var tests = CFG.tests || []; var out = [];
    if (!tests.length) return out;
    await new Promise(function(r){ setTimeout(r, CFG.mode==='react'? 120 : 60); });
    var h = helpers();
    for (var i=0;i<tests.length;i++){
      if (window.__CV_ERR){ out.push({ ok:false, error: window.__CV_ERR }); continue; }
      try{
        var f = new Function('$','$$','css','text','exists','logs','fn','tick','"use strict"; return ('+tests[i].e+');');
        var v = f(h.$,h.$$,h.css,h.text,h.exists,h.logs,h.fn,h.tick);
        if (v && typeof v.then === 'function') v = await Promise.race([v, new Promise(function(_,rej){ setTimeout(function(){ rej(new Error('Timeout')); }, 2500); })]);
        out.push({ ok: !!v });
      }catch(e){ out.push({ ok:false, error: (e && e.name ? e.name+': '+e.message : String(e)) }); }
    }
    return out;
  }
  function start(){
    try { runUser(); } catch(e){ window.__CV_ERR = String(e); }
    runTests().then(function(results){ send({ type:'done', results: results, error: window.__CV_ERR, logs: logs }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();`;
}

export interface BuildOptions {
  mode: SandboxMode;
  files: CodeFiles;
  tests?: SandboxTest[];
  runId: string;
  theme?: 'dark' | 'light';
}

/** iframe srcdoc uchun to'liq HTML hujjat */
export function buildDocument({ mode, files, tests = [], runId, theme = 'light' }: BuildOptions): string {
  const js = protectLoops(files.js || '');
  const cfg = embed({ runId, mode, tests, code: js });
  const reactScripts = mode === 'react' ? `<script src="${CDN.react}" crossorigin></script><script src="${CDN.reactDom}" crossorigin></script><script src="${CDN.babel}" crossorigin></script>` : '';
  const baseCss =
    mode === 'js'
      ? `body{font-family:ui-monospace,Menlo,Consolas,monospace;padding:12px;color:${theme === 'dark' ? '#e2e8f0' : '#0f172a'};background:${theme === 'dark' ? '#0b1020' : '#fff'}}`
      : 'body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:8px}';
  const html = mode === 'react' && !/id=["']root["']/.test(files.html || '') ? `${files.html || ''}<div id="root"></div>` : files.html || '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseCss}</style><style>${files.css || ''}</style>${reactScripts}<script>window.__CV_CFG=${cfg};</script><script>${runtimeScript()}</script></head><body>${html}</body></html>`;
}

let counter = 0;
export const newRunId = () => `run-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/** Yashirin iframe'da testlarni bajarish */
export function runTests(opts: { mode: SandboxMode; files: CodeFiles; tests: SandboxTest[]; timeoutMs?: number }): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const runId = newRunId();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', SANDBOX_FLAGS);
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:0;visibility:hidden';
    const logs: ConsoleEntry[] = [];
    let settled = false;
    const finish = (outcome: RunOutcome) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      iframe.remove();
      resolve(outcome);
    };
    const onMessage = (ev: MessageEvent) => {
      const d = ev.data as { source?: string; runId?: string; type?: string; level?: ConsoleEntry['level']; text?: string; results?: TestResult[]; error?: string | null };
      if (ev.source !== iframe.contentWindow || !d || d.source !== 'codeverse' || d.runId !== runId) return;
      if (d.type === 'console' && d.text != null) logs.push({ level: d.level ?? 'log', text: String(d.text) });
      if (d.type === 'done') finish({ results: d.results ?? [], logs, error: d.error ?? null, timedOut: false });
    };
    window.addEventListener('message', onMessage);
    const timer = setTimeout(() => finish({ results: opts.tests.map(() => ({ ok: false, error: 'Timeout' })), logs, error: 'Timeout: kod juda uzoq bajarildi', timedOut: true }), opts.timeoutMs ?? (opts.mode === 'react' ? 15000 : 6000));
    iframe.srcdoc = buildDocument({ mode: opts.mode, files: opts.files, tests: opts.tests, runId });
    document.body.appendChild(iframe);
  });
}
