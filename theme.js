/* little moods · theme.js
   ---------------------------------------------------------------
   light & dark mode.
   · by default it follows your device's light/dark setting
   · the sun/moon button in the top bar switches it, and this
     browser remembers your choice
   · all the dark colours live here, for the main page, the login
     screen (account.js) and the diary (diary.js)

   this file is loaded in the <head> so the page never flashes
   bright before going dark.
   --------------------------------------------------------------- */

(function(){
  const KEY = 'lm_theme';
  const saved = (()=>{ try{ return localStorage.getItem(KEY); }catch(e){ return null; } })();
  const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const startTheme = saved || (systemDark && systemDark.matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = startTheme;

  const css = `
  html[data-theme="dark"]{color-scheme:dark;background:#2C2526}
  html[data-theme="dark"]{
    --cream:#3B302F; --ink:#F4E6DC; --ink-soft:#C9AEA2;
    --shadow:0 26px 50px -24px rgba(0,0,0,.65), 0 8px 18px -10px rgba(0,0,0,.4);
    --inset:inset 0 1px 0 rgba(255,255,255,.06), inset 0 -2px 6px rgba(0,0,0,.15);
    --chart-grid:#4A3E3B; --chart-empty:#6A5853;
  }
  [data-theme="dark"] body{
    background:
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 .9  0 0 0 0 .85  0 0 0 .035 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"),
      linear-gradient(90deg,#252A28 0 30%,#2E2627 30% 66%,#342A2A 66% 72%,#2C2526 72% 100%);
    background-attachment:fixed;
  }
  [data-theme="dark"] nav{background:rgba(48,38,38,.7)}
  [data-theme="dark"] nav a:hover{background:#45393A}
  [data-theme="dark"] .status{background:rgba(255,255,255,.07)}
  [data-theme="dark"] .status.ok{color:#9BD0B0}
  [data-theme="dark"] .floaty{opacity:.55}

  /* main cards */
  [data-theme="dark"] .hero{background:linear-gradient(170deg,#5B4036 0%,#4E352D 55%,#45302A 100%)}
  [data-theme="dark"] .date,[data-theme="dark"] .hero .sub{color:#E7BFA9}
  [data-theme="dark"] .greet .name{border-bottom-color:rgba(244,230,220,.3)}
  [data-theme="dark"] .mini-stats{background:rgba(0,0,0,.2)}
  [data-theme="dark"] .mini{background:#3A2D2A}
  [data-theme="dark"] .checkin{background:linear-gradient(175deg,#3B3131 0%,#3A2D2E 60%,#3B2B2B 100%)}
  [data-theme="dark"] .mood.on{background:rgba(255,255,255,.09)}
  [data-theme="dark"] .panel{background:rgba(255,255,255,.05)}
  [data-theme="dark"] textarea,[data-theme="dark"] input[type=text]{background:#2A2223;box-shadow:inset 0 2px 5px rgba(0,0,0,.3)}
  [data-theme="dark"] textarea::placeholder,[data-theme="dark"] input::placeholder{color:#8F766C}
  [data-theme="dark"] .tag{background:#3A2F2E}
  [data-theme="dark"] .garden{background:linear-gradient(175deg,#46332F 0%,#3F2E2B 100%)}
  [data-theme="dark"] .day{background:rgba(255,255,255,.04)}
  [data-theme="dark"] .day:hover{background:rgba(255,255,255,.11)}
  [data-theme="dark"] .day.has{background:rgba(255,255,255,.08)}
  [data-theme="dark"] .day.sel{background:rgba(255,255,255,.15)}
  [data-theme="dark"] .day-pop{background:#3C3130;box-shadow:0 18px 36px -16px rgba(0,0,0,.7)}
  [data-theme="dark"] .day-pop::after{background:#3C3130;box-shadow:none}
  [data-theme="dark"] .insights{background:linear-gradient(175deg,#2F3A33 0%,#2A342E 100%)}
  [data-theme="dark"] .stat.g{background:linear-gradient(170deg,#36493E,#2E4035)}
  [data-theme="dark"] .stat.y{background:linear-gradient(170deg,#504632,#463B27)}
  [data-theme="dark"] .chart-box{background:rgba(0,0,0,.2)}
  [data-theme="dark"] .top-mood{background:rgba(0,0,0,.17)}
  [data-theme="dark"] .journal{background:linear-gradient(175deg,#2C3830 0%,#28332C 100%)}
  [data-theme="dark"] .row{color:#4A322A}
  [data-theme="dark"] .del{color:#7E5A4C}
  [data-theme="dark"] .breathe{background:linear-gradient(175deg,#3E3330 0%,#3A2E2A 100%)}
  [data-theme="dark"] .paces{background:rgba(0,0,0,.22);box-shadow:none}
  [data-theme="dark"] .paces button:hover{background:rgba(255,255,255,.07)}
  [data-theme="dark"] .paces button[aria-checked="true"]{background:#4A3D3A}
  [data-theme="dark"] .pill-btn{color:#24402F}
  [data-theme="dark"] .kind{background:linear-gradient(175deg,#4A3F2C 0%,#43372A 100%)}

  /* login screen (account.js) */
  [data-theme="dark"] .gate{background:linear-gradient(90deg,#252A28 0 30%,#2E2627 30% 66%,#342A2A 66% 72%,#2C2526 72% 100%)}
  [data-theme="dark"] .gate-card{background:linear-gradient(175deg,#3D3232 0%,#382C2C 70%,#352929 100%)}
  [data-theme="dark"] .gate .g-name{background:#2A2223;box-shadow:inset 0 2px 5px rgba(0,0,0,.3)}
  [data-theme="dark"] .keypad{background:rgba(255,255,255,.05)}
  [data-theme="dark"] .keypad button:hover{background:rgba(255,255,255,.08)}
  [data-theme="dark"] .key-dots i:not(.f){background:rgba(255,255,255,.12)}
  [data-theme="dark"] .g-steps span:not(.on):not(.done){background:rgba(255,255,255,.08)}
  [data-theme="dark"] .g-steps span.done{background:#36493E;color:#B9E3C8}
  [data-theme="dark"] .g-good{color:#9BD0B0}
  [data-theme="dark"] .gate-msg,[data-theme="dark"] .gate-msg button{color:#F29C86}

  /* diary (diary.js) */
  [data-theme="dark"] .diary{background:linear-gradient(175deg,#3D2C2B 0%,#372828 100%)}
  [data-theme="dark"] .d-count{background:rgba(0,0,0,.22);color:#E6C8BA}
  [data-theme="dark"] .d-fonts{background:rgba(0,0,0,.22);box-shadow:none}
  [data-theme="dark"] .d-fonts button{color:#CDB1A6}
  [data-theme="dark"] .d-fonts button:hover{background:rgba(255,255,255,.07)}
  [data-theme="dark"] .d-fonts button[aria-checked="true"]{background:#4A3D3A;color:var(--ink)}
  [data-theme="dark"] .book{background:linear-gradient(180deg,#A95F4F,#924E41)}
  [data-theme="dark"] .page{background-color:#2F2728}
  [data-theme="dark"] .page.left{box-shadow:inset -26px 0 30px -24px rgba(0,0,0,.6)}
  [data-theme="dark"] .page.right{box-shadow:inset 26px 0 30px -24px rgba(0,0,0,.6)}
  [data-theme="dark"] .book.single .page.right{box-shadow:none}
  [data-theme="dark"] .lines{background-image:linear-gradient(transparent calc(var(--lh) - 1px),#463938 calc(var(--lh) - 1px))}
  [data-theme="dark"] .pg-body,[data-theme="dark"] .d-text,[data-theme="dark"] .intro .owner{color:#EEDCD0}
  [data-theme="dark"] .d-text::placeholder{color:#7D6660}
  [data-theme="dark"] .pg-time,[data-theme="dark"] .intro .belongs,[data-theme="dark"] .new-wrap small{color:#B8998D}
  [data-theme="dark"] .pg-num{color:#9C8077}
  [data-theme="dark"] .intro p{color:#C9AEA2}
  [data-theme="dark"] .blank-end{color:#6E5A55}
  [data-theme="dark"] .pg-tools button{background:#3E3332;color:#D9BDB1}
  [data-theme="dark"] .pg-tools button.ask{background:#2F2728;color:#F29C86;box-shadow:0 0 0 1.5px #A95F4F}
  [data-theme="dark"] .d-btn.quiet{background:#3E3332;color:#D9BDB1}
  [data-theme="dark"] .page.right:not(.is-last)::after{background:linear-gradient(135deg,transparent 50%,#4A3C3B 50%,#3E3333 100%)}
  [data-theme="dark"] .page.left:not(.is-first)::after{background:linear-gradient(225deg,transparent 50%,#4A3C3B 50%,#3E3333 100%)}
  [data-theme="dark"] .flipper .page::before{background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.3))}

  /* the switch itself */
  .theme-btn{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--cream);box-shadow:var(--inset),0 6px 12px -8px rgba(107,74,63,.6);transition:transform .25s}
  .theme-btn:hover{transform:rotate(-14deg)}
  .theme-btn svg{width:22px;height:22px}
  .theme-btn .sun{display:none}
  [data-theme="dark"] .theme-btn .sun{display:block}
  [data-theme="dark"] .theme-btn .moon{display:none}
  html.theme-fade *,html.theme-fade *::before,html.theme-fade *::after{transition:background-color .35s ease,color .35s ease,border-color .35s ease!important}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function apply(theme, remember){
    const root = document.documentElement;
    root.classList.add('theme-fade');
    root.dataset.theme = theme;
    setTimeout(()=>root.classList.remove('theme-fade'), 450);
    const btn = document.getElementById('theme-btn');
    if(btn){
      btn.setAttribute('aria-label', theme==='dark' ? 'switch to light mode' : 'switch to dark mode');
      btn.setAttribute('aria-pressed', theme==='dark');
      btn.title = btn.getAttribute('aria-label');
    }
    if(remember){ try{ localStorage.setItem(KEY, theme); }catch(e){} }
  }

  // follow the device setting until you pick one yourself
  if(systemDark && systemDark.addEventListener){
    systemDark.addEventListener('change', e=>{
      let chosen=null; try{ chosen = localStorage.getItem(KEY); }catch(err){}
      if(!chosen) apply(e.matches ? 'dark' : 'light', false);
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const status = document.getElementById('status'); if(!status) return;
    status.insertAdjacentHTML('beforebegin', `
      <button class="theme-btn" id="theme-btn" type="button">
        <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#F2C6A0" stroke="#C98F6B" stroke-width="1.5" stroke-linejoin="round"/></svg>
        <svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="#FFD487"/><g stroke="#FFD487" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g></svg>
      </button>`);
    const btn = document.getElementById('theme-btn');
    btn.addEventListener('click', ()=>apply(document.documentElement.dataset.theme==='dark' ? 'light' : 'dark', true));
    apply(document.documentElement.dataset.theme, false);
    document.documentElement.classList.remove('theme-fade');
  });
})();
