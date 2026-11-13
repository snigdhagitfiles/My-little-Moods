/* little moods · account.js
   ---------------------------------------------------------------
   real accounts that sync across your devices, using Supabase.

   · your garden name is your username
   · tapping 4 emotions in a secret order is your password
   · on your device, those turn into a "verifier" (checked by the database,
     like a password) and an encryption key (which never leaves your device)
   · every mood is encrypted before it's uploaded, so the database only
     stores scrambled text. 5 wrong keys = the garden rests for 15 minutes.

   your supabase details go in config.js (see README.md).
   --------------------------------------------------------------- */

/* ---------- the login screen (added to the page) ---------- */
(function addAccountScreen(){
  const style = document.createElement('style');
  style.textContent = `
  .gate{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;overflow:auto;
    background:linear-gradient(90deg,#C9D2CA 0 30%,#E7CDC2 30% 66%,#F0DED3 66% 72%,#E9CFC4 72% 100%)}
  .gate[hidden],#acct-tools[hidden],.g-sec[hidden]{display:none}
  .gate-card{width:min(470px,100%);background:linear-gradient(175deg,#FFF7EF 0%,#FBE4D8 70%,#F6D5C9 100%);border-radius:40px;padding:24px 26px 22px;box-shadow:var(--shadow),var(--inset);text-align:center}
  .gate-art{width:220px;margin:-6px auto -4px}
  .gate-art svg{width:100%;height:auto}
  .gate h1{font-size:28px;line-height:1.15}
  .gate .sub{margin:8px 0 16px}
  .gate .g-name{width:100%;border:0;border-radius:999px;padding:14px 18px;font:inherit;font-weight:700;font-size:16px;text-align:center;color:var(--ink);background:#fffaf5;box-shadow:inset 0 2px 5px rgba(107,74,63,.09);outline:none;margin-bottom:12px}
  .gate .g-name:focus{box-shadow:inset 0 2px 5px rgba(107,74,63,.09),0 0 0 3px rgba(238,159,118,.35)}
  .g-steps{display:flex;justify-content:center;gap:8px;margin:0 0 10px}
  .g-steps:empty{display:none}
  .g-steps span{font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.55);color:var(--ink-soft);transition:.25s}
  .g-steps span.on{background:linear-gradient(135deg,#F8C9A6,#EFAAA0);color:#fff;box-shadow:0 6px 12px -8px rgba(200,100,75,.8)}
  .g-steps span.done{background:#CFEADC;color:#4f7d62}
  .g-good{margin:0 0 8px;font-weight:800;font-size:14px;color:#4f7d62}
  .g-good:empty{display:none}
  .key-dots{display:flex;justify-content:center;gap:12px;margin-bottom:12px}
  .key-dots i{width:18px;height:18px;border-radius:50%;background:rgba(107,74,63,.13);box-shadow:inset 0 1px 2px rgba(107,74,63,.15);transition:.2s}
  .key-dots i.f{background:radial-gradient(circle at 35% 30%,#F8C2AE,#EA8B72);transform:scale(1.1)}
  .keypad{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;background:rgba(255,255,255,.5);border-radius:28px;padding:12px 8px;box-shadow:var(--inset)}
  .keypad button{width:calc(25% - 8px);padding:4px;border-radius:22px;transition:transform .15s}
  .keypad button:hover{background:rgba(255,255,255,.7)}
  .keypad button:active,.keypad button.pop{transform:scale(.86)}
  .keypad svg{width:100%;max-width:70px;height:auto}
  .gate-row{display:flex;justify-content:center;gap:8px;margin:12px 0 4px}
  .gate-msg{min-height:20px;color:#C4664F;font-weight:800;font-size:13px;margin:8px 0 10px}
  .gate-msg:empty{min-height:0;margin:4px 0}
  .gate-links{font-size:13px;font-weight:700;color:var(--ink-soft);margin:14px 0 0}
  .gate-links button{text-decoration:underline;font-weight:800;color:var(--ink)}
  .gate-note{font-size:12px;color:var(--ink-soft);font-weight:600;margin:10px 0 0;line-height:1.45}
  .gate-note:empty{display:none}
  .sent-mail{font-size:15px;font-weight:700;background:rgba(255,255,255,.6);border-radius:22px;padding:14px;margin-bottom:14px;overflow-wrap:anywhere}
  .save.danger{background:linear-gradient(180deg,#E9967F,#D9705A)}
  .spin{width:44px;height:44px;margin:16px auto;border-radius:50%;border:5px solid rgba(238,159,118,.25);border-top-color:#EE9F76;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .shake{animation:shake .45s}
  @keyframes shake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  #acct-tools{display:flex;gap:8px;align-items:center}
  .gate .g-name:disabled{opacity:.7}`;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
<div class="gate" id="gate" hidden>
  <form class="gate-card" id="gate-card" autocomplete="off">
    <div class="gate-art" id="gate-art"></div>
    <h1 id="gate-title">little moods</h1>
    <p class="sub" id="gate-sub"></p>

    <div class="g-sec" id="sec-loading" hidden><div class="spin"></div></div>

    <div class="g-sec" id="sec-key" hidden>
      <input type="text" id="g-name" class="g-name" placeholder="your garden's name" maxlength="30" aria-label="garden name" spellcheck="false" autocapitalize="off">
      <div class="g-steps" id="g-steps"></div>
      <p class="g-good" id="g-good"></p>
      <div class="key-dots" id="key-dots" aria-live="polite"></div>
      <div class="keypad" id="keypad"></div>
      <div class="gate-row"><button type="button" class="chip-btn" id="g-undo">undo</button><button type="button" class="chip-btn" id="g-clear">start over</button></div>
    </div>

    <p class="gate-msg" id="g-msg" role="alert"></p>
    <p class="gate-note" id="g-note"></p>
    <p class="gate-links" id="g-links"></p>
  </form>
</div>`);

  document.getElementById('status').insertAdjacentHTML('afterend', `
<div id="acct-tools" hidden>
  <button class="chip-btn" id="logout">log out</button>
</div>`);
})();

/* ---------- connecting to supabase ---------- */
const CFG = window.LITTLE_MOODS_CONFIG || {};
const configured = !!(CFG.supabaseUrl && CFG.supabaseKey && !/YOUR-(PROJECT|PUBLISHABLE)/.test(CFG.supabaseUrl + CFG.supabaseKey));
let sb = null;
try{
  if(configured && window.supabase && window.supabase.createClient){
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } });
  }
}catch(e){ console.error(e); }

/* ---------- keys & encryption ----------
   from your garden name + 4 emotions we make, on this device:
   · gardenId  – a hash of the name (the name itself never leaves your device)
   · verifier  – what the database checks, like a password
   · aesKey    – encrypts your moods; it never leaves your device */
const enc = new TextEncoder(), dec = new TextDecoder();
const norm = n => n.trim().toLowerCase().replace(/\s+/g,' ');
const hex = buf => [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
function b64(buf){ const a=new Uint8Array(buf); let s=''; for(let i=0;i<a.length;i+=0x8000) s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000)); return btoa(s); }
const unb64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
async function gardenIdFor(name){ return hex(await crypto.subtle.digest('SHA-256', enc.encode('little-moods:garden:'+norm(name)))); }
async function makeKeys(name, seq){
  const id = await gardenIdFor(name);
  const base = await crypto.subtle.importKey('raw', enc.encode(norm(name)+'|'+seq.join('-')), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2', salt:enc.encode('little-moods|'+id), iterations:600000, hash:'SHA-256'}, base, 512));
  const aesKey = await crypto.subtle.importKey('raw', bits.slice(32), {name:'AES-GCM'}, false, ['encrypt','decrypt']);
  return {id, verifier: hex(bits.slice(0,32)), aesKey};
}
async function seal(obj){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, garden.keys.aesKey, enc.encode(JSON.stringify(obj)));
  return {iv:b64(iv), ct:b64(ct)};
}
async function unseal(keys, iv, ct){
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:unb64(iv)}, keys.aesKey, unb64(ct));
  return JSON.parse(dec.decode(pt));
}
async function call(fn, args){
  const {data, error} = await sb.rpc(fn, args);
  if(error) throw error;
  return data || {};
}

/* ---------- the login screen ---------- */
const KEY_LEN = 4;
let garden = null;   // {keys, name} while you're in
let gate = {view:'open', stage:1, seq:[], first:null, busy:false};
const show = id => ['sec-loading','sec-key'].forEach(s=>$(s).hidden = s!==id);
const lastName = { get(){ try{ return localStorage.getItem('lm_garden')||''; }catch(e){ return ''; } }, set(n){ try{ n ? localStorage.setItem('lm_garden', n) : localStorage.removeItem('lm_garden'); }catch(e){} } };

function msg(t){ $('g-msg').textContent = t || ''; }
function shake(t){
  $('g-good').textContent=''; msg(t);
  const c=$('gate-card'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
}
function openGate(view, opts={}){
  gate = {view, stage:1, seq:[], first:null, busy:false};
  $('gate').hidden = false; $('acct-tools').hidden = true;
  msg(opts.msg); $('g-good').textContent='';
  if(view==='open' || view==='create') $('g-name').value = opts.name!==undefined ? opts.name : (view==='open' ? lastName.get() : '');
  renderGate();
  if(view==='open' || view==='create') setTimeout(()=>{ if(!$('g-name').value) $('g-name').focus(); }, 60);
}
function renderGate(){
  const v = gate.view; $('g-note').textContent=''; $('g-links').innerHTML='';
  if(v==='setup'){
    show(null);
    $('gate-title').textContent = 'almost ready';
    $('gate-sub').textContent = !configured
      ? "this site isn't connected to its database yet. add your supabase project url and publishable key to config.js (README.md shows how)."
      : "couldn't reach the database. check your internet connection and refresh the page.";
    return;
  }
  if(v==='loading'){ show('sec-loading'); return; }
  show('sec-key');
  const creating = v==='create', remembered = !creating && !!lastName.get() && $('g-name').value===lastName.get();
  $('key-dots').innerHTML = Array.from({length:KEY_LEN},(_,i)=>`<i class="${i<gate.seq.length?'f':''}"></i>`).join('');
  $('key-dots').setAttribute('aria-label', `${gate.seq.length} of ${KEY_LEN} emotions tapped`);
  $('g-steps').innerHTML = creating
    ? `<span class="${gate.stage===1?'on':'done'}">${gate.stage===1?'1':'✓'} choose your key</span><span class="${gate.stage===2?'on':''}">2 repeat it</span>` : '';
  $('g-name').disabled = gate.busy || (creating && gate.stage===2);
  if(gate.busy){
    $('gate-title').textContent = creating ? 'planting your garden…' : 'opening your garden…';
    $('gate-sub').textContent = 'just a moment ✿';
    return;
  }
  if(creating){
    $('gate-title').textContent = gate.stage===1 ? 'make a garden' : 'now repeat your key';
    $('gate-sub').textContent = gate.stage===1
      ? 'name your garden, then tap 4 emotions in a secret order. the name is your username, the 4 emotions are your password.'
      : 'tap the same 4 emotions, in the same order.';
    $('g-note').textContent = "use the same garden name and emotions on any device to see your moods. there's no way to recover a forgotten key, so pick one you'll remember.";
    $('g-links').innerHTML = `already have a garden? <button type="button" id="g-to-open">open it</button>`;
    $('g-to-open').onclick = ()=>openGate('open', {name:$('g-name').value});
  } else {
    $('gate-title').textContent = remembered ? `welcome back ✿` : 'open your garden';
    $('gate-sub').textContent = remembered ? 'tap your 4 secret emotions.' : "type your garden's name, then tap your 4 secret emotions.";
    $('g-links').innerHTML = `new here? <button type="button" id="g-to-create">make a garden</button>`;
    $('g-to-create').onclick = ()=>openGate('create');
    $('g-note').textContent = "forgot your key? your moods are locked with it, so there's no way back in. you can always make a new garden.";
  }
}
$('keypad').innerHTML = ORDER.map(k=>`<button type="button" data-k="${k}" aria-label="${MOODS[k].label}">${blob(k,{noShadow:true})}</button>`).join('');
$('gate-art').innerHTML = mascotSVG();
$('keypad').addEventListener('click', e=>{
  const b = e.target.closest('[data-k]'); if(!b || gate.busy || gate.seq.length>=KEY_LEN) return;
  gate.seq.push(b.dataset.k); msg('');
  b.classList.add('pop'); setTimeout(()=>b.classList.remove('pop'),150);
  renderGate();
  if(gate.seq.length===KEY_LEN) setTimeout(submitKey, 280);   // the 4th tap moves things along
});
$('g-undo').onclick = ()=>{ if(gate.busy) return; gate.seq.pop(); renderGate(); };
$('g-clear').onclick = ()=>{ if(gate.busy) return; gate.seq=[]; gate.stage=1; gate.first=null; msg(''); $('g-good').textContent=''; renderGate(); };
$('g-name').addEventListener('input', ()=>{ if(gate.view==='open') renderGate(); });
$('gate-card').addEventListener('submit', ev=>{ ev.preventDefault(); submitKey(); });

function friendly(code){
  code = String(code||'');
  if(code.startsWith('wrong_key')){
    const left = +code.split(':')[1];
    return left>0 ? `hmm, that key doesn't open this garden (${left} ${left===1?'try':'tries'} left before it rests)` : 'too many tries. this garden is resting for 15 minutes';
  }
  return ({
    locked:'too many tries. this garden is resting for 15 minutes, then you can try again',
    taken:'that garden name is already taken. try another one',
    no_garden:'', full:'your garden is full!', bad_request:'something looked off. please refresh and try again',
  })[code] ?? ('something went wrong: '+code);
}

