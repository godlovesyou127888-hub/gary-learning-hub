
const TPASS_ENDPOINT="https://script.google.com/macros/s/AKfycbzBBBM5A2MXBQTYnnJPYUcS_sve909wl-P_CuoW57lr/exec";
function uid(prefix="TPASS"){return prefix+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8).toUpperCase()}
function saveLocal(key,data){localStorage.setItem(key,JSON.stringify(data))}
function loadLocal(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function downloadJSON(name,data){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function submitResult(payload,statusEl){
  const localKey="tpass_next_submission_"+payload.submission_id;
  saveLocal(localKey,payload);
  statusEl.textContent="本机已保存，正在传送线上资料…";
  statusEl.className="status pending";
  try{
    const body=new URLSearchParams();
    Object.entries(payload).forEach(([k,v])=>body.append(k,typeof v==="string"?v:JSON.stringify(v)));
    const r=await fetch(TPASS_ENDPOINT,{method:"POST",body,mode:"cors"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const txt=await r.text();
    statusEl.textContent="✅ 已送出。Submission ID："+payload.submission_id;
    statusEl.className="status ok";
    saveLocal(localKey,{...payload,delivery_status:"sent",delivery_response:txt});
    return true;
  }catch(err){
    statusEl.textContent="⚠️ 线上传送失败，但完整资料已保存在本机。请按「下载完整结果 JSON」。";
    statusEl.className="status fail";
    saveLocal(localKey,{...payload,delivery_status:"failed",delivery_error:String(err)});
    return false;
  }
}
function baseStyles(){return `
:root{font-family:Inter,"Noto Sans TC",system-ui,sans-serif;color:#14213d;background:#f6f8fb}
body{margin:0}.wrap{max-width:920px;margin:auto;padding:24px}.card{background:#fff;border:1px solid #dfe5ee;border-radius:16px;padding:20px;margin:16px 0;box-shadow:0 3px 12px #00000008}
h1{margin:.2em 0}.muted{color:#5d6778}.q{padding:16px 0;border-top:1px solid #edf0f4}.q:first-child{border-top:0}
label{display:block;margin:7px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd3df;border-radius:10px}
button,.btn{border:0;border-radius:10px;padding:12px 16px;background:#14213d;color:#fff;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block;margin:5px 5px 5px 0}.secondary{background:#54657e}.status{padding:14px;border-radius:10px;margin-top:12px}.ok{background:#e9f7ef}.fail{background:#fff1f0}.pending{background:#fff8df}
@media(max-width:640px){.row{grid-template-columns:1fr}.wrap{padding:14px}}
`}
