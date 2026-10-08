/* Google Places autocomplete for the Pickup/Delivery fields */
function pqInitPlaces(){
  if(!(window.google && google.maps && google.maps.places)) return;
  ['pq-pickup','pq-delivery'].forEach(function(id){
    var el=document.getElementById(id); if(!el) return;
    try{
      var ac=new google.maps.places.Autocomplete(el,{componentRestrictions:{country:'us'},fields:['address_components','formatted_address'],types:['postal_code']});
      ac.addListener('place_changed',function(){
        var p=ac.getPlace(); if(!p||!p.address_components) return;
        var zip='',city='',state='';
        p.address_components.forEach(function(c){
          if(c.types.indexOf('postal_code')>-1) zip=c.long_name;
          if(c.types.indexOf('locality')>-1) city=c.long_name;
          if(!city && c.types.indexOf('postal_town')>-1) city=c.long_name;
          if(!city && c.types.indexOf('sublocality')>-1) city=c.long_name;
          if(c.types.indexOf('administrative_area_level_1')>-1) state=c.short_name;
        });
        el.dataset.zip=zip; el.dataset.city=city; el.dataset.state=state;
        el.value = zip || el.value.replace(/\D/g,'').slice(0,5);
        var hint=document.getElementById(id+'-hint'); if(hint) hint.textContent = city ? (city+(state?', '+state:'')) : '';
        el.classList.remove('err'); var er=document.getElementById(id+'-err'); if(er) er.style.display='none';
      });
      el.addEventListener('input',function(){el.dataset.zip='';el.dataset.city='';el.dataset.state=''; var hint=document.getElementById(id+'-hint'); if(hint) hint.textContent='';});
    }catch(e){}
  });
}
