import './style.css';
const images = import.meta.glob('./assets/*.webp', { eager: true, query: '?url', import: 'default' });
const asset = name => images[`./assets/${name}.webp`];
const definitions = [
  { id:'red', name:'Kırmızı bavul', image:'suitcase-red-v1', home:{x:12.2,y:74.1,w:25,h:23}, slot:{x:34,y:39.5,w:14,h:13} },
  { id:'yellow', name:'Sarı bavul', image:'suitcase-yellow-v1', home:{x:32,y:75.5,w:21,h:20}, slot:{x:50,y:40,w:14,h:12} },
  { id:'purple', name:'Mor bavul', image:'suitcase-purple-v1', home:{x:49,y:77,w:17,h:17}, slot:{x:64,y:40.5,w:12,h:11} },
  { id:'ball', name:'Plaj topu', image:'ball-v1', home:{x:65,y:79,w:18,h:10.125}, slot:{x:33,y:48.5,w:9,h:5.0625} },
  { id:'flamingo', name:'Flamingo', image:'flamingo-v1', home:{x:85,y:75.5,w:28,h:20}, slot:{x:56,y:48.2,w:22,h:4.2} },
];
document.querySelector('#app').innerHTML = `<main class="game loading" aria-label="Bagajı Sığdır">
<img class="scene" fetchpriority="high" decoding="async" src="${asset('scene-v2')}" alt="Sahilde bagajı açık turkuaz araba" draggable="false">
<header class="hud"><h1>HEPSİ SIĞAR MI?</h1><div class="progress"><div class="dots" aria-hidden="true">${'<i></i>'.repeat(5)}</div><strong id="count">0 / 5</strong></div></header>
<div class="target" aria-hidden="true"><div class="target-outline"></div><span>BURAYA BIRAK</span></div>
${definitions.map(d=>`<div class="item-shadow" data-shadow="${d.id}"></div><button class="item ${d.id==='red'?'suitcase':''}" data-item="${d.id}" aria-label="${d.name}. Bagaja sürükle veya Enter ile yerleştir." disabled><img src="${asset(d.image)}" alt="" draggable="false">${d.id==='flamingo'?`<img class="flat-sprite" src="${asset('flamingo-flat-v1')}" alt="" draggable="false">`:''}</button>`).join('')}
<button class="valve" aria-label="Flamingonun havasını indir" disabled><span aria-hidden="true">◉</span> HAVASINI İNDİR</button>
<div class="sparkles" aria-hidden="true"></div><div class="footer"><p class="instruction" role="status" aria-live="polite">Görseller yükleniyor…</p><button class="replay" hidden>Yeniden dene ↻</button><small class="stage-label">EŞYALARI BAGAJDA TOPLA</small></div>
<div class="load-error" hidden>Görseller yüklenemedi.<button onclick="location.reload()">Yeniden yükle</button></div></main>`;
const game=document.querySelector('.game'), target=document.querySelector('.target'), instruction=document.querySelector('.instruction'), replay=document.querySelector('.replay'), valve=document.querySelector('.valve');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const items=definitions.map(d=>({...d,position:{...d.home},state:'loading',el:document.querySelector(`[data-item="${d.id}"]`),shadow:document.querySelector(`[data-shadow="${d.id}"]`)}));
let active=null, pointer=null, offset={}, generation=0, deflated=false, busy=false;
function paint(item){const p=item.position;Object.assign(item.el.style,{left:`${p.x}%`,top:`${p.y}%`,width:`${p.w}%`,height:`${p.h}%`});}
function point(e){const r=game.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};}
function inside(p){return p.x>=26&&p.x<=74&&p.y>=32&&p.y<=51;}
function home(item){return item.id==='flamingo'&&deflated?{...item.home,y:80,w:25,h:9}:item.home;}
function frame(p,transform='translate(-50%,-50%)'){return{left:`${p.x}%`,top:`${p.y}%`,width:`${p.w}%`,height:`${p.h}%`,transform};}
function release(item){const id=pointer;pointer=null;if(id!==null&&item.el.hasPointerCapture(id))item.el.releasePointerCapture(id);}
function clean(item){release(item);item.el.classList.remove('held');game.classList.remove('dragging','over-target','too-large');active=null;}
function animate(item,frames,duration){const animation=item.el.animate(frames,{duration:reduced.matches?0:duration,easing:'cubic-bezier(.22,.8,.25,1)'});item.animation=animation;return animation.finished;}
function progress(){const n=items.filter(i=>i.state==='placed').length;document.querySelector('#count').textContent=`${n} / 5`;document.querySelectorAll('.dots i').forEach((dot,k)=>dot.classList.toggle('filled',k<n));return n;}
function sparkle(item,complete=false){const layer=document.querySelector('.sparkles');layer.replaceChildren();layer.style.left=`${item.slot.x}%`;layer.style.top=`${item.slot.y}%`;if(reduced.matches)return;for(let i=0;i<(complete?28:12);i++){const star=document.createElement('i'),angle=i/12*Math.PI*2;star.style.setProperty('--dx',`${Math.cos(angle)*(complete?130:65)}px`);star.style.setProperty('--dy',`${Math.sin(angle)*(complete?130:65)}px`);star.style.setProperty('--delay',`${i%3*30}ms`);layer.append(star);}}
async function returnHome(item,message='Eşyayı açık bagajın içine bırak'){
 if(item.state!=='dragging')return;
 const token=generation,start={...item.position};item.state='returning';busy=true;clean(item);item.position={...home(item)};paint(item);
 try{await animate(item,[frame(start,'translate(-50%,-50%) scale(1.08) rotate(-3deg)'),frame(item.position)],330);}catch{return;}
 if(token!==generation)return;item.state='idle';busy=false;item.shadow.classList.remove('away');instruction.textContent=message;valve.disabled=deflated;
}
async function place(item){
 if(busy||!['idle','dragging'].includes(item.state))return;
 if(item.id==='flamingo'&&!deflated){
  instruction.textContent='Flamingo çok büyük! Önce havasını indir';valve.classList.add('attention');
  if(item.state==='dragging')returnHome(item,'Flamingo çok büyük! Önce havasını indir');
  return;
 }
 const token=generation,start={...item.position};busy=true;item.state='placing';clean(item);valve.disabled=true;item.shadow.classList.add('away');item.position={...item.slot};paint(item);item.el.classList.add('in-trunk');
 const end=frame(item.slot);try{await animate(item,[frame(start,'translate(-50%,-50%) scale(1.08) rotate(-3deg)'),{...end,transform:'translate(-50%,-50%) scale(1.06,.94)',offset:.68},{...end,transform:'translate(-50%,-54%) scale(.98,1.04)',offset:.84},end],580);}catch{return;}
 if(token!==generation)return;item.state='placed';item.el.disabled=true;item.el.setAttribute('aria-label',`${item.name} bagaja yerleşti`);busy=false;valve.disabled=deflated;replay.hidden=false;
 const n=progress();instruction.textContent=n===5?'Hepsi sığdı! Tatile hazırız.':n===4&&!deflated?'Bir tek flamingo kaldı. Havasını indir!':'Tam yerine oturdu!';
 if(n===4&&!deflated)valve.classList.add('attention');
 if(n===5){game.classList.add('complete');document.querySelector('h1').textContent='HEPSİ SIĞDI!';document.querySelector('.stage-label').textContent='BAGAJ HAZIR · İYİ TATİLLER';}
 sparkle(item,n===5);
}
function cancelDrag(){if(active?.state==='dragging')returnHome(active);}
for(const item of items){
 paint(item);Object.assign(item.shadow.style,{left:`${item.home.x}%`,top:`${item.home.y+item.home.h*.43}%`,width:`${item.home.w*.8}%`});
 item.el.addEventListener('pointerdown',e=>{if(busy||active||item.state!=='idle'||!e.isPrimary||e.button!==0)return;e.preventDefault();active=item;pointer=e.pointerId;item.state='dragging';const p=point(e);offset={x:p.x-item.position.x,y:p.y-item.position.y};item.el.setPointerCapture(pointer);item.el.classList.add('held');item.shadow.classList.add('away');game.classList.add('dragging','started');valve.disabled=true;Object.assign(target.style,{left:`${item.slot.x-item.slot.w/2}%`,top:`${item.slot.y-item.slot.h/2}%`,width:`${item.slot.w}%`,height:`${item.slot.h}%`});target.querySelector('span').textContent=item.id==='flamingo'&&!deflated?'ÖNCE HAVASINI İNDİR':'BURAYA';instruction.textContent=item.id==='flamingo'&&!deflated?'Flamingo çok büyük! Önce havasını indir':'Bagajın içine bırak';});
 item.el.addEventListener('pointermove',e=>{if(active!==item||e.pointerId!==pointer||item.state!=='dragging')return;const p=point(e);item.position.x=Math.max(6,Math.min(94,p.x-offset.x));item.position.y=Math.max(16,Math.min(85,p.y-offset.y));paint(item);game.classList.toggle('over-target',inside(item.position));game.classList.toggle('too-large',item.id==='flamingo'&&!deflated);});
 item.el.addEventListener('pointerup',e=>{if(active!==item||e.pointerId!==pointer)return;if(inside(item.position))place(item);else returnHome(item);});
 item.el.addEventListener('pointercancel',()=>{if(active===item)cancelDrag();});
 item.el.addEventListener('lostpointercapture',()=>{if(active===item&&item.state==='dragging'&&pointer!==null)cancelDrag();});
 item.el.addEventListener('keydown',e=>{if(e.key==='Escape')cancelDrag();if(['Enter',' '].includes(e.key)){e.preventDefault();if(!active)place(item);}});
}
valve.addEventListener('click',async()=>{
 const item=items.find(i=>i.id==='flamingo');if(deflated||busy||active||item.state!=='idle')return;
 const token=generation;busy=true;valve.disabled=true;valve.classList.remove('attention');item.state='deflating';instruction.textContent='Pşşş… şimdi sığacak!';item.el.classList.add('deflating');
 const old={...item.position};deflated=true;item.position={...home(item)};paint(item);
 try{await animate(item,[frame(old),{...frame({...old,y:old.y+1}),transform:'translate(-50%,-50%) rotate(-7deg)',offset:.25},{...frame({...old,w:old.w*.9,h:old.h*.7,y:old.y+2}),transform:'translate(-50%,-50%) rotate(6deg)',offset:.5},frame(item.position)],950);}catch{return;}
 if(token!==generation)return;item.el.classList.remove('deflating');item.el.classList.add('deflated');item.state='idle';busy=false;valve.hidden=true;instruction.textContent='Şimdi flamingoyu bagaja sürükle';
});
window.addEventListener('blur',cancelDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelDrag();});
replay.addEventListener('click',()=>{
 generation++;for(const item of items){item.animation?.cancel();release(item);item.state='idle';item.position={...item.home};item.el.classList.remove('held','in-trunk','deflated','deflating');item.el.disabled=false;item.el.setAttribute('aria-label',`${item.name}. Bagaja sürükle veya Enter ile yerleştir.`);item.shadow.classList.remove('away');paint(item);}
 active=null;pointer=null;busy=false;deflated=false;game.classList.remove('dragging','over-target','too-large','complete','started');valve.hidden=false;valve.disabled=false;valve.classList.remove('attention');replay.hidden=true;document.querySelector('h1').textContent='HEPSİ SIĞAR MI?';document.querySelector('.stage-label').textContent='EŞYALARI BAGAJDA TOPLA';instruction.textContent='Eşyaları bagaja sürükle';document.querySelector('.sparkles').replaceChildren();progress();
});
Promise.all([...game.querySelectorAll('img')].map(i=>i.decode())).then(()=>{game.classList.remove('loading');items.forEach(i=>{i.state='idle';i.el.disabled=false;});valve.disabled=false;instruction.textContent='Eşyaları bagaja sürükle';}).catch(()=>{document.querySelector('.load-error').hidden=false;});
