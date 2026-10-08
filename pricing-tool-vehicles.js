/* BeRocker Vehicle Database API - cascading Year -> Make -> Model pickers */
(function(){
  var API='https://app.berocker.com/api/v1/vehicles';
  var KEY='bvk_vNxhnCfzk1XKqztmtfnf1exrm0aZmormR9smaNJdGoniaaQg';
  var yearSel=document.getElementById('pq-year'), makeSel=document.getElementById('pq-make'), modelSel=document.getElementById('pq-model');
  if(!yearSel||!makeSel||!modelSel) return;
  function get(path, params){
    var url=new URL(API+path);
    if(params) Object.keys(params).forEach(function(k){url.searchParams.set(k,params[k]);});
    return fetch(url.toString(),{headers:{'X-Api-Key':KEY}}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(j){return j.data||[];});
  }
  function fillSel(sel, items, getLabel, getVal, placeholder, getType){
    sel.innerHTML='';
    var o=document.createElement('option'); o.value=''; o.textContent=placeholder; sel.appendChild(o);
    items.forEach(function(it){var op=document.createElement('option'); op.value=getVal(it); op.textContent=getLabel(it); if(getType)op.setAttribute('data-type',getType(it)||''); sel.appendChild(op);});
    sel.disabled=items.length===0;
  }
  get('/years').then(function(years){ fillSel(yearSel, years, function(y){return y;}, function(y){return y;}, 'Select year…'); })
    .catch(function(){ yearSel.innerHTML='<option value="">Select year…</option>'; });
  yearSel.addEventListener('change', function(){
    makeSel.innerHTML='<option value="">Select a year first</option>'; makeSel.disabled=true;
    modelSel.innerHTML='<option value="">Select a make first</option>'; modelSel.disabled=true; modelSel.dataset.vtype='';
    if(!yearSel.value) return;
    makeSel.innerHTML='<option value="">Loading…</option>'; makeSel.disabled=true;
    get('/makes',{year:yearSel.value}).then(function(makes){ fillSel(makeSel, makes, function(m){return m.name;}, function(m){return m.name;}, 'Select make…'); })
      .catch(function(){ makeSel.innerHTML='<option value="">Could not load makes</option>'; makeSel.disabled=false; });
  });
  makeSel.addEventListener('change', function(){
    modelSel.innerHTML='<option value="">Select a make first</option>'; modelSel.disabled=true; modelSel.dataset.vtype='';
    if(!makeSel.value) return;
    modelSel.innerHTML='<option value="">Loading…</option>'; modelSel.disabled=true;
    get('/models',{year:yearSel.value, make:makeSel.value}).then(function(models){ fillSel(modelSel, models, function(m){return m.name;}, function(m){return m.name;}, 'Select model…', function(m){return m.type;}); })
      .catch(function(){ modelSel.innerHTML='<option value="">Could not load models</option>'; modelSel.disabled=false; });
  });
  modelSel.addEventListener('change', function(){
    var op=modelSel.options[modelSel.selectedIndex];
    modelSel.dataset.vtype = op ? (op.getAttribute('data-type')||'') : '';
    modelSel.classList.remove('err');
  });
})();
