/* little moods · diary.js
   ---------------------------------------------------------------
   "my diary": an open notebook at the bottom of the page.
   · click the right page to turn forward, the left page to go back
     (on a phone: tap the right or left side of the page)
   · the newest page has "+ add journal entry": type on the lines,
     then "done" saves it (ctrl/⌘ + enter works too)
   · each page can be edited or torn out

   pages are saved alongside your moods (as {kind:'diary', ts, text}),
   so they sync and are encrypted the same way. index.html sorts them
   into the `diary` list; this file draws the book and saves pages.

   keep this file next to index.html. new journal features go here.
   --------------------------------------------------------------- */

/* ---------- the book's look and markup ---------- */
(function addDiaryToPage(){
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Caveat:wght@500&family=Patrick+Hand&display=swap';
  document.head.appendChild(font);

  const style = document.createElement('style');
  style.textContent = `
  /* ---------- diary ---------- */
  .diary{background:linear-gradient(175deg,#F4D6CC 0%,#EBC3B6 100%);padding-bottom:30px}
  .d-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:6px}
  .book{--d-font:"Gaegu","Nunito",cursive;--d-size:24px}
  .book[data-font="handwritten"]{--d-font:"Caveat","Nunito",cursive;--d-size:27px}
  .book[data-font="neat"]{--d-font:"Patrick Hand","Nunito",cursive;--d-size:22px}
  .d-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .d-fonts{display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
  .d-fonts button{padding:6px 14px;border-radius:999px;color:#7E5A4C;line-height:1.1;transition:background .2s,box-shadow .2s}
  .d-fonts button:hover{background:rgba(255,255,255,.6)}
  .d-fonts button[aria-checked="true"]{background:#FFF9F3;color:#5B3D33;box-shadow:0 6px 12px -8px rgba(107,74,63,.6)}
  .d-fonts .f-cute{font-family:"Gaegu",cursive;font-size:19px;font-weight:700}
  .d-fonts .f-handwritten{font-family:"Caveat",cursive;font-size:21px}
  .d-fonts .f-neat{font-family:"Patrick Hand",cursive;font-size:17px}
  .d-count{font-weight:800;font-size:13px;color:#8a5e50;background:rgba(255,255,255,.55);padding:7px 14px;border-radius:999px}
  .book{position:relative;display:grid;grid-template-columns:1fr 1fr;padding:12px;border-radius:30px;
    background:linear-gradient(180deg,#E79C86,#D9826B);box-shadow:0 30px 50px -26px rgba(120,60,45,.7),inset 0 2px 0 rgba(255,255,255,.35);
    perspective:2400px;margin-top:10px}
  .book.single{grid-template-columns:1fr}
  .book.single .page.left{display:none}
  .page{position:relative;height:560px;background:#FFFBF4;display:flex;flex-direction:column;padding:26px 30px 18px;box-sizing:border-box;cursor:pointer;overflow:hidden;outline:none}
  .page.left{border-radius:20px 4px 4px 20px;box-shadow:inset -26px 0 30px -24px rgba(120,70,50,.35)}
  .page.right{border-radius:4px 20px 20px 4px;box-shadow:inset 26px 0 30px -24px rgba(120,70,50,.35)}
  .book.single .page.right{border-radius:20px;box-shadow:inset 0 0 0 1px rgba(120,70,50,.06)}
  .page:focus-visible{box-shadow:0 0 0 3px #EE9F76}
  .page::after{content:"";position:absolute;bottom:0;width:0;height:0;transition:width .25s,height .25s}
  .page.right:not(.is-last)::after{right:0;border-radius:0 0 20px 0;background:linear-gradient(135deg,transparent 50%,#F0DED0 50%,#E6CDBD 100%)}
  .page.left:not(.is-first)::after{left:0;border-radius:0 0 0 20px;background:linear-gradient(225deg,transparent 50%,#F0DED0 50%,#E6CDBD 100%)}
  .page:hover::after{width:34px;height:34px}
  .page.editing,.page.editing::after{cursor:default}
  .page.editing::after{display:none}
  .lines{--lh:34px;background-image:linear-gradient(transparent calc(var(--lh) - 1px),#EAD7CC calc(var(--lh) - 1px));background-size:100% var(--lh);background-attachment:local;line-height:var(--lh)}
  .pg-date{font-family:"Fredoka","Nunito",sans-serif;font-weight:500;font-size:20px;line-height:1.2}
  .pg-time{font-size:12px;font-weight:800;color:#A17F72;margin:2px 0 10px}
  .pg-body{flex:1;overflow:auto;font-family:var(--d-font);font-size:var(--d-size);color:#5B3D33;white-space:pre-wrap;overflow-wrap:anywhere;padding-top:3px;margin:0 -4px;padding-left:4px;padding-right:4px}
  .pg-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;min-height:32px}
  .pg-num{font-size:12px;font-weight:800;color:#B39385}
  .pg-tools{display:flex;gap:6px}
  .pg-tools button{font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;background:#F7ECE4;color:#7E5A4C}
  .pg-tools button.ask{background:#fff;color:#C4664F;box-shadow:0 0 0 1.5px #EFAAA0}
  .d-text{flex:1;width:100%;border:0;resize:none;outline:none;font-family:var(--d-font);font-size:var(--d-size);color:#5B3D33;background-color:transparent;padding:3px 4px 0;margin:0 -4px;box-sizing:content-box}
  .book .d-text,.book .d-text:focus{box-shadow:none;border-radius:0}
  .d-text::placeholder{color:#CDB3A6}
  .d-btn{font-weight:800;font-size:14px;padding:10px 20px;border-radius:999px}
  .d-btn.done{color:#fff;background:linear-gradient(180deg,#F4A88E,#EA8B72);box-shadow:0 10px 18px -10px rgba(200,100,75,.8)}
  .d-btn.quiet{background:#F7ECE4;color:#7E5A4C}
  .new-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center}
  .new-wrap .blobby{width:96px}
  .add-entry{font-family:"Fredoka","Nunito",sans-serif;font-size:19px;color:#fff;padding:14px 26px;border-radius:999px;background:linear-gradient(180deg,#F4A88E,#EA8B72);box-shadow:0 14px 24px -12px rgba(200,100,75,.8);transition:transform .2s}
  .add-entry:hover{transform:translateY(-2px)}
  .new-wrap small{font-weight:700;color:#A17F72;font-size:13px}
  .intro{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px}
  .intro .belongs{font-weight:800;font-size:13px;letter-spacing:.06em;color:#A17F72}
  .intro .owner{font-family:var(--d-font);font-size:calc(var(--d-size) * 1.85);font-weight:700;line-height:1.1}
  .intro p{margin:6px 0 0;font-weight:700;color:#8a6a5e;font-size:14px;max-width:280px;line-height:1.5}
  .intro .blobby{width:120px;margin-bottom:6px}
  .blank-end{flex:1;display:flex;align-items:flex-end;justify-content:center;color:#CDB3A6;font-family:var(--d-font);font-size:var(--d-size)}
  .flipper{position:absolute;z-index:3;transform-style:preserve-3d;transition:transform .75s cubic-bezier(.45,.05,.25,1);pointer-events:none}
  .flipper.fwd{transform-origin:left center}
  .flipper.fwd.go{transform:rotateY(-180deg)}
  .flipper.back{transform-origin:right center}
  .flipper.back.go{transform:rotateY(180deg)}
  .flipper .page{position:absolute;inset:0;height:auto;backface-visibility:hidden;-webkit-backface-visibility:hidden}
  .flipper .page.backside{transform:rotateY(180deg)}
  .flipper .page::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(120,70,50,0),rgba(120,70,50,.12));opacity:0;transition:opacity .75s}
  .flipper.go .page::before{opacity:1}
  .d-nav{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:16px}
  .d-nav button{width:44px;height:44px;border-radius:50%;background:var(--cream);font-weight:800;font-size:18px;box-shadow:var(--inset),0 6px 12px -8px rgba(107,74,63,.6)}
  .d-nav button:disabled{opacity:.4;cursor:default}
  .d-nav span{font-weight:800;font-size:13px;color:#7E5A4C;min-width:120px;text-align:center}
  @media (max-width:760px){.page{height:520px;padding:22px 22px 16px}}
`;
  document.head.appendChild(style);

  const section = document.getElementById('diary');
  section.innerHTML = `
      <div class="d-head">
        <div>
          <h2>my diary</h2>
          <p class="sub" style="margin-bottom:0">a quiet place for longer thoughts. click the right page to turn forward, the left page to go back.</p>
        </div>
        <div class="d-right">
          <div class="d-fonts" id="d-fonts" role="radiogroup" aria-label="diary handwriting">
            <button role="radio" class="f-cute" data-font="cute">cute</button>
            <button role="radio" class="f-handwritten" data-font="handwritten">handwritten</button>
            <button role="radio" class="f-neat" data-font="neat">neat</button>
          </div>
          <span class="d-count" id="d-count"></span>
        </div>
      </div>
      <div class="book" id="book">
        <div class="page left lines" id="pg-left" tabindex="0" aria-label="previous page"></div>
        <div class="page right lines" id="pg-right" tabindex="0" aria-label="next page"></div>
      </div>
      <div class="d-nav">
        <button id="d-prev" aria-label="turn back a page">‹</button>
        <span id="d-pages" aria-live="polite"></span>
        <button id="d-next" aria-label="turn to the next page">›</button>
      </div>
    
`;
  section.hidden = false;
})();

