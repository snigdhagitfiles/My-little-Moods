/* little moods · account.js
   ---------------------------------------------------------------
   real accounts + syncing across your devices, using Supabase.

   how it works:
   1. you log in with your email (a magic link, no password)
   2. the first time, you choose a 4-emotion "mood key"
   3. every mood is encrypted on your device with that key before
      it's uploaded, so the database only ever stores scrambled text
   4. on any other device: log in with the same email, tap your key,
      and your garden is there

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
  .gate input[type=email]{width:100%;border:0;border-radius:999px;padding:14px 18px;font:inherit;font-weight:700;font-size:16px;text-align:center;color:var(--ink);background:#fffaf5;box-shadow:inset 0 2px 5px rgba(107,74,63,.09);outline:none;margin-bottom:12px}
  .gate input[type=email]:focus{box-shadow:inset 0 2px 5px rgba(107,74,63,.09),0 0 0 3px rgba(238,159,118,.35)}
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
  #acct-tools{display:flex;gap:8px;align-items:center}`;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
<div class="gate" id="gate" hidden>
  <div class="gate-card" id="gate-card">
    <div class="gate-art" id="gate-art"></div>
    <h1 id="gate-title">little moods</h1>
    <p class="sub" id="gate-sub"></p>

    <div class="g-sec" id="sec-loading" hidden><div class="spin"></div></div>

    <form class="g-sec" id="sec-email" hidden>
      <input type="email" id="g-email" placeholder="you@example.com" autocomplete="email" aria-label="email address">
      <button type="submit" class="save" id="g-send">email me a login link ✉</button>
    </form>

    <div class="g-sec" id="sec-sent" hidden>
      <div class="sent-mail" id="g-sent-to"></div>
      <button type="button" class="chip-btn" id="g-resend">send it again</button>
      <button type="button" class="chip-btn" id="g-other-email">use a different email</button>
    </div>

    <div class="g-sec" id="sec-key" hidden>
      <div class="g-steps" id="g-steps"></div>
      <p class="g-good" id="g-good"></p>
      <div class="key-dots" id="key-dots" aria-live="polite"></div>
      <div class="keypad" id="keypad"></div>
      <div class="gate-row"><button type="button" class="chip-btn" id="g-undo">undo</button><button type="button" class="chip-btn" id="g-clear">start over</button></div>
    </div>

    <div class="g-sec" id="sec-reset" hidden>
      <button type="button" class="save danger" id="g-reset-go">delete everything & choose a new key</button>
      <div class="gate-row"><button type="button" class="chip-btn" id="g-reset-back">never mind, take me back</button></div>
    </div>

    <p class="gate-msg" id="g-msg" role="alert"></p>
    <p class="gate-note" id="g-note"></p>
    <p class="gate-links" id="g-links"></p>
  </div>
</div>`);

  document.getElementById('status').insertAdjacentHTML('afterend', `
<div id="acct-tools" hidden>
  <button class="chip-btn" id="lock" title="lock until you tap your mood key again">lock 🔒</button>
  <button class="chip-btn" id="signout">log out</button>
</div>`);
})();

/* ---------- connecting to supabase ---------- */
const CFG = window.LITTLE_MOODS_CONFIG || {};
const configured = !!(CFG.supabaseUrl && CFG.supabaseKey && !/YOUR[-_]/i.test(CFG.supabaseUrl + CFG.supabaseKey));
let sb = null;
try{
  if(configured && window.supabase && window.supabase.createClient){
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
      auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'implicit' }  // implicit = the email link works on any device
    });
  }
}catch(e){ console.error(e); }

/* ---------- encryption helpers ---------- */
const enc = new TextEncoder(), dec = new TextDecoder();
function b64(buf){ const a=new Uint8Array(buf); let s=''; for(let i=0;i<a.length;i+=0x8000) s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000)); return btoa(s); }
const unb64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
async function deriveKey(seq, salt){
  const base = await crypto.subtle.importKey('raw', enc.encode('little-moods|'+seq.join('-')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:600000, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function seal(key, obj){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(JSON.stringify(obj)));
  return {iv:b64(iv), ct:b64(ct)};
}
async function open_(key, iv, ct){
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:unb64(iv)}, key, unb64(ct));
  return JSON.parse(dec.decode(pt));
}

/* ---------- account state ---------- */
const KEY_LEN = 4;
let acct = {user:null, key:null, vault:null};
let gate = {view:'loading', stage:1, seq:[], first:null, busy:false, email:''};
let resendAt = 0;
const show = id => ['sec-loading','sec-email','sec-sent','sec-key','sec-reset'].forEach(s=>$(s).hidden = s!==id);

