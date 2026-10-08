/* ============================================================
   SHIP GUY \u2014 custom quote tool wired to the BeRocker Lead Source API
   Docs: https://help.berocker.com/integrations/pickup-windows-api

   >>> STEP 1: create a lead source in BeRocker
       (Settings -> Lead Management -> Lead sources -> + Add new source,
        set Per Lead Price = 0), then copy its "Lead save URL".
   >>> STEP 2: paste that URL below (it ends with /save). <<<
   Until you do, the tool shows a sample estimate so you can preview it.
   ============================================================ */
(function(){
  var LEAD_SAVE_URL = '/api/quote/save';   // proxied by functions/api/quote/[[path]].js — the Lead Source key lives there, never in the page
  var API_READY = LEAD_SAVE_URL.indexOf('YOUR_LEAD_SOURCE_KEY') === -1;

  var form=document.getElementById('pqForm'); if(!form) return;
  var steps=[].slice.call(document.querySelectorAll('#pquote .pq-step'));
  var panels=[].slice.call(document.querySelectorAll('#pquote .pq-panel'));
  var stepsBar=document.querySelector('#pquote .pq-progress');
  var cur=0;
  function show(i){panels.forEach(function(p,x){p.classList.toggle('is-current',x===i);});steps.forEach(function(sp,x){sp.classList.toggle('is-active',x===i);sp.classList.toggle('is-done',x<i);});cur=i;var names=['Route','Vehicle','Contact'];var fill=document.getElementById('pqProgressFill');if(fill)fill.style.width=((i+1)/panels.length*100)+'%';var nm=document.getElementById('pqStepName');if(nm)nm.textContent=names[i]||'';}
  function zipOk(inp){var er=document.getElementById(inp.id+'-err'); var v=inp.value.replace(/\D/g,'').slice(0,5); if(v!==inp.value) inp.value=v; if(/^\d{5}$/.test(v)){inp.classList.remove('err'); if(er)er.style.display='none'; return true;} inp.classList.add('err'); if(er)er.style.display='block'; return false;}
  function validate(i){var ok=true;panels[i].querySelectorAll('input[required],select[required]').forEach(function(inp){if(inp.disabled)return; if(inp.type==='checkbox'){if(!consentOk(inp))ok=false;return;} if(inp.dataset.zipfield){if(!zipOk(inp))ok=false;return;} if(!inp.value.trim()){inp.classList.add('err');ok=false;}else inp.classList.remove('err');});var em=panels[i].querySelector('input[type=email]');if(em&&em.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)){em.classList.add('err');ok=false;}return ok;}
  function consentOk(cb){var wrap=cb.closest('.pq-consent'),msg=document.getElementById('pq-consent-err');if(cb.checked){if(wrap)wrap.classList.remove('err');if(msg)msg.style.display='none';return true;}if(wrap)wrap.classList.add('err');if(msg)msg.style.display='block';return false;}
  function validateAll(){var ok=true;form.querySelectorAll('input[required],select[required]').forEach(function(el){if(el.disabled)return;if(el.type==='checkbox'){if(!consentOk(el))ok=false;return;} if(el.dataset.zipfield){if(!zipOk(el))ok=false;return;} if(!el.value.trim()){el.classList.add('err');ok=false;}else el.classList.remove('err');});var em=document.getElementById('pq-email');if(em&&em.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)){em.classList.add('err');ok=false;}return ok;}
  form.querySelectorAll('[data-next]').forEach(function(b){b.addEventListener('click',function(){if(validate(cur))show(cur+1);});});
  form.querySelectorAll('[data-back]').forEach(function(b){b.addEventListener('click',function(){show(cur-1);});});
  var cbx=document.getElementById('pq-consent'); if(cbx){cbx.addEventListener('change',function(){consentOk(cbx);});}
  form.querySelectorAll('input[data-zipfield]').forEach(function(z){z.addEventListener('input',function(){var v=z.value.replace(/\D/g,'').slice(0,5); if(v!==z.value) z.value=v; if(/^\d{5}$/.test(v)){z.classList.remove('err'); var er=document.getElementById(z.id+'-err'); if(er)er.style.display='none';}});});
  form.querySelectorAll('input,select').forEach(function(inp){inp.addEventListener('input',function(){inp.classList.remove('err');});inp.addEventListener('change',function(){inp.classList.remove('err');});});

  /* On load: ask BeRocker which pickup question to show */
  if(API_READY){
    fetch(LEAD_SAVE_URL.replace('/save','/quote-config'))
      .then(function(r){return r.ok?r.json():null;})
      .then(function(cfg){
        if(!cfg) return;
        var tf=document.getElementById('pq-timeframe'), tfWrap=document.getElementById('pq-pickup-field'), dateWrap=document.getElementById('pq-date-field'), dateInp=document.getElementById('pq-date');
        if(cfg.pickupTimeframes && cfg.pickupTimeframes.length){
          tf.innerHTML=''; cfg.pickupTimeframes.forEach(function(t){var o=document.createElement('option');o.value=t.value;o.textContent=t.label;if(t.isDefault)o.selected=true;tf.appendChild(o);});
        } else if(cfg.pickupWindow){
          tfWrap.style.display='none'; dateWrap.style.display=''; if(cfg.pickupWindow.earliestDate) dateInp.min=cfg.pickupWindow.earliestDate;
        } else {
          tfWrap.style.display='none'; dateWrap.style.display='';
        }
      }).catch(function(){});
  }

  function mapType(v){return {'Sedan':'Car','SUV / Crossover':'SUV','Pickup Truck':'Pickup','Van / Minivan':'Van','Motorcycle':'Motorcycle','Other':'Other'}[v]||'Car';}

  function submitLead(data){
    if(!API_READY) return demoQuote(data);
    var payload={
      first_name: data.firstname||undefined, last_name: data.lastname||undefined, phone: data.phone, email: data.email||undefined,
      transport_type: (data.transport||'Open').toLowerCase(),
      secondary_id: 'BIGBEAR-'+Date.now(),
      customer_comments: 'SMS consent: '+(data.sms_consent?'YES (opted in via web form)':'not given')+'.',
      vehicles:[{vehicle_model_year: parseInt(data.year,10)||undefined, vehicle_make: data.make||undefined, vehicle_model: data.model||undefined, vehicle_type: (function(){var m=document.getElementById('pq-model');return m&&m.dataset&&m.dataset.vtype?m.dataset.vtype:undefined;})(), vehicle_inop: data.operable==='No'}]
    };
    function setLoc(prefix, raw, elId){
      var el=document.getElementById(elId), d=el&&el.dataset?el.dataset:{}, zip=d.zip||'', city=d.city||'', st=d.state||'';
      raw=(raw||'').trim();
      if(zip){payload[prefix+'_postal_code']=zip; if(city)payload[prefix+'_city']=city; if(st)payload[prefix+'_state']=st;}
      else if(/^\d{5}$/.test(raw)){payload[prefix+'_postal_code']=raw;}
      else {payload[prefix+'_city']=city||raw; if(st)payload[prefix+'_state']=st;}
    }
    setLoc('origin', data.pickup, 'pq-pickup');
    setLoc('destination', data.delivery, 'pq-delivery');
    if(data.timeframe) payload.pickup_timeframe=data.timeframe; else if(data.date) payload.ship_date=data.date;
    return fetch(LEAD_SAVE_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,body:j};});})
      .then(function(res){
        if(!res.ok || !res.body || !res.body.id){var m=res.body&&res.body.errors?String(Object.values(res.body.errors)[0]):'We could not process that. Please check your details.';throw new Error(m);}
        var lead=res.body;
        var statusUrl=LEAD_SAVE_URL.replace('/save','/'+lead.id+'/booking-status');
        setLoading('Getting your best price\u2026');
        return pollStatus(statusUrl, lead.bookingLink, 0);
      });
  }
  function pollStatus(url, bookingLink, startTime, tries){
    startTime = startTime || Date.now(); tries = tries || 0;
    if(Date.now() - startTime > 20000) return Promise.resolve({bookingLink:bookingLink, price:null, manual:false, timedOut:true});
    return new Promise(function(res){setTimeout(res, tries===0?400:1000);}).then(function(){
      return fetch(url).then(function(r){return r.json();}).then(function(s){
        var link=s.bookingLink||bookingLink;
        if(s.priceReady) return {bookingLink:link, price:s.price, manual:false};
        if(s.manualReview) return {bookingLink:link, price:null, manual:true};
        if(s.priceFailed) return {bookingLink:link, price:null, manual:false, failed:true};
        return pollStatus(url, link, startTime, tries+1);
      }).catch(function(){ return pollStatus(url, bookingLink, startTime, tries+1); });
    });
  }
  function demoQuote(data){
    return new Promise(function(res){setTimeout(function(){
      var base={'Sedan':600,'SUV / Crossover':720,'Pickup Truck':790,'Van / Minivan':820,'Motorcycle':480,'Other':720}[data.vtype]||700;
      if(data.transport==='Enclosed') base=Math.round(base*1.5); if(data.operable==='No') base+=150;
      res({price:base, bookingLink:null, manual:false, demo:true});
    },900);});
  }

  var loadingText=document.getElementById('pqLoadingText'), loading=document.getElementById('pqLoading'), quote=document.getElementById('pqQuote'), result=document.getElementById('pqResult'), errBox=document.getElementById('pqError');
  function setLoading(t){if(loadingText)loadingText.textContent=t;}
  function render(res, data){
    if(res && res.redirecting){ return; }
    loading.style.display='none';
    var priceEl=document.getElementById('pqPrice'), eyebrow=document.getElementById('pqEyebrow'), note=document.getElementById('pqNote'), book=document.getElementById('pqBookBtn');
    if(res.manual){
      eyebrow.textContent='Quote request received'; priceEl.textContent='We\u2019ll be in touch'; priceEl.style.fontSize='23px';
      note.textContent='Your vehicle needs a custom quote \u2014 a specialist will contact you shortly.';
    } else if(res.price){
      eyebrow.textContent = res.demo ? 'Your estimated price' : 'Your instant quote';
      priceEl.textContent='$'+Number(res.price).toLocaleString(); priceEl.style.fontSize='38px';
      note.textContent = res.demo ? 'Sample estimate for preview. Add your BeRocker Lead save URL for live pricing.' : 'All-in price \u2014 no hidden fees. Continue to lock in your booking.';
    } else if(res.failed){
      eyebrow.textContent='Almost there'; priceEl.textContent='Call for your price'; priceEl.style.fontSize='24px';
      note.textContent='We could not price this online right now \u2014 call us and we will quote it for you.';
    } else if(res.timedOut){
      eyebrow.textContent='Your quote is ready'; priceEl.textContent='See your price'; priceEl.style.fontSize='25px';
      note.textContent='Tap Continue to Booking to see your exact price and reserve your pickup.';
    } else {
      eyebrow.textContent='Almost there'; priceEl.textContent='Get your quote'; priceEl.style.fontSize='23px';
      note.textContent='Continue to see your price and book, or call us now.';
    }
    if(res.liveError){eyebrow.textContent='Estimated price';note.textContent='⚠ Live pricing did not respond: '+res.liveError+'. Showing a sample — call for your exact quote.';}
    var locLabel=function(elId,raw){var e=document.getElementById(elId),d=e&&e.dataset?e.dataset:{}; return d.city?(d.city+(d.state?', '+d.state:'')+' '+(raw||'')):(raw||'');}; document.getElementById('pqRoute').textContent=locLabel('pq-pickup',data.pickup)+' \u2192 '+locLabel('pq-delivery',data.delivery)+'  \u00b7  '+(data.transport||'Open')+' transport';
    if(res.bookingLink){book.href=res.bookingLink; book.style.display='';}
    quote.classList.add('show');
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!validate(cur)){var fe=panels[cur].querySelector('.err');if(fe&&fe.scrollIntoView)fe.scrollIntoView({behavior:'smooth',block:'center'});return;}
    var data={}; new FormData(form).forEach(function(v,k){data[k]=v;});
    if(errBox) errBox.style.display='none';
    form.style.display='none'; if(stepsBar) stepsBar.style.display='none';
    result.classList.add('show'); loading.style.display='block'; quote.classList.remove('show'); setLoading('Getting your quote\u2026');
    submitLead(data).then(function(res){
      if(res && res.bookingLink && !res.demo && (res.price || res.timedOut)){ setLoading('Taking you to your booking page...'); window.location.href=res.bookingLink; return; }
      render(res,data);
    }).catch(function(err){
      // fall back to a sample estimate so the visitor still sees something, and surface the reason
      demoQuote(data).then(function(d){ d.demo=true; d.liveError=(err&&err.message)?err.message:'no response from the pricing service (possible CORS block)'; render(d,data);
        if(errBox){errBox.textContent=(err&&err.message?err.message+' ':'')+'(showing a sample estimate)'; }
      });
    });
  });
  var again=document.getElementById('pqAgain');
  if(again) again.addEventListener('click',function(){result.classList.remove('show'); if(stepsBar)stepsBar.style.display=''; form.style.display=''; show(0);});
})();