/* ---------- the diary: a book you flip through ---------- */
const D = { spread:null, single:null, editing:null, anim:false, pendingAsk:null, len:0, lastSeen:0 };
const NEWPAGE = {kind:'new'}, INTRO = {kind:'intro'};
const bookPages = () => [INTRO, ...diary, NEWPAGE];
const isSingle = () => window.matchMedia('(max-width: 760px)').matches;
const longDate = t => new Date(t).toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).toLowerCase();

function pageInner(p, i){
  if(!p) return `<div class="blank-end">the end, for now ✿</div>`;
  if(p.kind==='intro') return `<div class="intro"><div class="blobby">${blob('loved')}</div><div class="belongs">this diary belongs to</div><div class="owner">${esc(userName)}</div><p>write whatever you need to. it's just for you.</p></div>`;
  if(p.kind==='new'){
    if(D.editing && D.editing.id===null) return editorInner(Date.now(), '');
    return `<div class="pg-date">${longDate(Date.now())}</div><div class="pg-time">a fresh page</div>
      <div class="new-wrap"><div class="blobby">${blob('calm')}</div><button class="add-entry" data-act="new">+ add journal entry</button><small>${diary.length ? 'pick up where you left off' : 'your very first page'}</small></div>
      <div class="pg-foot"><span class="pg-num">page ${i}</span></div>`;
  }
  if(D.editing && D.editing.id===p.id) return editorInner(p.ts, p.text);
  const ask = D.pendingAsk===p.id;
  return `<div class="pg-date">${longDate(p.ts)}</div><div class="pg-time">${clock(p.ts)}${p.edited?' · edited':''}</div>
    <div class="pg-body lines">${esc(p.text)}</div>
    <div class="pg-foot"><span class="pg-num">page ${i}</span><span class="pg-tools"><button data-act="edit" data-id="${esc(p.id)}">edit</button><button data-act="tear" data-id="${esc(p.id)}" class="${ask?'ask':''}">${ask?'tear it out?':'tear out'}</button></span></div>`;
}
function editorInner(ts, text){
  return `<div class="pg-date">${longDate(ts)}</div><div class="pg-time">${clock(ts)} · writing</div>
    <textarea class="d-text lines" id="d-text" maxlength="12000" aria-label="journal entry" placeholder="dear diary…">${esc(text)}</textarea>
    <div class="pg-foot"><span class="pg-num">ctrl/⌘ + enter to finish</span><span class="pg-tools"><button class="d-btn quiet" data-act="cancel">cancel</button><button class="d-btn done" data-act="done">done</button></span></div>`;
}
function spreadOf(i){ return Math.floor(i/2); }
function lastSpread(){ return spreadOf(bookPages().length-1); }

