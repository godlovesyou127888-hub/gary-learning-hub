(()=>{"use strict";
const script=document.currentScript, key=script.dataset.recordsKey, title=script.dataset.assessment, defaultName=script.dataset.student||"";
const endpoint="https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec";
const root=document.getElementById("garyCoachDelivery"), status=document.getElementById("garyCoachStatus");
if(!root||!status||!key)return;
const nameEl=document.getElementById("garyCoachName"),emailEl=document.getElementById("garyCoachEmail"),send=document.getElementById("garyCoachSend");
let lastClick=0;
function getRecords(){try{const rows=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(rows)?rows:[]}catch{return []}}
function makeReport(){
 const rows=getRecords(),last=rows.length?(defaultName?rows[rows.length-1]:rows[0]):null;
 const data={assessment:title,source_page:location.href,student_name:nameEl.value.trim(),student_email:emailEl.value.trim(),total_attempts:rows.length,latest_attempt:last,records:rows,exported_at:new Date().toISOString(),note:"學員自填或自評紀錄，不代表官方 IELTS Band；若站內錄音未持久保存，音訊不包含在報告內。"};
 return data;
}
function backup(){const data=makeReport(),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download="ielts-coach-backup-"+Date.now()+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
document.getElementById("garyCoachBackup").addEventListener("click",backup);
send.addEventListener("click",()=>{
 const rows=getRecords(),name=nameEl.value.trim(),email=emailEl.value.trim();
 if(!rows.length){status.textContent="請先完成並儲存至少一筆練習紀錄。";return}
 if(!name){status.textContent="請填寫學員姓名。";nameEl.focus();return}
 if(!email||!emailEl.checkValidity()){status.textContent="請填寫有效的學員 Email。";emailEl.focus();return}
 if(Date.now()-lastClick<15000){status.textContent="15 秒內已嘗試提交，請先檢查新分頁，不要重複寄送。";return}
 if(!confirm("確認交付 "+rows.length+" 筆完整學習紀錄給 Gary 教練？請先下載 JSON 備份。"))return;
 lastClick=Date.now();
 const report=makeReport(),submission="IELTS-COACH-"+Date.now()+"-"+Math.random().toString(36).slice(2,7).toUpperCase(),last=report.latest_attempt||{};
 const summary=[title,"送件編號："+submission,"總紀錄數："+rows.length,"最近練習："+(last.date||last.created_at||"未記錄"),"最近 Band／成績："+(last.band??last.score??"未評分"),"主要弱點："+(last.weak||last.weakness||last.self_concern||"詳見完整 JSON")].join("\n");
 const payload={submission_id:submission,submitted_at:new Date().toISOString(),assessment_type:title,source_page:location.href,student_name:name,email,total_score:String(last.band??last.score??"未評分"),accuracy:"",primary_weakness:String(last.weak||last.weakness||last.self_concern||""),secondary_weakness:String(last.secondary||""),summary,responses_json:JSON.stringify({...report,submission_id:submission})};
 const form=document.createElement("form");form.method="POST";form.action=endpoint;form.target="_blank";form.style.display="none";
 for(const [k,v] of Object.entries(payload)){const i=document.createElement("input");i.type="hidden";i.name=k;i.value=String(v??"");form.appendChild(i)}
 document.body.appendChild(form);
 try{form.submit();status.textContent="已嘗試提交至 Google Apps Script，送件編號："+submission+"。請檢查新分頁；只有 Gmail／Sheets 實際收件才算完成。";sessionStorage.setItem("ielts_delivery_pending_"+key,submission)}
 catch(e){lastClick=0;status.textContent="提交未完成，請下載 JSON 並重試。"}
 finally{form.remove()}
});
})();