function msg(t){ $('g-msg').textContent = t || ''; }
function shake(t){
  $('g-good').textContent=''; msg(t);
  const c=$('gate-card'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
}
function links(html){ $('g-links').innerHTML = html || ''; }

function openGate(view, opts={}){
  gate.view = view; gate.busy = false;
  if(!opts.keepKey){ gate.stage=1; gate.seq=[]; gate.first=null; }
  $('gate').hidden = false; $('acct-tools').hidden = true;
  msg(opts.msg); $('g-good').textContent = '';
  renderGate();
}
function renderGate(){
  const v = gate.view; const who = acct.user ? acct.user.email : '';
  $('g-note').textContent = ''; links('');
  if(v==='setup'){
    show(null);
    $('gate-title').textContent = 'almost ready';
    $('gate-sub').textContent = !configured
      ? "this site isn't connected to its database yet. add your supabase project url and publishable key to config.js (README.md shows how)."
      : "couldn't reach the login service. check your internet connection and refresh the page.";
    return;
  }
  if(v==='loading'){ show('sec-loading'); $('gate-title').textContent='opening your garden…'; $('gate-sub').textContent=''; return; }
  if(v==='email'){
    show('sec-email');
    $('gate-title').textContent = 'welcome to little moods';
    $('gate-sub').textContent = "log in or sign up with your email. we'll send you a link, no password needed.";
    $('g-send').disabled = gate.busy; $('g-send').textContent = gate.busy ? 'sending…' : 'email me a login link ✉';
    $('g-note').textContent = 'same email on your laptop and phone = the same garden on both.';
    return;
  }
  if(v==='sent'){
    show('sec-sent');
    $('gate-title').textContent = 'check your email ✉';
    $('gate-sub').textContent = 'we sent a login link to:';
    $('g-sent-to').textContent = gate.email;
    $('g-note').textContent = "tap the link on the device you want to use. it can take a minute to arrive, so peek in spam too. you can close this tab.";
    return;
  }
  if(v==='reset'){
    show('sec-reset');
    $('gate-title').textContent = 'forgot your mood key?';
    $('gate-sub').textContent = "your moods are encrypted with your key, so not even we can read them without it. the only way forward is to start a fresh garden. this permanently deletes every mood you've saved.";
    return;
  }
  // choosing or tapping the mood key
  show('sec-key');
  const creating = v==='create';
  $('key-dots').innerHTML = Array.from({length:KEY_LEN},(_,i)=>`<i class="${i<gate.seq.length?'f':''}"></i>`).join('');
  $('key-dots').setAttribute('aria-label', `${gate.seq.length} of ${KEY_LEN} emotions tapped`);
  $('g-steps').innerHTML = creating
    ? `<span class="${gate.stage===1?'on':'done'}">${gate.stage===1?'1':'✓'} choose your key</span><span class="${gate.stage===2?'on':''}">2 repeat it</span>` : '';
  if(gate.busy){
    $('gate-title').textContent = creating ? 'planting your garden…' : 'unlocking…';
    $('gate-sub').textContent = 'just a moment ✿';
  } else if(creating){
    $('gate-title').textContent = gate.stage===1 ? 'choose your mood key' : 'now repeat your key';
    $('gate-sub').textContent = gate.stage===1
      ? 'tap 4 emotions in a secret order. you\'ll tap this each time you open your garden.'
      : 'tap the same 4 emotions, in the same order.';
    $('g-note').textContent = "your key locks (encrypts) your moods before they leave this device. there's no way to recover it, so pick an order you'll remember.";
  } else {
    $('gate-title').textContent = 'welcome back ✿';
    $('gate-sub').textContent = 'tap your 4 secret emotions to open your garden.';
  }
  links(`logged in as <b>${esc(who)}</b> · <button type="button" id="g-signout">log out</button>` +
        (creating ? '' : ` · <button type="button" id="g-forgot">forgot your key?</button>`));
  $('g-signout').onclick = signOut;
  if(!creating) $('g-forgot').onclick = ()=>openGate('reset');
}

/* ---------- step 1: email login ---------- */
$('sec-email').addEventListener('submit', async ev=>{
  ev.preventDefault(); if(gate.busy) return;
  const email = $('g-email').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return shake("that email doesn't look quite right");
  gate.busy = true; msg(''); renderGate();
  const {error} = await sb.auth.signInWithOtp({ email, options:{ emailRedirectTo: location.origin + location.pathname } });
  gate.busy = false;
  if(error){ renderGate(); return shake(friendlyAuthError(error)); }
  gate.email = email; resendAt = Date.now()+60e3;
  openGate('sent');
});
$('g-resend').onclick = async ()=>{
  const wait = Math.ceil((resendAt-Date.now())/1000);
  if(wait>0) return msg(`you can ask for another link in ${wait}s`);
  const {error} = await sb.auth.signInWithOtp({ email:gate.email, options:{ emailRedirectTo: location.origin + location.pathname } });
  if(error) return shake(friendlyAuthError(error));
  resendAt = Date.now()+60e3; msg(''); $('g-good').textContent=''; toast('sent another link ✉');
};
$('g-other-email').onclick = ()=>openGate('email');
function friendlyAuthError(e){
  const m = (e && e.message || '').toLowerCase();
  if(m.includes('rate') || m.includes('seconds') || e.status===429) return 'too many emails for now. wait a little and try again';
  if(m.includes('redirect')) return "this site's address isn't allowed yet. add it under authentication → url configuration in supabase";
  return 'something went wrong sending the link: ' + (e.message || 'please try again');
}

/* ---------- step 2: the mood key ---------- */
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

async function submitKey(){
  if(gate.busy || gate.seq.length<KEY_LEN) return;
  try{
    if(gate.view==='unlock'){
      gate.busy = true; renderGate();
      const key = await deriveKey(gate.seq, unb64(acct.vault.salt));
      let profile;
      try{ profile = await open_(key, acct.vault.check_iv, acct.vault.check_ct); }
      catch(e){ gate.busy=false; gate.seq=[]; renderGate(); return shake("hmm, that key doesn't open this garden"); }
      acct.key = key; userName = profile.name || 'lovely';
      await loadEntries();
      return enterGarden(false);
    }
    // creating a key
    if(gate.stage===1){
      gate.first = gate.seq.slice(); gate.seq=[]; gate.stage=2; renderGate();
      $('g-good').textContent = '✓ got it! now tap the same 4 again'; return;
    }
    if(gate.seq.join()!==gate.first.join()){
      gate.stage=1; gate.first=null; gate.seq=[]; renderGate();
      return shake("those didn't match. let's choose your key again");
    }
    gate.busy = true; $('g-good').textContent=''; renderGate();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(gate.seq, salt);
    const name = acct.user.email.split('@')[0].slice(0,30);
    const check = await seal(key, {app:'little-moods', name});
    const row = {user_id:acct.user.id, salt:b64(salt), check_iv:check.iv, check_ct:check.ct};
    const {error} = await sb.from('vaults').insert(row);
    if(error) throw error;
    acct.vault = row; acct.key = key; userName = name;
    entries = []; await bringOverLocalMoods();
    enterGarden(true);
  }catch(err){
    console.error(err);
    gate.busy=false; gate.seq=[]; if(gate.view==='create'){ gate.stage=1; gate.first=null; }
    renderGate(); shake("couldn't reach your garden. check your connection and try again");
  }
}

/* moods saved by the older, device-only version of this page come along too */
async function bringOverLocalMoods(){
  let old=[]; try{ old = JSON.parse(localStorage.getItem('lm_entries')||'[]'); }catch(e){}
  if(!Array.isArray(old) || !old.length) return;
  for(const e of old){ if(e && e.id && MOODS[e.mood]) await addEntry_(e, true); }
  try{ localStorage.removeItem('lm_entries'); }catch(e){}
}

/* ---------- forgot key: start fresh ---------- */
$('g-reset-back').onclick = ()=>openGate('unlock');
$('g-reset-go').onclick = async ()=>{
  const b = $('g-reset-go');
  if(!b.dataset.sure){ b.dataset.sure='1'; b.textContent='tap again to delete everything'; setTimeout(()=>{ delete b.dataset.sure; b.textContent='delete everything & choose a new key'; },4000); return; }
  b.disabled = true;
  const uid = acct.user.id;
  const r1 = await sb.from('entries').delete().eq('user_id', uid);
  const r2 = await sb.from('vaults').delete().eq('user_id', uid);
  b.disabled = false; delete b.dataset.sure; b.textContent='delete everything & choose a new key';
  if(r1.error || r2.error) return shake("couldn't clear your garden. try again in a moment");
  acct.vault = null; openGate('create', {msg:''});
};

/* ---------- after logging in ---------- */
let loggingIn = false;
async function afterLogin(user){
  if(loggingIn || (acct.user && acct.user.id===user.id)) return;
  loggingIn = true; acct.user = user; openGate('loading');
  try{
    const {data, error} = await sb.from('vaults').select('salt,check_iv,check_ct').maybeSingle();
    if(error) throw error;
    acct.vault = data;
    openGate(data ? 'unlock' : 'create');
  }catch(e){
    console.error(e); acct.user=null;
    openGate('email', {msg:"logged in, but couldn't open your garden. did you run supabase-setup.sql?"});
  }finally{ loggingIn=false; }
}

/* ---------- reading and writing moods ---------- */
async function loadEntries(){
  const {data, error} = await sb.from('entries').select('id,iv,ct');
  if(error) throw error;
  const out = [];
  for(const r of data){
    try{ const e = await open_(acct.key, r.iv, r.ct); e.id = r.id; if(MOODS[e.mood]) out.push(e); }catch(e){}
  }
  entries = out.sort((a,b)=>b.ts-a.ts);
}
async function addEntry_(e, quiet){
  const {id, ...rest} = e;
  const box = await seal(acct.key, rest);
  const {error} = await sb.from('entries').insert({user_id:acct.user.id, id, iv:box.iv, ct:box.ct});
  if(error){ if(!quiet) throw error; return; }
  if(quiet) entries.unshift(e);
}

function enterGarden(isNew){
  gate.busy=false; $('gate').hidden = true; $('acct-tools').hidden = false;
  $('name').textContent = userName;
  setStatus(`☁ synced · ${acct.user.email}`, true);
  selectedDay=null; calMonth=new Date(); calMonth.setDate(1);
  renderAll(); lastActive = Date.now();
  toast(blob(isNew?'joyful':'calm',{noShadow:true}) + (isNew ? ' your garden is planted' : ' welcome back'));
}

/* ---------- lock, log out, auto-lock, syncing ---------- */
function lockGarden(){
  acct.key = null; entries = []; userName='lovely'; $('name').textContent=userName;
  renderAll(); setStatus('locked'); openGate('unlock');
}
async function signOut(){
  try{ await sb.auth.signOut(); }catch(e){}
  acct = {user:null, key:null, vault:null}; entries=[]; userName='lovely'; $('name').textContent=userName;
  renderAll(); setStatus('logged out'); openGate('email');
}
$('lock').onclick = lockGarden;
$('signout').onclick = signOut;

let lastActive = Date.now();
['pointerdown','keydown','scroll'].forEach(ev=>addEventListener(ev,()=>{ lastActive=Date.now(); },{passive:true}));
setInterval(()=>{ if(acct.key && Date.now()-lastActive > 20*60e3) lockGarden(); }, 30e3);

// pick up moods added on your other devices
async function refresh(){
  if(!acct.key || document.hidden) return;
  const before = entries.map(e=>e.id).join();
  try{ await loadEntries(); }catch(e){ return; }
  if(entries.map(e=>e.id).join()!==before) renderAll();
}
document.addEventListener('visibilitychange', refresh);
setInterval(refresh, 60e3);

/* ---------- what index.html talks to ---------- */
window.GardenGate = {
  async start(){
    if(!sb){ setStatus('not connected'); return openGate('setup'); }
    if(!(window.crypto && crypto.subtle)){ openGate('setup'); $('gate-sub').textContent = 'this browser can\'t do the encryption little moods needs. please open the site over https in a recent browser.'; return; }
    openGate('loading'); setStatus('opening your garden…');
    sb.auth.onAuthStateChange((event, session)=>{
      if(session && session.user && !acct.user) afterLogin(session.user);
      if(event==='SIGNED_OUT' && acct.user){ acct={user:null,key:null,vault:null}; entries=[]; renderAll(); openGate('email'); }
    });
    const {data} = await sb.auth.getSession();
    if(data && data.session) afterLogin(data.session.user);
    else if(!acct.user) openGate('email');
  },
  isOpen(){ return !!acct.key; },
  async add(e){
    if(!acct.key) return false;
    entries.unshift(e); renderAll();
    try{ await addEntry_(e); return true; }
    catch(err){ console.error(err); entries = entries.filter(x=>x.id!==e.id); renderAll(); toast("hmm, that didn't save. try again?"); return false; }
  },
  async remove(id){
    const keep = entries; entries = entries.filter(x=>x.id!==id); renderAll();
    const {error} = await sb.from('entries').delete().eq('user_id', acct.user.id).eq('id', id);
    if(error){ entries = keep; renderAll(); toast("couldn't remove that one"); }
  },
  async saveName(n){
    if(!acct.key) return;
    const box = await seal(acct.key, {app:'little-moods', name:n});
    const {error} = await sb.from('vaults').update({check_iv:box.iv, check_ct:box.ct}).eq('user_id', acct.user.id);
    if(!error){ acct.vault.check_iv=box.iv; acct.vault.check_ct=box.ct; }
  },
};