function renderDiary(){
  const pages = bookPages(), single = isSingle();
  const book=$('book'), L=$('pg-left'), R=$('pg-right');
  if(D.anim) return;
  if(D.editing && document.getElementById('d-text')) return;   // don't wipe what you're typing
  if(D.single!==single){ D.single=single; D.spread=null; D.len=0; }
  book.classList.toggle('single', single);
  const last = single ? pages.length-1 : lastSpread();
  // open at the newest page; if pages arrive (logging in, syncing) while you're at the end, stay at the end
  if(D.len!==pages.length){ if(D.spread===null || D.spread>=D.lastSeen) D.spread = last; D.len = pages.length; }
  if(D.spread===null || D.spread>last) D.spread = last;
  D.lastSeen = last;
  let li, ri;
  if(single){ li=-1; ri=D.spread; } else { li=D.spread*2; ri=li+1; }
  L.innerHTML = li>=0 ? pageInner(pages[li], li) : '';
  R.innerHTML = pageInner(pages[ri], ri);
  L.classList.toggle('is-first', li<=0); R.classList.toggle('is-last', ri>=pages.length-1);
  const ed = id => D.editing && pages[id] && ((pages[id].kind==='new' && D.editing.id===null) || pages[id].id===D.editing.id);
  L.classList.toggle('editing', !!ed(li)); R.classList.toggle('editing', !!ed(ri));
  $('d-prev').disabled = D.spread<=0 || !!D.editing;
  $('d-next').disabled = D.spread>=last || !!D.editing;
  $('d-pages').textContent = single ? `page ${ri+1} of ${pages.length}` : `pages ${li+1}–${Math.min(ri+1,pages.length)} of ${pages.length}`;
  $('d-count').textContent = diary.length ? `${diary.length} page${diary.length>1?'s':''} written` : 'no pages yet';
  const ta = document.getElementById('d-text');
  if(ta){ ta.focus({preventScroll:true}); ta.setSelectionRange(ta.value.length, ta.value.length); }
}

