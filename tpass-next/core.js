const TPASS_ENDPOINT="https://formsubmit.co/43c5627bc898e872509ffd1b6aa8d728";

function uid(prefix="TPASS"){
  return prefix+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
}
function saveLocal(key,data){localStorage.setItem(key,JSON.stringify(data))}
function loadLocal(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function savePendingDelivery(payload){
  const enriched={...payload,_saved_at:new Date().toISOString()};
  localStorage.setItem("tpass_next_pending_delivery",JSON.stringify(enriched));
  return enriched;
}
function loadPendingDelivery(){
  try{return JSON.parse(localStorage.getItem("tpass_next_pending_delivery")||"null")}catch{return null}
}
function clearPendingDelivery(){
  localStorage.removeItem("tpass_next_pending_delivery");
}
function saveTokenizedDelivery(payload){
  const token="DLV-"+Date.now()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
  const enriched={...payload,_saved_at:new Date().toISOString(),_delivery_token:token};
  localStorage.setItem("tpass_next_delivery_"+token,JSON.stringify(enriched));
  setDeliveryStatus(token,"payload_created");
  return token;
}
function loadTokenizedDelivery(token){
  if(!token)return null;
  try{return JSON.parse(localStorage.getItem("tpass_next_delivery_"+token)||"null")}catch{return null}
}
function markTokenizedDeliverySubmitted(token){
  if(!token)return;
  const key="tpass_next_delivery_"+token;
  try{
    const d=JSON.parse(localStorage.getItem(key)||"null");
    if(d)localStorage.setItem(key,JSON.stringify({...d,_submitted_at:new Date().toISOString()}));
  }catch{}
  setDeliveryStatus(token,"submitted_to_formsubmit");
}
function deliveryStatusKey(token){return "tpass_next_delivery_status_"+token}
function setDeliveryStatus(token,status){
  if(!token)return;
  const current=getDeliveryStatus(token)||{};
  const next={...current,token,status,updated_at:new Date().toISOString()};
  localStorage.setItem(deliveryStatusKey(token),JSON.stringify(next));
  return next;
}
function getDeliveryStatus(token){
  if(!token)return null;
  try{return JSON.parse(localStorage.getItem(deliveryStatusKey(token))||"null")}catch{return null}
}
function wasDeliverySubmitted(token){
  const st=getDeliveryStatus(token);
  return st?.status==="submitted_to_formsubmit"||st?.status==="gmail_verified";
}
function markGmailVerified(token){
  if(!token)return null;
  const current=getDeliveryStatus(token)||{};
  const next={...current,token,status:"gmail_verified",gmail_verified_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  localStorage.setItem(deliveryStatusKey(token),JSON.stringify(next));
  return next;
}
function clearGmailVerified(token){
  if(!token)return null;
  const current=getDeliveryStatus(token)||{};
  const next={...current,token,status:current.status==="gmail_verified"?"submitted_to_formsubmit":(current.status||"payload_created"),gmail_verified_at:null,updated_at:new Date().toISOString()};
  localStorage.setItem(deliveryStatusKey(token),JSON.stringify(next));
  return next;
}
function pendingAgeMinutes(payload){
  const t=payload?._saved_at||payload?.submitted_at;
  if(!t)return null;
  const ms=Date.now()-new Date(t).getTime();
  return Number.isFinite(ms)?Math.max(0,Math.round(ms/60000)):null;
}
function validateDeliveryPayload(payload){
  const missing=[];
  if(!payload) return {ok:false,missing:["payload"]};
  if(!String(payload.student_name||"").trim())missing.push("student_name");
  if(!String(payload.email||"").trim())missing.push("email");
  if(!String(payload.assessment_type||"").trim())missing.push("assessment_type");
  if(!String(payload.submission_id||"").trim())missing.push("submission_id");
  return {ok:missing.length===0,missing};
}
function cleanupOldDeliveries(maxAgeDays=7){
  const cutoff=Date.now()-maxAgeDays*86400000;
  const remove=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!k.startsWith("tpass_next_delivery_DLV-"))continue;
    try{
      const d=JSON.parse(localStorage.getItem(k)||"null");
      const t=new Date(d?._saved_at||d?.submitted_at||0).getTime();
      if(!t||t<cutoff){
        remove.push(k);
        const token=d?._delivery_token||k.replace("tpass_next_delivery_","");
        remove.push(deliveryStatusKey(token));
      }
    }catch{remove.push(k)}
  }
  [...new Set(remove)].forEach(k=>localStorage.removeItem(k));
  return remove.length;
}
function downloadJSON(name,data){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function compactResponses(payload){
  const arr=Array.isArray(payload.responses_json)?payload.responses_json:[];
  return arr.map((x,i)=>{
    const q=x.question_id||("Q"+(i+1));
    const sa=x.student_answer??"";
    const ca=x.correct_answer??"";
    const ok=x.is_correct?"O":"X";
    const skill=x.skill||x.dimension||"";
    const plays=x.plays!=null?("｜播放:"+x.plays):"";
    return q+"｜學生:"+sa+"｜正解:"+ca+"｜"+ok+(skill?"｜"+skill:"")+plays;
  }).join("\n");
}
function buildMailMessage(payload){
  if(payload&&typeof payload.preformatted_message==="string"&&payload.preformatted_message.trim()) return payload.preformatted_message.trim();
  const lines=[
    "Submission ID："+(payload.submission_id||""),
    "Submitted At："+(payload.submitted_at||""),
    "測驗："+(payload.assessment_type||""),
    "姓名："+(payload.student_name||""),
    "Email："+(payload.email||""),
    payload.current_score?"目前分數："+payload.current_score:"",
    payload.target_score?"目標分數："+payload.target_score:"",
    "測驗結果："+(payload.total_score||""),
    "正確率："+(payload.accuracy||""),
    "主要弱點："+(payload.primary_weakness||""),
    payload.secondary_weakness?"次要弱點："+payload.secondary_weakness:"",
    "",
    "逐題紀錄：",
    compactResponses(payload)
  ];
  return lines.filter((x,i)=>x!=="" || (i>0 && lines[i-1]!=="" )).join("\n");
}
function formFields(payload){
  return {
    _subject:"[T-PASS NEXT] "+(payload.assessment_type||"Assessment")+"｜"+(payload.student_name||"Student"),
    _template:"table",
    form_type:"T-PASS NEXT Assessment",
    name:payload.student_name||"",
    email:payload.email||"",
    message:buildMailMessage(payload)
  };
}
function submitResult(payload,statusEl){
  const localKey="tpass_next_submission_"+payload.submission_id;
  saveLocal(localKey,{...payload,delivery_status:"local_saved"});
  statusEl.textContent="✅ 完整結果已保存在本機。現在送出精簡 Email 紀錄；FormSubmit 成功頁代表已接收，但 Gmail 收信仍需另外驗收。";
  statusEl.className="status pending";

  const form=document.createElement("form");
  form.method="POST";
  form.action=TPASS_ENDPOINT;
  form.target="_blank";
  form.style.display="none";
  const fields=formFields(payload);
  Object.entries(fields).forEach(([name,value])=>{
    const input=document.createElement("input");
    input.type="hidden";input.name=name;input.value=value;form.appendChild(input);
  });
  document.body.appendChild(form);
  form.requestSubmit();
  setTimeout(()=>form.remove(),2000);
  saveLocal(localKey,{...payload,delivery_status:"submitted_to_formsubmit"});
}
function openPdfReport(payload){
  if(!payload){alert("請先完成診斷。");return}
  const w=window.open("","_blank");
  if(!w){alert("瀏覽器阻擋新視窗，請允許彈出視窗後再試。");return}
  const safe=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
  const rows=(Array.isArray(payload.responses_json)?payload.responses_json:[]).map((x,i)=>`
    <tr><td>${i+1}</td><td>${safe(x.question_id||"")}</td><td>${safe(x.student_answer||"")}</td><td>${safe(x.correct_answer||"")}</td><td>${x.is_correct?"O":"X"}</td></tr>`).join("");
  w.document.write(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>T-PASS Result</title>
  <style>body{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC",sans-serif;padding:28px;color:#173b2a}h1{color:#236b45}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #aaa;padding:7px;text-align:left}small{color:#666}@media print{button{display:none}}</style></head><body>
  <h1>T-PASS 多益學習診斷結果</h1>
  <p>姓名：${safe(payload.student_name)}</p><p>Email：${safe(payload.email)}</p>
  <p>測驗：${safe(payload.assessment_type)}</p><p>分數：${safe(payload.total_score)}｜正確率：${safe(payload.accuracy)}</p>
  <p>主要弱點：${safe(payload.primary_weakness)}</p><p>Submission ID：${safe(payload.submission_id)}</p>
  <table><thead><tr><th>#</th><th>題號</th><th>作答</th><th>正解</th><th>結果</th></tr></thead><tbody>${rows}</tbody></table>
  <p><small>請使用瀏覽器「列印／分享」並選擇「儲存為 PDF」。</small></p>
  <button onclick="window.print()">列印／儲存 PDF</button>
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),350);
}
function reportProblem(site){
  const subject=encodeURIComponent("[T-PASS NEXT 問題回報] "+site);
  const body=encodeURIComponent("請描述問題：\n\n裝置／瀏覽器：\n\n發生在哪一步：\n\n畫面訊息：\n");
  location.href="mailto:godlovesyou127888@gmail.com?subject="+subject+"&body="+body;
}
function baseStyles(){return `
:root{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC",system-ui,sans-serif;color:#173b2a;background:#f3f8f3}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#eef7ef,#f8fbf8)}
.wrap{max-width:820px;margin:auto;padding:16px}.hero{background:#2f7d4f;color:white;border-radius:22px;padding:24px;margin:10px 0 18px}
.hero h1{font-size:clamp(28px,6vw,42px);line-height:1.2;margin:0 0 8px}.hero p{font-size:18px;line-height:1.6;margin:0}
.card{background:#fff;border:2px solid #dcebdd;border-radius:22px;padding:20px;margin:16px 0;box-shadow:0 4px 14px #214f2e12}
h2{color:#236b45}.muted{color:#587061;font-size:17px;line-height:1.7}.q{padding:22px 0;border-top:1px solid #e5efe6}.q:first-child{border-top:0}.q>b{font-size:22px;line-height:1.45}
label{display:flex;align-items:center;gap:12px;margin:12px 0;padding:14px;border:1px solid #d7e5d8;border-radius:14px;font-size:20px;line-height:1.4;background:#fbfdfb}
input[type=radio]{width:26px;height:26px;flex:0 0 26px;accent-color:#2f7d4f}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
input[type=text],input[type=email],input[inputmode=numeric],input{font-size:18px}input:not([type=radio]){width:100%;padding:14px;border:2px solid #cfe0d1;border-radius:12px}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
button,.btn{border:0;border-radius:14px;padding:15px 16px;background:#2f7d4f;color:#fff;font-size:18px;font-weight:800;cursor:pointer;text-decoration:none;text-align:center;min-height:54px}
.secondary{background:#62856e}.outline{background:#fff;color:#2f7d4f;border:2px solid #2f7d4f}.status{padding:16px;border-radius:14px;margin-top:14px;font-size:18px;line-height:1.55}
.ok{background:#e8f7ec;border:1px solid #aad6b6}.fail{background:#fff1f0;border:1px solid #efb4af}.pending{background:#fff8df;border:1px solid #ead694}
.audioBtn{width:100%;background:#3d8b5b;margin:10px 0 4px}.helper{background:#f0f7f1;border-left:5px solid #5c9a70;padding:12px 14px;border-radius:10px;margin:12px 0}
.footerHelp{margin-top:18px;padding-top:18px;border-top:1px solid #dfe9df}
@media(max-width:640px){.wrap{padding:10px}.row,.actions{grid-template-columns:1fr}.card{padding:16px}.hero{padding:20px}button,.btn{width:100%}}
`}