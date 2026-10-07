const palette=document.querySelector('#palette'),key='modern-values-highlights-v2';let pendingRange=null,currentFilter='language';const colours=['cause','discuss','language'];

function save(){
  const data=[...document.querySelectorAll('mark.hl')].map(m=>({
    id:m.id,
    types:colours.filter(c=>m.classList.contains('hl-'+c)),
    text:m.textContent
  }));
  localStorage.setItem(key,JSON.stringify(data));renderList()
}
function applyClasses(mark,types){
  mark.className='hl '+types.map(t=>'hl-'+t).join(' ');
  mark.style.background='';
  // Multiple categories need a visibly multi-colour highlight, not just multiple CSS classes
  // competing for the same background property.
  const css={cause:'var(--yellow)',discuss:'var(--blue)',language:'var(--mint)'};
  if(types.length===1){mark.style.background=css[types[0]]}
  else if(types.length>1){
    const stops=types.map((t,i)=>{
      const a=Math.round(i*100/types.length), b=Math.round((i+1)*100/types.length);
      return css[t]+' '+a+'%, '+css[t]+' '+b+'%';
    }).join(', ');
    mark.style.background='linear-gradient(180deg, '+stops+')';
  }
}
function wrap(range,type,id='hl-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),doSave=true){
  if(range.collapsed||!range.toString().trim())return;
  const startMark=range.startContainer.parentElement?.closest('mark.hl');
  const endMark=range.endContainer.parentElement?.closest('mark.hl');
  if(startMark&&startMark===endMark&&range.toString().trim()===startMark.textContent.trim()){
    const types=colours.filter(c=>startMark.classList.contains('hl-'+c));
    if(!types.includes(type))types.push(type);
    applyClasses(startMark,types);if(doSave)save();return
  }
  const mark=document.createElement('mark');applyClasses(mark,[type]);mark.id=id;
  try{range.surroundContents(mark)}catch(e){return}
  if(doSave)save()
}
function restore(){
  let saved=[];try{saved=JSON.parse(localStorage.getItem(key)||localStorage.getItem('modern-values-highlights-v1')||'[]')}catch(e){}
  saved.forEach(item=>{for(const root of document.querySelectorAll('.selectable')){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while(n=walker.nextNode()){const i=n.nodeValue.indexOf(item.text);if(i>=0){
      const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+item.text.length);
      const types=item.types||[item.type];wrap(r,types[0],item.id,false);
      const m=document.getElementById(item.id);if(m)applyClasses(m,types);return
    }}
  }});save()
}
document.addEventListener('selectionchange',()=>{
  const s=window.getSelection();if(!s||s.isCollapsed)return;const r=s.getRangeAt(0);
  if(r.toString().trim()&&r.commonAncestorContainer.parentElement?.closest('.selectable')){pendingRange=r.cloneRange();palette.hidden=false}
});
palette.addEventListener('pointerdown',e=>e.preventDefault());
palette.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const type=b.dataset.color;
  if(type==='remove'){
    const s=window.getSelection(),m=s?.anchorNode?.parentElement?.closest('mark.hl');
    if(m){m.replaceWith(...m.childNodes);save()}
  }else if(pendingRange)wrap(pendingRange,type);
  window.getSelection()?.removeAllRanges();pendingRange=null;palette.hidden=true
});
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;renderList()
});
function renderList(){
  const box=document.querySelector('#highlight-list'),arr=[...document.querySelectorAll('mark.hl')].filter(m=>m.classList.contains('hl-'+currentFilter));
  box.innerHTML=arr.length?'':'<div class="empty">Nothing here yet - highlight something in the text.</div>';
  arr.forEach(m=>{const b=document.createElement('button');b.className='saved '+currentFilter;b.textContent='“'+m.textContent+'”';b.onclick=()=>m.scrollIntoView({behavior:'smooth',block:'center'});box.appendChild(b)})
}
document.querySelector('#clear-all').onclick=()=>{if(confirm('Clear all highlights on this device?')){localStorage.removeItem(key);localStorage.removeItem('modern-values-highlights-v1');location.reload()}};
restore();