function flip(dir){
  if(D.anim || D.editing) return;
  const pages = bookPages(), single = isSingle();
  const last = single ? pages.length-1 : lastSpread();
  const target = D.spread + dir;
  if(target<0 || target>last) return;
  D.pendingAsk = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){ D.spread=target; renderDiary(); return; }
  const book=$('book'), L=$('pg-left'), R=$('pg-right');
  const idx = s => single ? [-1, s] : [s*2, s*2+1];
  const [ol, or] = idx(D.spread), [nl, nr] = idx(target);
  const under = dir>0 ? R : (single ? R : L);
  const box = under.getBoundingClientRect(), bb = book.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'flipper ' + (dir>0 ? 'fwd' : 'back');
  Object.assign(f.style, {left:(box.left-bb.left)+'px', top:(box.top-bb.top)+'px', width:box.width+'px', height:box.height+'px'});
  let front, backside, frontCls, backCls;
  if(single){
    // one page at a time: the page lifts off and turns over
    front = pageInner(pages[or], or); backside = ''; frontCls='right'; backCls='left';
    if(dir<0){ f.className='flipper fwd go'; front = pageInner(pages[nr], nr); }
  } else if(dir>0){ front = pageInner(pages[or], or); backside = pageInner(pages[nl], nl); frontCls='right'; backCls='left'; }
  else { front = pageInner(pages[ol], ol); backside = pageInner(pages[nr], nr); frontCls='left'; backCls='right'; }
  f.innerHTML = `<div class="page ${frontCls} lines">${front}</div><div class="page ${backCls} lines backside">${backside}</div>`;
  // what's revealed underneath while the page turns
  if(single){ if(dir>0) R.innerHTML = pageInner(pages[nr], nr); }
  else if(dir>0) R.innerHTML = pageInner(pages[nr], nr);
  else L.innerHTML = pageInner(pages[nl], nl);
  D.anim = true; book.appendChild(f);
  const finish = ()=>{ if(!D.anim) return; D.anim=false; D.spread=target; f.remove(); renderDiary(); };
  if(single && dir<0){
    // turning back on a phone: the previous page falls back into place
    requestAnimationFrame(()=>requestAnimationFrame(()=>f.classList.remove('go')));
  } else {
    requestAnimationFrame(()=>requestAnimationFrame(()=>f.classList.add('go')));
  }
  f.addEventListener('transitionend', finish, {once:true});
  setTimeout(finish, 1000);
}

/* saving pages: works with your account, claude.ai, or this browser */
async function storeDiaryPage(page, oldId){
  diary = diary.filter(x=>x.id!==page.id && x.id!==oldId).concat(page).sort((a,b)=>a.ts-b.ts);
  if(backend==='cloud'){ await entriesRef.doc(page.id).set(page); if(oldId && oldId!==page.id) await entriesRef.doc(oldId).delete(); return; }
  if(window.GardenGate){ await GardenGate.putDiary(page, oldId); return; }
  localSave();
}
async function removeDiaryPage(id){
  const keep = diary; diary = diary.filter(x=>x.id!==id);
  try{
    if(backend==='cloud') await entriesRef.doc(id).delete();
    else if(window.GardenGate) await GardenGate.delDiary(id);
    else localSave();
  }catch(e){ diary = keep; toast("couldn't tear that page out"); }
}

