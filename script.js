'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=k=>{const[a,b,c]=k.split('-');return new Date(a,b-1,c)};
const today=()=>key(new Date());
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='focusdesk:v1',RANK={High:0,Medium:1,Low:2},GOAL=100; // GOAL = daily focus target (minutes)
const T={focus:1500,break:300},VIEWS=['dashboard','tasks','focus','progress'];
const QUOTES=['Small steps. Real progress.','Focus on the step in front of you, not the whole staircase.','Discipline is choosing what you want most over what you want now.','Done is better than perfect.','The secret of getting ahead is getting started.','Study hard now, thank yourself later.','One focused hour beats three distracted ones.','Progress, not perfection.'];
const IC={home:'M3 11l9-8 9 8v10h-6v-6H9v6H3z',check:'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',timer:'M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9v4l2 2M9 2h6',chart:'M5 21V10M12 21V4M19 21v-7',plus:'M12 5v14M5 12h14',play:'M7 4l13 8-13 8z',pause:'M8 5v14M16 5v14',reset:'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',cup:'M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M7 2v3M11 2v3',cal:'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01',bolt:'M13 2L4 14h7l-1 8 9-12h-7z',target:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11.5v1',sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',moon:'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z'};
const svg=n=>`<svg class="i" viewBox="0 0 24 24"><path d="${IC[n]}"/></svg>`;
$$('[data-i]').forEach(e=>e.insertAdjacentHTML('afterbegin',svg(e.dataset.i)));

/* ---------- data ---------- */
let S,flt='all',wk=0,cur=today();
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!Array.isArray(S.tasks)){
  const off=n=>{const d=new Date();d.setDate(d.getDate()+n);return key(d)};
  S={tasks:[
    {t:'Revise physics',sub:'Physics',pri:'High',due:off(0),done:true,doneAt:today()},
    {t:'Practise mathematics',sub:'Mathematics',pri:'High',due:off(0)},
    {t:'Read English',sub:'English',pri:'Medium',due:off(1)},
    {t:'Complete assignment',sub:'Computer Science',pri:'Medium',due:off(2)},
    {t:'Review notes',sub:'General',pri:'Low',due:off(3)}
  ].map((x,i)=>({id:Date.now()+i,...x})),log:{}};
}
S.log=S.log||{};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const renderAll=()=>{renderStats();rememberTasks();renderProgress();drawTimer();renderExttras()};
const commit=()=>{save();renderAll()};

/* ---------- greeting, date, time, quote (device locale + timezone) ---------- */
function clock(){
  const n=new Date(),h=n.getHours(),tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
  $('#greet').textContent=(h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Good night')+', Student!';
  $('#gIcon').innerHTML=svg(h>=6&&h<18?'sun':'moon');
  $('#date').textContent=n.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'})+' · '+n.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})+(tz?' · '+tz.split('/').pop().replace(/_/g,' '):'');
  $('#quote').textContent=QUOTES[Math.floor((n-new Date(n.getFullYear(),0,0))/864e5)%QUOTES.length];
  if(key(n)!==cur){cur=key(n);renderAll()}
}

/* ---------- stats ---------- */
function renderStats(){
  const d=S.tasks.filter(t=>t.done).length,n=S.tasks.length,m=(S.log[today()]||{}).m||0;
  $('#sTasks').textContent=d+' / '+n;
  $('#pTasks').style.width=(n?d/n*100:0)+'%';
  $('#sFocus').textContent=m+' min';
  $('#pFocus').style.width=Math.min(100,m/GOAL*100)+'%';
}

/* ---------- tasks ---------- */
const rel=k=>{const d=Math.round((parse(k)-parse(today()))/864e5);return d===0?'Today':d===1?'Tomorrow':parse(k).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})};
function renderTasks(){
 const list=S.tasks.filter(t=>(flt==='all'||(flt==='completed')===!!t.done)&&(!qry||(T.t+''+T.sub).toLowerCase().includes(qry)))
    .sort((a,b)=>(!!a.done-!!b.done)||a.due.localeCompare(b.due)||(RANK[a.pri]-RANK[b.pri]));
  $('#list').innerHTML=list.map(t=>`<li class="${t.done?'done':''}"><input type="checkbox" data-id="${t.id}" ${t.done?'checked':''} aria-label="Mark complete"><div><div class="tt">${esc(t.t)}</div><div class="meta">${esc(t.sub)} · ${esc(t.pri)} priority</div></div><div class="due${!t.done&&t.due<today()?' late':''}">${svg('cal')}${rel(t.due)}</div><button class="more" data-del="${t.id}" title="Delete task" aria-label="Delete task">⋯</button></li>`).join('')
    || `<li class="empty">${qry?'No tasks match your search.':flt==='completed'?'No completed tasks yet.':flt==='pending'?'All caught up!':'No tasks yet.Add one to get started.'}</li>`;
  $$('#pills button').forEach(b=>b.classList.toggle('on',b.dataset.f===flt));
}
$('#pills').onclick=e=>{const f=e.target.dataset.f;if(f){flt=f;renderTasks()}};
$('#list').onchange=e=>{const t=S.tasks.find(t=>t.id==e.target.dataset.id);if(t){t.done=e.target.checked;t.doneAt=t.done?today():undefined;commit()}};
$('#list').onclick=e=>{const b=e.target.closest('[data-del]');if(b&&confirm('Delete this task?')){S.tasks=S.tasks.filter(t=>t.id!=b.dataset.del);commit()}};

