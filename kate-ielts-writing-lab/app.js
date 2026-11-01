(()=>{"use strict";
const KEY="kate_ielts_writing_lab_v1",DELIVERY_URL="https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec",$=id=>document.getElementById(id);
const dimensions=[["task","Task Achievement / Response"],["coherence","Coherence & Cohesion"],["lexical","Lexical Resource"],["grammar","Grammar Range & Accuracy"]];
let state={diagnoses:[],rewrites:[]};try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");state={diagnoses:Array.isArray(x.diagnoses)?x.diagnoses:[],rewrites:Array.isArray(x.rewrites)?x.rewrites:[]}}catch{}
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));$("date").value=new Date().toISOString().slice(0,10);
function wc(){const n=$("essay").value.trim()?$("essay").value.trim().split(/\s+/).length:0;$("wordCount").textContent=n+" words"}$("essay").addEventListener("input",wc);wc();
$("rubric").innerHTML=dimensions.map(([k,l])=>`<div class="rubricRow"><label for="r-${k}">${l}</label><select id="r-${k}">${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}" ${n===5?"selected":""}>${n}</option>`).join("")}</select></div>`).join("");
$("mainIssue").innerHTML=dimensions.map(([k,l])=>`<option value="${k}">${l}</option>`).join("");
$("analyze").onclick=()=>{if(!$("essay").value.trim()){ $("writeStatus").textContent="請先輸入作文。";return } $("writeStatus").textContent="作文已準備完成，請往下完成四構面自評。";location.hash="diagnosis"};
$("saveDiagnosis").onclick=()=>{if(!$("essay").value.trim()){ $("diagnosisStatus").textContent="請先輸入作文。";return }
 const scores={};dimensions.forEach(([k])=>scores[k]=Number($("r-"+k).value));const avg=Object.values(scores).reduce((a,b)=>a+b,0)/4;
 const rec={id:"KATE-W-"+Date.now(),taskType:$("taskType").value,date:$("date").value,question:$("question").value.trim(),essay:$("essay").value.trim(),wordCount:$("essay").value.trim().split(/\s+/).filter(Boolean).length,scores,average:Number(avg.toFixed(1)),mainIssue:$("mainIssue").value,coachNote:$("coachNote").value.trim(),createdAt:new Date().toISOString()};
 state.diagnoses.unshift(rec);save();$("diagnosisStatus").textContent="診斷已儲存。";render();
};
$("saveRewrite").onclick=()=>{const a=$("originalParagraph").value.trim(),b=$("rewrittenParagraph").value.trim();if(!a||!b){$("rewriteStatus").textContent="請填寫原段落與改寫後版本。";return}
 state.rewrites.unshift({id:"KATE-R-"+Date.now(),original:a,rewritten:b,focus:$("rewriteFocus").value,score:Number($("rewriteScore").value),createdAt:new Date().toISOString()});save();$("rewriteStatus").textContent="改寫已儲存。";render();
};
function render(){const d=state.diagnoses[0];$("summary").innerHTML=`<div class="grid"><div class="metric"><b>診斷次數</b><br>${state.diagnoses.length}</div><div class="metric"><b>改寫次數</b><br>${state.rewrites.length}</div><div class="metric"><b>最新平均</b><br>${d?d.average+"/9":"尚無"}</div><div class="metric"><b>最新主要問題</b><br>${d?dimensions.find(x=>x[0]===d.mainIssue)?.[1]:"尚無"}</div></div>`;
 const items=[...state.diagnoses.map(x=>({t:x.createdAt,h:"診斷｜"+x.taskType,b:"平均 "+x.average+"/9｜"+(dimensions.find(y=>y[0]===x.mainIssue)?.[1]||"")})),...state.rewrites.map(x=>({t:x.createdAt,h:"改寫｜"+x.focus,b:"自評 "+x.score+"/5"}))].sort((a,b)=>b.t.localeCompare(a.t));
 $("history").innerHTML=items.length?items.map(x=>`<div class="historyItem"><b>${x.h}</b><br><span class="note">${new Date(x.t).toLocaleString()}｜${x.b}</span></div>`).join(""):"尚無紀錄。";
}render();
function payload(){const d=state.diagnoses[0],r=state.rewrites[0];return{site_version:"Kate IELTS Writing Lab MVP V1",exported_at:new Date().toISOString(),student:$("student").value.trim()||"Kate",email:$("email").value.trim(),latest_diagnosis:d||null,latest_rewrite:r||null,diagnoses:state.diagnoses,rewrites:state.rewrites}}
$("download").onclick=()=>{const p=payload(),u=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download="kate-ielts-writing-lab-"+Date.now()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};
$("print").onclick=()=>window.print();
$("sendCoach").onclick=()=>{if(!state.diagnoses.length){$("deliveryStatus").textContent="請先完成至少一次診斷。";return}const p=payload(),d=p.latest_diagnosis;const email=p.email;if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ $("deliveryStatus").textContent="Email 格式不正確。";return}
 const body={submission_id:"KATE-W-"+Date.now(),submitted_at:new Date().toISOString(),assessment_type:"Kate IELTS Writing Lab｜寫作論證與文法訓練",source_page:location.href,student_name:p.student,email:p.email,current_score:d.average+"/9",target_score:"IELTS 7.0",total_score:d.average+"/9",accuracy:"",primary_weakness:dimensions.find(x=>x[0]===d.mainIssue)?.[1]||"",secondary_weakness:"",summary:["Kate IELTS Writing Lab","題型："+d.taskType,"字數："+d.wordCount,"四構面平均："+d.average+"/9","主要問題："+(dimensions.find(x=>x[0]===d.mainIssue)?.[1]||""),"改寫次數："+state.rewrites.length].join("\n"),responses_json:JSON.stringify(p)};
 $("deliveryStatus").textContent="正在寄送完整結果給 Gary 教練。看到 Email 狀態：sent 才算完成。";const form=document.createElement("form");form.method="POST";form.action=DELIVERY_URL;form.target="_self";form.style.display="none";Object.entries(body).forEach(([k,v])=>{const i=document.createElement("input");i.type="hidden";i.name=k;i.value=String(v??"");form.appendChild(i)});document.body.appendChild(form);form.submit();
};
})();