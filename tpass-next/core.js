
const TPASS_ENDPOINT="https://formsubmit.co/43c5627bc898e872509ffd1b6aa8d728";
function uid(prefix="TPASS"){return prefix+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8).toUpperCase()}
function saveLocal(key,data){localStorage.setItem(key,JSON.stringify(data))}
function loadLocal(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function downloadJSON(name,data){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function submitResult(payload,statusEl){
  const localKey="tpass_next_submission_"+payload.submission_id;
  saveLocal(localKey,payload);
  statusEl.textContent="本機已保存，正在送出 FormSubmit…";
  statusEl.className="status pending";

  try{
    let iframe=document.getElementById("tpassFormSubmitFrame");
    if(!iframe){
      iframe=document.createElement("iframe");
      iframe.id="tpassFormSubmitFrame";
      iframe.name="tpassFormSubmitFrame";
      iframe.style.display="none";
      document.body.appendChild(iframe);
    }

    const form=document.createElement("form");
    form.method="POST";
    form.action=TPASS_ENDPOINT;
    form.target="tpassFormSubmitFrame";
    form.style.display="none";

    const fields={
      _subject:"[T-PASS NEXT] "+(payload.assessment_type||"Assessment")+"｜"+(payload.student_name||"Student")+"｜"+payload.submission_id,
      _template:"table",
      _captcha:"false",
      _autoresponse:"已收到你的 T-PASS NEXT 結果。請保留此信作為學習紀錄副本。",
      submission_id:payload.submission_id||"",
      submitted_at:payload.submitted_at||"",
      assessment_type:payload.assessment_type||"",
      source_page:payload.source_page||"",
      student_name:payload.student_name||"",
      email:payload.email||"",
      current_score:payload.current_score||"",
      target_score:payload.target_score||"",
      total_score:payload.total_score||"",
      accuracy:payload.accuracy||"",
      primary_weakness:payload.primary_weakness||"",
      secondary_weakness:payload.secondary_weakness||"",
      summary:typeof payload.summary==="string"?payload.summary:JSON.stringify(payload.summary||{}),
      responses_json:typeof payload.responses_json==="string"?payload.responses_json:JSON.stringify(payload.responses_json||[])
    };

    Object.entries(fields).forEach(([name,value])=>{
      const input=document.createElement("input");
      input.type="hidden";
      input.name=name;
      input.value=value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    setTimeout(()=>form.remove(),1500);

    const sent={...payload,delivery_status:"submitted_to_formsubmit"};
    saveLocal(localKey,sent);
    statusEl.textContent="✅ 已送出 FormSubmit。Submission ID："+payload.submission_id+"。完整資料亦已保存在本機。";
    statusEl.className="status ok";
    return true;
  }catch(err){
    saveLocal(localKey,{...payload,delivery_status:"failed",delivery_error:String(err)});
    statusEl.textContent="⚠️ FormSubmit 送出失敗，但完整資料已保存在本機。請下載完整結果 JSON。";
    statusEl.className="status fail";
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