const dlg=$('#dlg'),tf=$('#tf');
$$('[data-add]').forEach(b=>b.onclick=()=>{tf.reset();tf.due.value=today();dlg.showModal();tf.t.focus()});
$('#cancel').onclick=()=>dlg.close();
dlg.onclick=e=>{if(e.target===dlg)dlg.close()};
tf.onsubmit=e=>{
  e.preventDefault();
  const f=Object.fromEntries(new FormData(tf)),t=f.t.trim();
  if(!t)return;
  if(editId!==null){const x=S.tasks.find(k=>k.id===editId);if(x){x.t=T;x.sub=f.sub.trim()||'General';x.pri=f.pri;x.due=f.due||x.due}dlg.cose();commit();toast('Task updated');return}
  if(flt==='completed')flt='all';
  dlg.close();commit();toast('Task added');
};

/* ---------- weekly progress ---------- */
function renderProgress(){
  const m=new Date();m.setHours(0,0,0,0);m.setDate(m.getDate()-(m.getDay()+6)%7+wk*7);
  const days=[...Array(7)].map((_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d}),keys=days.map(key);
  const tk=keys.map(k=>S.tasks.filter(t=>t.done&&t.doneAt===k).length);
  const fm=keys.map(k=>(S.log[k]||{}).m||0),fs=keys.map(k=>(S.log[k]||{}).s||0);
  const sum=a=>a.reduce((x,y)=>x+y,0),f=d=>d.toLocaleDateString(undefined,{day:'numeric',month:'short'});
  $('#range').textContent=f(days[0])+' – '+f(days[6])+' '+days[6].getFullYear();
  $('#next').disabled=wk>=0;
  chart('#chT',tk,2,6,days,'tasks');chart('#chF',fm,30,120,days,'min');
  $('#tT').textContent=sum(tk);$('#tF').textContent=sum(fm)+' min';$('#tS').textContent=sum(fs);
}
function chart(sel,v,step,min,days,unit){
  const max=Math.max(min,Math.ceil(Math.max(...v)/step)*step);
  let h='';
  for(let y=0;y<=max;y+=step)h+=`<div class="g" style="bottom:${y/max*100}%"><b>${y}</b></div>`;
  h+='<div class="cols">'+v.map((x,i)=>`<div class="cl"><i style="height:${x/max*100}%" title="${x} ${unit}"></i><em>${days[i].toLocaleDateString(undefined,{weekday:'short'})}</em></div>`).join('')+'</div>';
  $(sel).innerHTML=h;
}
$('#prev').onclick=()=>{wk--;renderProgress()};
$('#next').onclick=()=>{if(wk<0){wk++;renderProgress()}};

/* ---------- focus timer: 25 min focus, then 5 min break ---------- */
let tm={mode:'focus',left:T.focus,end:0,run:false,cred:0},iv,tt;
const fmt=s=>pad(Math.floor(s/60))+':'+pad(s%60);
function addLog(m,s){const k=today(),l=S.log[k]||(S.log[k]={m:0,s:0});l.m+=m;l.s+=s;save();renderStats();renderProgress()}
function drawTimer(){
  const b=tm.mode==='break',idle=!tm.run&&tm.left===T[tm.mode];
  $('#clock').textContent=fmt(tm.left);
  $('#mode').textContent=b?'Break time':'Focus time';
  $('#arc').style.strokeDashoffset=578*(tm.left/T[tm.mode]);
  $('#start span').textContent=tm.run?(b?'On break…':'Focusing…'):idle?(b?'Start break':'Start focusing'):'Resume';
  $('#start').disabled=tm.run;$('#pause').disabled=!tm.run;
  $('#tip').textContent=b?'Break time! Stretch, drink some water and rest your eyes.':tm.run?'Stay with it — finish the full 25 minutes to earn a session.':'Complete 25 minutes of focused work to earn a session.';
  document.title=tm.run?fmt(tm.left)+' · '+(b?'Break':'Focus')+' · FocusDesk':'FocusDesk';
}
function start(){if(tm.run)return;tm.run=true;tm.end=Date.now()+tm.left*1000;iv=setInterval(tick,250);drawTimer()}
function stop(){tm.run=false;clearInterval(iv)}
function setMode(m){stop();tm={mode:m,left:T[m],end:0,run:false,cred:0}}
function tick(){
  tm.left=Math.max(0,Math.ceil((tm.end-Date.now())/1000));
  if(tm.mode==='focus'){const m=Math.floor((T.focus-tm.left)/60);if(m>tm.cred){addLog(m-tm.cred,0);tm.cred=m}}
  if(tm.left>0)return drawTimer();
  beep();
  if(tm.mode==='focus'){addLog(0,1);toast('Session complete! Enjoy a 5-minute break.');setMode('break');start()}
  else{toast('Break over — ready for another session?');setMode('focus')}
  drawTimer();
}
function beep(){try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.setValueAtTime(.15,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.8);o.start();o.stop(a.currentTime+.8)}catch(e){}}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3500)}
$('#start').onclick=start;
$('#pause').onclick=()=>{stop();drawTimer()};
$('#reset').onclick=()=>{setMode('focus');drawTimer()};
$('#brk').onclick=()=>{setMode('break');start()};
$('#qFocus').onclick=()=>{if(!tm.run&&tm.mode==='break')setMode('focus');location.hash='focus';start()};

/* ---------- navigation ---------- */
function route(){
  const h=location.hash.slice(1),v=VIEWS.includes(h)?h:'dashboard';
  $$('[data-v]').forEach(el=>el.hidden=!el.dataset.v.split(' ').includes(v));
  $$('nav a').forEach(a=>a.classList.toggle('on',a.hash==='#'+v));
  $('#grid').classList.toggle('solo',v!=='dashboard');
  scrollTo(0,0);
}
addEventListener('hashchange',route);

route();clock();renderAll();
setInterval(clock,1000);