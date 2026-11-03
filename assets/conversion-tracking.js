(()=> {
  const API="https://tpass-results-api.onrender.com/api/conversion-events";
  const SESSION_KEY="gary_conversion_session_v1";
  function sessionId(){
    let id=localStorage.getItem(SESSION_KEY);
    if(!id){
      id=(crypto&&crypto.randomUUID)?crypto.randomUUID():"sess-"+Date.now()+"-"+Math.random().toString(36).slice(2,10);
      localStorage.setItem(SESSION_KEY,id);
    }
    return id;
  }
  function track(el){
    const payload={
      event_type:el.dataset.eventType||"cta_click",
      product_line:el.dataset.productLine||"unknown",
      source_page:location.href,
      source_label:(el.textContent||"").trim().slice(0,160),
      destination:el.href||"",
      referrer:document.referrer||"",
      session_id:sessionId(),
      metadata:{
        path:location.pathname,
        title:document.title,
        viewport:innerWidth+"x"+innerHeight,
        language:navigator.language||"",
        user_agent:(navigator.userAgent||"").slice(0,300)
      }
    };
    const body=JSON.stringify(payload);
    if(navigator.sendBeacon){
      try{
        const ok=navigator.sendBeacon(API,new Blob([body],{type:"application/json"}));
        if(ok)return;
      }catch(e){}
    }
    fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>{});
  }
  function bind(){
    document.querySelectorAll("[data-track-conversion]").forEach(el=>{
      if(el.dataset.trackingBound==="1")return;
      el.dataset.trackingBound="1";
      el.addEventListener("click",()=>track(el),{capture:true});
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);
  else bind();
  window.GaryConversionTracking={track,bind};
})();