async function finishWriting(){
  const ta = document.getElementById('d-text'); if(!ta || !D.editing) return;
  const text = ta.value.replace(/\s+$/,'');
  const ed = D.editing; const old = ed.id ? diary.find(x=>x.id===ed.id) : null;
  if(!text.trim()){ return stopWriting(); }
  if(old && old.text===text){ return stopWriting(); }
  if(new Blob([text]).size > 13000){ toast('that page is getting long! finish here and keep going on a new page'); return; }
  const page = old
    ? {...old, text, edited:Date.now(), id: (window.GardenGate && backend!=='cloud') ? 'd'+Date.now()+Math.random().toString(36).slice(2,6) : old.id}
    : {id:'d'+Date.now()+Math.random().toString(36).slice(2,6), kind:'diary', ts:Date.now(), text};
  const btn = document.querySelector('[data-act="done"]'); if(btn){ btn.disabled=true; btn.textContent='saving…'; }
  try{
    await storeDiaryPage(page, old ? old.id : null);
    D.editing = null;
    const i = bookPages().findIndex(p=>p.id===page.id);
    D.spread = isSingle() ? i : spreadOf(i);
    D.len = bookPages().length; D.lastSeen = isSingle() ? D.len-1 : lastSpread();
    renderDiary();
    toast(blob('loved',{noShadow:true}) + (old ? ' page updated' : ' saved to your diary'));
  }catch(e){
    console.error(e);
    if(!old) diary = diary.filter(x=>x.id!==page.id);
    if(btn){ btn.disabled=false; btn.textContent='done'; }
    toast("hmm, that page didn't save. try again?");
  }
}
function stopWriting(){ D.editing=null; renderDiary(); }

$('book').addEventListener('click', e=>{
  const act = e.target.closest('[data-act]');
  if(act){
    const a = act.dataset.act, id = act.dataset.id;
    if(a==='new'){ D.editing={id:null}; D.pendingAsk=null; renderDiary(); }
    else if(a==='edit'){ D.editing={id}; D.pendingAsk=null; renderDiary(); }
    else if(a==='done') finishWriting();
    else if(a==='cancel') stopWriting();
    else if(a==='tear'){
      if(D.pendingAsk!==id){ D.pendingAsk=id; renderDiary(); setTimeout(()=>{ if(D.pendingAsk===id){ D.pendingAsk=null; renderDiary(); } },3500); }
      else { D.pendingAsk=null; removeDiaryPage(id).then(renderDiary); renderDiary(); }
    }
    return;
  }
  if(D.editing || e.target.closest('textarea, a, input')) return;
  if(window.getSelection && String(window.getSelection()).length) return;   // selecting text, not turning
  if(isSingle()){
    const r = $('pg-right').getBoundingClientRect();
    flip(e.clientX < r.left + r.width*0.35 ? -1 : 1);
  } else if(e.target.closest('#pg-left')) flip(-1);
  else if(e.target.closest('#pg-right')) flip(1);
});
$('book').addEventListener('keydown', e=>{
  if(e.target.id==='d-text'){
    if(e.key==='Enter' && (e.metaKey||e.ctrlKey)){ e.preventDefault(); finishWriting(); }
    if(e.key==='Escape'){ e.preventDefault(); stopWriting(); }
    return;
  }
  if((e.key==='Enter'||e.key===' ') && (e.target.id==='pg-left'||e.target.id==='pg-right')){ e.preventDefault(); flip(e.target.id==='pg-left'?-1:1); }
  if(e.key==='ArrowRight'){ flip(1); } if(e.key==='ArrowLeft'){ flip(-1); }
});
$('d-prev').onclick = ()=>flip(-1);
$('d-next').onclick = ()=>flip(1);
let dResize; addEventListener('resize', ()=>{ clearTimeout(dResize); dResize=setTimeout(()=>{ if(D.single!==isSingle() && !D.editing) renderDiary(); },150); });


/* ---------- handwriting picker ---------- */
const DIARY_FONTS = ['cute','handwritten','neat'];
function setDiaryFont(f, remember){
  if(!DIARY_FONTS.includes(f)) f = 'cute';
  $('book').dataset.font = f;
  document.querySelectorAll('#d-fonts [data-font]').forEach(b=>{
    const on = b.dataset.font===f;
    b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
  });
  if(remember){ try{ localStorage.setItem('lm_diary_font', f); }catch(e){} }
}
$('d-fonts').addEventListener('click', e=>{
  const b = e.target.closest('[data-font]'); if(b) setDiaryFont(b.dataset.font, true);
});
$('d-fonts').addEventListener('keydown', e=>{
  if(e.key!=='ArrowRight' && e.key!=='ArrowLeft') return;
  e.preventDefault(); e.stopPropagation();
  const i = DIARY_FONTS.indexOf($('book').dataset.font) + (e.key==='ArrowRight' ? 1 : -1);
  const f = DIARY_FONTS[(i + DIARY_FONTS.length) % DIARY_FONTS.length];
  setDiaryFont(f, true); document.querySelector(`#d-fonts [data-font="${f}"]`).focus();
});
let savedFont = 'cute'; try{ savedFont = localStorage.getItem('lm_diary_font') || 'cute'; }catch(e){}
setDiaryFont(savedFont, false);

renderDiary();