async function submitKey(){
  if(gate.busy) return;
  const name = $('g-name').value.trim();
  if(norm(name).length < 2) { gate.seq=[]; renderGate(); return shake('give your garden a name first (at least 2 letters)'); }
  if(gate.seq.length < KEY_LEN) return shake(`tap ${KEY_LEN-gate.seq.length} more emotion${KEY_LEN-gate.seq.length>1?'s':''}`);
  try{
    if(gate.view==='open'){
      gate.busy=true; renderGate();
      const keys = await makeKeys(name, gate.seq);
      const r = await call('garden_open', {p_id:keys.id, p_verifier:keys.verifier});
      if(r.error){
        gate.busy=false; gate.seq=[]; renderGate();
        if(r.error==='no_garden'){
          shake('');
          $('g-msg').innerHTML = `there's no garden called “${esc(name)}” yet. <button type="button" id="g-make" style="text-decoration:underline;font-weight:800;color:inherit">make it?</button>`;
          $('g-make').onclick = ()=>openGate('create', {name});
          return;
        }
        return shake(friendly(r.error));
      }
      let profile = {};
      try{ profile = await unseal(keys, r.check_iv, r.check_ct); }catch(e){}
      garden = {keys, name: profile.name || name};
      setAll(await decryptAll(r.entries));
      lastName.set(name);
      return enterGarden(false);
    }
    // making a new garden
    if(gate.stage===1){
      gate.first = gate.seq.slice(); gate.seq=[]; gate.stage=2; renderGate();
      $('g-good').textContent = '✓ got it! now tap the same 4 again'; return;
    }
    if(gate.seq.join()!==gate.first.join()){
      gate.stage=1; gate.first=null; gate.seq=[]; renderGate();
      return shake("those didn't match. let's choose your key again");
    }
    gate.busy=true; $('g-good').textContent=''; renderGate();
    const keys = await makeKeys(name, gate.seq);
    garden = {keys, name};
    const box = await seal({app:'little-moods', name});
    const r = await call('garden_create', {p_id:keys.id, p_verifier:keys.verifier, p_check_iv:box.iv, p_check_ct:box.ct});
    if(r.error){ garden=null; gate.busy=false; gate.stage=1; gate.first=null; gate.seq=[]; renderGate(); return shake(friendly(r.error)); }
    entries = []; diary = []; lastName.set(name);
    await bringOverLocalMoods();
    enterGarden(true);
  }catch(err){
    console.error(err); garden=null;
    gate.busy=false; gate.seq=[]; if(gate.view==='create'){ gate.stage=1; gate.first=null; }
    renderGate(); shake("couldn't reach your garden. check your connection and try again");
  }
}

