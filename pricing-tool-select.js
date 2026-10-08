(function(){
  var openOne=null;
  function enhance(sel){
    if(!sel||sel.dataset.pqsOn) return; sel.dataset.pqsOn='1';
    var host=sel.closest('.pq-inp')||sel.parentNode; host.classList.add('pqs-host');
    var trig=document.createElement('button'); trig.type='button'; trig.className='pqs-trigger';
    var val=document.createElement('span'); val.className='pqs-val';
    var chev=document.createElement('span'); chev.className='pqs-chev';
    trig.appendChild(val); trig.appendChild(chev);
    sel.classList.add('pqs-native'); host.appendChild(trig);
    var panel=document.createElement('div'); panel.className='pqs-panel'; panel.style.display='none';
    var sb=document.createElement('div'); sb.className='pqs-search';
    var search=document.createElement('input'); search.type='text'; search.placeholder='Search\u2026'; search.setAttribute('autocomplete','off'); search.setAttribute('inputmode','search');
    sb.appendChild(search);
    var list=document.createElement('div'); list.className='pqs-list';
    panel.appendChild(sb); panel.appendChild(list); document.body.appendChild(panel);

    function sync(){ var o=sel.options[sel.selectedIndex]; val.textContent=o?o.textContent:''; val.classList.toggle('is-ph',!sel.value); trig.disabled=sel.disabled; }
    function build(){
      var q=(search.value||'').trim().toLowerCase(); list.innerHTML=''; var any=false;
      Array.prototype.forEach.call(sel.options,function(o){
        if(o.value==='') return;
        if(q && o.textContent.toLowerCase().indexOf(q)===-1) return;
        any=true;
        var it=document.createElement('div'); it.className='pqs-opt'+(o.value===sel.value?' active':''); it.textContent=o.textContent;
        it.addEventListener('mousedown',function(e){ e.preventDefault(); sel.value=o.value; sel.dispatchEvent(new Event('change',{bubbles:true})); sync(); close(); });
        list.appendChild(it);
      });
      if(!any){ var n=document.createElement('div'); n.className='pqs-none'; n.textContent='No matches'; list.appendChild(n); }
    }
    function place(){
      var r=trig.getBoundingClientRect(); panel.style.width=r.width+'px'; panel.style.left=r.left+'px';
      var ph=panel.offsetHeight, below=window.innerHeight-r.bottom;
      if(below<ph+10 && r.top>below){ panel.style.top=Math.max(8,r.top-ph-6)+'px'; } else { panel.style.top=(r.bottom+6)+'px'; }
    }
    function open(){ if(sel.disabled) return; if(openOne&&openOne!==close) openOne(); panel.style.display='block'; host.classList.add('pqs-open'); search.value=''; build(); place(); setTimeout(function(){try{search.focus();}catch(e){}} ,10); openOne=close; window.addEventListener('scroll',place,true); window.addEventListener('resize',place); }
    function close(){ panel.style.display='none'; host.classList.remove('pqs-open'); if(openOne===close) openOne=null; window.removeEventListener('scroll',place,true); window.removeEventListener('resize',place); }
    trig.addEventListener('click',function(e){ e.stopPropagation(); host.classList.contains('pqs-open')?close():open(); });
    search.addEventListener('input',function(){ build(); place(); });
    document.addEventListener('click',function(e){ if(host.classList.contains('pqs-open')&&!panel.contains(e.target)&&!host.contains(e.target)) close(); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&host.classList.contains('pqs-open')) close(); });
    new MutationObserver(function(){ sync(); if(host.classList.contains('pqs-open')){ build(); place(); } }).observe(sel,{childList:true});
    sel.addEventListener('change',sync);
    sync();
  }
  function init(){ ['pq-year','pq-make','pq-model'].forEach(function(id){ var s=document.getElementById(id); if(s) enhance(s); }); }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
