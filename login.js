/* little moods · login.js
   ---------------------------------------------------------------
   the "garden gate": a mood-key login for when you run little moods
   on your own computer. keep this file in the same folder as index.html.

   · your garden's name is your username
   · tapping 4–8 mood friends in a secret order is your password
   · entries are encrypted (AES-GCM, key from PBKDF2) before they're
     saved in this browser, so nobody else using the computer can read them
   · "save a backup" downloads a locked .garden file for another computer

   delete this file and the site still works, just without a lock.
   --------------------------------------------------------------- */
(function addGateToPage(){
  const style = document.createElement('style');
  style.textContent = `
  /* garden gate (local login) */
  .gate{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;overflow:auto;
    background:linear-gradient(90deg,#C9D2CA 0 30%,#E7CDC2 30% 66%,#F0DED3 66% 72%,#E9CFC4 72% 100%)}
  .gate[hidden],#local-tools[hidden]{display:none}
  .gate-card{width:min(470px,100%);background:linear-gradient(175deg,#FFF7EF 0%,#FBE4D8 70%,#F6D5C9 100%);border-radius:40px;padding:24px 26px 22px;box-shadow:var(--shadow),var(--inset);text-align:center}
  .gate-art{width:220px;margin:-6px auto -4px}
  .gate-art svg{width:100%;height:auto}
  .gate h1{font-size:28px;line-height:1.15}
  .gate .sub{margin:8px 0 14px}
  .gate input[type=text]{text-align:center;font-weight:700;font-size:16px;border-radius:999px;margin-bottom:14px}
  .key-dots{display:flex;justify-content:center;gap:10px;margin-bottom:12px;min-height:16px}
  .key-dots i{width:15px;height:15px;border-radius:50%;background:rgba(107,74,63,.13);box-shadow:inset 0 1px 2px rgba(107,74,63,.15);transition:.2s}
  .key-dots i.f{background:radial-gradient(circle at 35% 30%,#F8C2AE,#EA8B72);transform:scale(1.1)}
  .keypad{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;background:rgba(255,255,255,.5);border-radius:28px;padding:12px 8px;box-shadow:var(--inset)}
  .keypad button{width:calc(25% - 8px);padding:4px;border-radius:22px;transition:transform .15s}
  .keypad button:hover{background:rgba(255,255,255,.7)}
  .keypad button:active,.keypad button.pop{transform:scale(.86)}
  .keypad svg{width:100%;max-width:70px;height:auto}
  .gate-row{display:flex;justify-content:center;gap:8px;margin:12px 0 4px}
  .gate-msg{min-height:20px;color:#C4664F;font-weight:800;font-size:13px;margin:6px 0 10px}
  .gate-msg button{text-decoration:underline;font-weight:800;color:#C4664F}
  .gate-switch{font-size:13px;font-weight:700;color:var(--ink-soft);margin:14px 0 0}
  .gate-switch button,.linkish{text-decoration:underline;cursor:pointer;font-weight:800;color:var(--ink)}
  .gate-note{font-size:12px;color:var(--ink-soft);font-weight:600;margin:10px 0 0;line-height:1.4}
  .shake{animation:shake .45s}
  @keyframes shake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  #local-tools{display:flex;gap:8px;align-items:center}
`;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend', `
<div class="gate" id="gate" hidden>
  <form class="gate-card" id="gate-card" autocomplete="off">
    <div class="gate-art" id="gate-art"></div>
    <h1 id="gate-title">welcome back to your garden</h1>
    <p class="sub" id="gate-sub">type your garden's name, then tap your secret mood key.</p>
    <input type="text" id="g-name" placeholder="your garden's name" maxlength="30" aria-label="garden name">
    <div class="key-dots" id="key-dots" aria-live="polite"></div>
    <div class="keypad" id="keypad"></div>
    <div class="gate-row"><button type="button" class="chip-btn" id="g-undo">undo</button><button type="button" class="chip-btn" id="g-clear">start over</button></div>
    <p class="gate-msg" id="g-msg" role="alert"></p>
    <button type="submit" class="save" id="g-go">open my garden</button>
    <p class="gate-switch"><button type="button" id="g-switch">new here? plant a new garden</button> · <label class="linkish">bring in a backup<input type="file" id="g-import" accept=".garden,.json,application/json" hidden></label></p>
    <p class="gate-note" id="g-note"></p>
  </form>
</div>
`);
  document.getElementById('status').insertAdjacentHTML('afterend', `
      <div id="local-tools" hidden>
        <button class="chip-btn" id="backup" title="download an encrypted backup of your garden">save a backup</button>
        <button class="chip-btn" id="lock">lock 🔒</button>
      </div>
`);
})();

/* ---------- local garden: encrypted vault + mood-key login ---------- */
const enc = new TextEncoder(), dec = new TextDecoder();
let vault = null;            // {id, salt, key, gardenName} while unlocked
let saveChain = Promise.resolve();
function b64(buf){ const a=new Uint8Array(buf); let s=''; for(let i=0;i<a.length;i+=0x8000) s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000)); return btoa(s); }
const unb64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
const norm = n => n.trim().toLowerCase().replace(/\s+/g,' ');
const ls = { get:k=>{try{return localStorage.getItem(k)}catch(e){return null}}, set:(k,v)=>localStorage.setItem(k,v), del:k=>{try{localStorage.removeItem(k)}catch(e){}} };
async function gardenId(name){
  const h = await crypto.subtle.digest('SHA-256', enc.encode('little-moods:'+norm(name)));
  return b64(h).replace(/[^a-z0-9]/gi,'').slice(0,24);
}
async function deriveKey(name, seq, salt){
  const base = await crypto.subtle.importKey('raw', enc.encode(norm(name)+'|'+seq.join('-')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:400000, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
function readVault(id){ try{ const r=JSON.parse(ls.get('lm_vault_'+id)); return r && r.ct ? r : null; }catch(e){ return null; } }
function anyVault(){ try{ for(let i=0;i<localStorage.length;i++) if(localStorage.key(i).startsWith('lm_vault_')) return true; }catch(e){} return false; }
async function sealVault(){
  if(!vault) return;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, vault.key, enc.encode(JSON.stringify({name:userName, entries})));
  const rec = {v:1, app:'little-moods', id:vault.id, salt:b64(vault.salt), iv:b64(iv), ct:b64(ct)};
  ls.set('lm_vault_'+vault.id, JSON.stringify(rec));
}
function persist(){
  saveChain = saveChain.then(sealVault).catch(()=>toast("couldn't save. your browser's storage may be full or turned off"));
  return saveChain;
}
async function unlock(name, seq, rec){
  const key = await deriveKey(name, seq, unb64(rec.salt));
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:unb64(rec.iv)}, key, unb64(rec.ct)); // throws on wrong key
  const data = JSON.parse(dec.decode(pt));
  vault = {id:rec.id, salt:unb64(rec.salt), key, gardenName:name.trim()};
  return data;
}
async function plant(name, seq){
  const id = await gardenId(name); const salt = crypto.getRandomValues(new Uint8Array(16));
  vault = {id, salt, key: await deriveKey(name, seq, salt), gardenName:name.trim()};
  // bring over anything saved by the earlier, unlocked version of this page
  let old = []; try{ old = JSON.parse(ls.get('lm_entries')||'[]'); }catch(e){}
  const data = {name: name.trim(), entries: Array.isArray(old)?old:[]};
  entries = data.entries; userName = data.name;
  await sealVault();
  ls.del('lm_entries'); ls.del('lm_name');
  return data;
}


/* ---------- the garden gate ---------- */
const KEY_LEN = 4;   // a mood key is exactly 4 emotions
let gate = {mode:'open', stage:1, seq:[], first:null, busy:false};

// little "step 1 · step 2" pills and a friendly green note, added above the dots
$('key-dots').insertAdjacentHTML('beforebegin', '<div class="g-steps" id="g-steps"></div><p class="g-good" id="g-good"></p>');
(function(){ const st=document.createElement('style'); st.textContent=`
  .g-steps{display:flex;justify-content:center;gap:8px;margin:0 0 10px}
  .g-steps span{font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.55);color:var(--ink-soft);transition:.25s}
  .g-steps span.on{background:linear-gradient(135deg,#F8C9A6,#EFAAA0);color:#fff;box-shadow:0 6px 12px -8px rgba(200,100,75,.8)}
  .g-steps span.done{background:#CFEADC;color:#4f7d62}
  .g-good{min-height:0;margin:0 0 8px;font-weight:800;font-size:14px;color:#4f7d62}
  .g-good:empty{display:none}
  .key-dots i{width:18px;height:18px}`; document.head.appendChild(st); })();

function showGate(mode){
  gate = {mode, stage:1, seq:[], first:null, busy:false};
  $('gate').hidden = false; $('local-tools').hidden = true;
  $('g-msg').textContent = ''; $('g-good').textContent = '';
  renderGate();
  if(!(window.crypto && crypto.subtle)){
    $('g-msg').textContent = "this browser won't let the garden lock itself here. open your github pages link instead, or use chrome, edge or firefox.";
    $('g-go').disabled = true;
  }
  setTimeout(()=>$('g-name').focus(), 50);
}
function renderGate(){
  $('key-dots').innerHTML = Array.from({length:KEY_LEN},(_,i)=>`<i class="${i<gate.seq.length?'f':''}"></i>`).join('');
  $('key-dots').setAttribute('aria-label', `${gate.seq.length} of ${KEY_LEN} emotions tapped`);
  const nw = gate.mode==='new';
  $('g-steps').innerHTML = nw
    ? `<span class="${gate.stage===1?'on':'done'}">${gate.stage===1?'1':'✓'} choose your key</span><span class="${gate.stage===2?'on':''}">2 repeat it</span>`
    : '';
  $('gate-title').textContent = nw ? (gate.stage===1 ? 'make your garden' : 'now repeat your key') : 'welcome back to your garden';
  $('gate-sub').textContent = nw
    ? (gate.stage===1 ? 'name your garden, then tap 4 emotions in a secret order. that order is your password.' : 'tap the same 4 emotions, in the same order.')
    : "type your garden's name, then tap your 4 secret emotions.";
  $('g-go').textContent = gate.busy ? (nw ? 'creating your garden…' : 'unlocking…') : nw ? (gate.stage===1 ? 'next: repeat my key' : 'create my garden ✿') : 'open my garden';
  $('g-go').disabled = gate.busy || !(window.crypto && crypto.subtle);
  $('g-name').disabled = gate.busy || (nw && gate.stage===2);
  $('g-switch').textContent = nw ? 'already have a garden? open it' : 'new here? make a garden';
  $('g-note').textContent = nw
    ? "your moods are locked with this key and kept only in this browser. there's no reset, so pick an order you'll remember."
    : 'forgot your key? there is no way back in, which is what keeps your feelings private.';
}
function gateError(msg){
  $('g-good').textContent = '';
  $('g-msg').textContent = msg;
  const c = $('gate-card'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
}
$('keypad').innerHTML = ORDER.map(k=>`<button type="button" data-k="${k}" aria-label="${MOODS[k].label}">${blob(k,{noShadow:true})}</button>`).join('');
$('gate-art').innerHTML = mascotSVG();
$('keypad').addEventListener('click', e=>{
  const b = e.target.closest('[data-k]'); if(!b || gate.busy || gate.seq.length >= KEY_LEN) return;
  gate.seq.push(b.dataset.k); $('g-msg').textContent='';
  b.classList.add('pop'); setTimeout(()=>b.classList.remove('pop'),150);
  renderGate();
  // the 4th tap moves things along by itself (as long as there's a name)
  if(gate.seq.length === KEY_LEN && $('g-name').value.trim()) setTimeout(submitGate, 280);
});
$('g-undo').onclick = ()=>{ if(gate.busy) return; gate.seq.pop(); renderGate(); };
$('g-clear').onclick = ()=>{ if(gate.busy) return; gate.seq=[]; gate.stage=1; gate.first=null; $('g-msg').textContent=''; $('g-good').textContent=''; renderGate(); };
$('g-switch').onclick = ()=>{ const n=$('g-name').value; showGate(gate.mode==='new' ? 'open' : 'new'); $('g-name').value=n; };
$('gate-card').addEventListener('submit', ev=>{ ev.preventDefault(); submitGate(); });

async function submitGate(){
  if(gate.busy) return;
  const name = $('g-name').value;
  if(!name.trim()) return gateError('give your garden a name first');
  if(gate.seq.length < KEY_LEN) return gateError(`tap ${KEY_LEN - gate.seq.length} more emotion${KEY_LEN-gate.seq.length>1?'s':''}`);
  try{
    const id = await gardenId(name); const rec = readVault(id);

    if(gate.mode==='open'){
      if(!rec){
        gateError(''); $('g-msg').innerHTML = `no garden called “${esc(name.trim())}” in this browser yet. <button type="button" id="g-to-new">make it?</button>`;
        $('g-to-new').onclick=()=>{ showGate('new'); $('g-name').value=name; };
        gate.seq=[]; renderGate(); return;
      }
      gate.busy = true; renderGate();
      try{
        const data = await unlock(name, gate.seq, rec);
        entries = (data.entries||[]).sort((a,b)=>b.ts-a.ts); userName = data.name || name.trim();
        gate.busy=false; enterGarden(false);
      }catch(err){
        gate.busy=false; gate.seq=[]; renderGate(); gateError("hmm, that key doesn't open this garden");
      }
      return;
    }

    // making a new garden — step 1: choose
    if(gate.stage===1){
      if(rec){ gate.seq=[]; renderGate(); return gateError('a garden with that name already lives here. open it instead, or pick another name'); }
      gate.first = gate.seq.slice(); gate.seq=[]; gate.stage=2;
      $('g-msg').textContent=''; renderGate();
      $('g-good').textContent = '✓ got it! now tap the same 4 again';
      return;
    }
    // step 2: repeat
    if(gate.seq.join() !== gate.first.join()){
      gate.stage=1; gate.first=null; gate.seq=[]; renderGate();
      return gateError("those didn't match. let's choose your key again");
    }
    gate.busy = true; $('g-good').textContent=''; renderGate();
    await plant(name, gate.seq);
    gate.busy=false; enterGarden(true);
  }catch(err){
    console.error(err);
    gate.busy=false; gate.seq=[]; renderGate();
    gateError("something went wrong saving your garden here. is private browsing on? try a normal window.");
  }
}

function enterGarden(isNew){
  $('gate').hidden = true; $('local-tools').hidden = false;
  $('name').textContent = userName;
  setStatus(`🔒 ${vault.gardenName} · private to this browser`, true);
  selectedDay=null; calMonth=new Date(); calMonth.setDate(1);
  renderAll(); lastActive = Date.now();
  toast(blob(isNew?'joyful':'calm',{noShadow:true}) + (isNew ? ' your garden is planted' : ' welcome back'));
}
function lockGarden(){
  vault = null; entries = []; userName = 'lovely'; $('name').textContent = userName;
  renderAll(); setStatus('locked'); showGate('open');
}
/* lock button */
$('lock').onclick = ()=>{ saveChain.then(lockGarden); };

/* auto-lock after 20 quiet minutes */
let lastActive = Date.now();
['pointerdown','keydown','scroll'].forEach(ev=>addEventListener(ev,()=>{ lastActive=Date.now(); },{passive:true}));
setInterval(()=>{ if(backend==='local' && vault && Date.now()-lastActive > 20*60e3) saveChain.then(lockGarden); }, 30e3);

/* backups: an encrypted .garden file you can carry to another computer */
$('backup').onclick = async ()=>{
  await saveChain; const raw = vault && ls.get('lm_vault_'+vault.id); if(!raw) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([raw],{type:'application/json'}));
  a.download = `little-moods-${vault.gardenName.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'garden'}.garden`;
  document.body.appendChild(a); a.click(); a.remove();
  toast('backup saved. it stays locked with your mood key');
};
$('g-import').addEventListener('change', async ev=>{
  const f = ev.target.files[0]; ev.target.value=''; if(!f) return;
  let rec; try{ rec = JSON.parse(await f.text()); }catch(e){ return gateError("that file doesn't look like a garden backup"); }
  if(!rec || rec.app!=='little-moods' || !/^[A-Za-z0-9]{8,40}$/.test(rec.id||'') || !rec.salt || !rec.iv || !rec.ct) return gateError("that file doesn't look like a garden backup");
  const put = ()=>{ try{ ls.set('lm_vault_'+rec.id, JSON.stringify(rec)); showGate('open'); $('g-msg').textContent = 'backup brought in. open it with its name and mood key'; }catch(e){ gateError("couldn't store the backup here"); } };
  const existing = readVault(rec.id);
  if(existing && existing.ct !== rec.ct){
    gateError(''); $('g-msg').innerHTML = 'a garden with this name already lives here. <button type="button" id="g-replace">replace it with the backup?</button>';
    $('g-replace').onclick = put; return;
  }
  put();
});


/* the little doorway index.html talks to */
window.GardenGate = {
  start(){ setStatus('locked'); showGate(anyVault() ? 'open' : 'new'); },
  isOpen(){ return !!vault; },
  save(){ return persist(); },
};