async function decryptAll(rows){
  const out=[];
  for(const r of (rows||[])){
    try{ const e = await unseal(garden.keys, r.iv, r.ct); e.id = r.id; if(MOODS[e.mood] || e.kind==='diary') out.push(e); }catch(e){}
  }
  return out.sort((a,b)=>b.ts-a.ts);
}

/* moods saved by the older, device-only version of this page come along too */
async function bringOverLocalMoods(){
  let old=[]; try{ old = JSON.parse(localStorage.getItem('lm_entries')||'[]'); }catch(e){}
  if(!Array.isArray(old) || !old.length) return;
  for(const e of old){ if(e && e.id && MOODS[e.mood]){ try{ await addOne(e); entries.push(e); }catch(err){} } }
  entries.sort((a,b)=>b.ts-a.ts);
  try{ localStorage.removeItem('lm_entries'); }catch(e){}
}
async function addOne(e){
  const {id, ...rest} = e; const box = await seal(rest);
  const r = await call('garden_add', {p_id:garden.keys.id, p_verifier:garden.keys.verifier, p_entry_id:id, p_iv:box.iv, p_ct:box.ct});
  if(r.error) throw new Error(r.error);
}

function enterGarden(isNew){
  gate.busy=false; $('gate').hidden = true; $('acct-tools').hidden = false;
  userName = garden.name; $('name').textContent = userName;
  setStatus(`🌱 ${lastName.get()} · synced`, true);
  selectedDay=null; calMonth=new Date(); calMonth.setDate(1);
  renderAll(); lastActive = Date.now();
  toast(blob(isNew?'joyful':'calm',{noShadow:true}) + (isNew ? ' your garden is planted' : ' welcome back'));
}

/* ---------- log out, auto log out, syncing ---------- */
function logOut(){
  garden=null; entries=[]; diary=[]; if(typeof D!=='undefined'){ D.editing=null; D.spread=null; D.len=0; } userName='lovely'; $('name').textContent=userName;
  renderAll(); setStatus('logged out'); openGate('open');
}
$('logout').onclick = logOut;

let lastActive = Date.now();
['pointerdown','keydown','scroll'].forEach(ev=>addEventListener(ev,()=>{ lastActive=Date.now(); },{passive:true}));
setInterval(()=>{ if(garden && Date.now()-lastActive > 20*60e3) logOut(); }, 30e3);

// pick up moods added on your other devices
async function refresh(){
  if(!garden || document.hidden) return;
  try{
    const r = await call('garden_open', {p_id:garden.keys.id, p_verifier:garden.keys.verifier});
    if(r.error || !garden) return;
    const next = await decryptAll(r.entries);
    const sig = list => list.map(e=>e.id).sort().join();
    if(sig(next)!==sig(entries.concat(diary))){ setAll(next); renderAll(); }
  }catch(e){}
}
document.addEventListener('visibilitychange', refresh);
setInterval(refresh, 60e3);

/* ---------- what index.html talks to ---------- */
window.GardenGate = {
  start(){
    if(!sb){ setStatus('not connected'); return openGate('setup'); }
    if(!(window.crypto && crypto.subtle)){ openGate('setup'); $('gate-sub').textContent = "this browser can't do the encryption little moods needs. please open the site over https in a recent browser."; return; }
    setStatus('logged out'); openGate('open');
  },
  isOpen(){ return !!garden; },
  async add(e){
    if(!garden) return false;
    entries.unshift(e); renderAll();
    try{ await addOne(e); return true; }
    catch(err){ console.error(err); entries = entries.filter(x=>x.id!==e.id); renderAll(); toast("hmm, that didn't save. try again?"); return false; }
  },
  async remove(id){
    if(!garden) return;
    const keep = entries; entries = entries.filter(x=>x.id!==id); renderAll();
    try{ const r = await call('garden_remove', {p_id:garden.keys.id, p_verifier:garden.keys.verifier, p_entry_id:id}); if(r.error) throw r.error; }
    catch(e){ entries = keep; renderAll(); toast("couldn't remove that one"); }
  },
  // diary pages: an edit uploads the new version first, then removes the old one
  async putDiary(page, oldId){
    if(!garden) throw new Error('locked');
    await addOne(page);
    if(oldId && oldId!==page.id){
      try{ await call('garden_remove', {p_id:garden.keys.id, p_verifier:garden.keys.verifier, p_entry_id:oldId}); }catch(e){}
    }
  },
  async delDiary(id){
    if(!garden) throw new Error('locked');
    const r = await call('garden_remove', {p_id:garden.keys.id, p_verifier:garden.keys.verifier, p_entry_id:id});
    if(r.error) throw new Error(r.error);
  },
  async saveName(n){
    if(!garden) return;
    const box = await seal({app:'little-moods', name:n});
    try{ const r = await call('garden_set_profile', {p_id:garden.keys.id, p_verifier:garden.keys.verifier, p_check_iv:box.iv, p_check_ct:box.ct}); if(!r.error) garden.name=n; }catch(e){}
  },
};
