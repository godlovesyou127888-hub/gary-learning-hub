(()=>{"use strict";
const D=window.INTERVIEW_DATA,KEY="interview_english_coach_v1";
const $=id=>document.getElementById(id);
const state={answers:{},diagnosis:null,practices:[]};
try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||"{}"))}catch{}
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function renderQuiz(){
  $("questions").innerHTML=D.questions.map((q,i)=>`<div class="question"><p><b>${i+1}. ${esc(q.q)}</b></p>${q.opts.map((o,j)=>`<label class="option"><input type="radio" name="q${i}" value="${j}" ${state.answers[i]===j?"checked":""}> ${esc(o)}</label>`).join("")}</div>`).join("");
  updateProgress();
}
function updateProgress(){
  const n=Object.keys(state.answers).length;
  $("progressText").textContent=`已完成 ${n} / 12 題`;
  $("quizProgress").style.width=(n/12*100)+"%";
}
$("questions").addEventListener("change",e=>{if(!e.target.matches('input[type="radio"]'))return;state.answers[Number(e.target.name.slice(1))]=Number(e.target.value);save();updateProgress();});
$("quizForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(Object.keys(state.answers).length<12){$("quizStatus").textContent="請先完成 12 題。";return}
  const dims={};Object.keys(D.dimensions).forEach(k=>dims[k]={right:0,total:0});
  let total=0;
  D.questions.forEach((q,i)=>{dims[q.d].total++;if(state.answers[i]===q.a){dims[q.d].right++;total++}});
  state.diagnosis={total,dims,completedAt:new Date().toISOString()};save();renderDiagnosis();renderSummary();if(window.prepareInterviewDelivery)window.prepareInterviewDelivery();
});
function renderDiagnosis(){
  if(!state.diagnosis)return;
  const r=state.diagnosis;$("diagnosisResult").hidden=false;$("score").textContent=`診斷分數：${r.total} / 12`;
  const entries=Object.entries(r.dims).map(([k,v])=>({k,p:v.right/v.total*100}));
  $("dimensions").innerHTML=entries.map(x=>`<div class="metric"><b>${D.dimensions[x.k].label}</b><span>${Math.round(x.p)}%</span><div class="bar"><i style="width:${x.p}%"></i></div></div>`).join("");
  entries.sort((a,b)=>a.p-b.p);const low=entries[0].k;
  $("prescription").innerHTML=`<b>先練：${D.dimensions[low].label}</b><br>${D.dimensions[low].tip}`;
  $("answerReview").innerHTML=D.questions.map((q,i)=>`<div class="reviewItem"><b>${i+1}. ${esc(q.q)}</b><br>你的答案：${esc(q.opts[state.answers[i]])}<br>正解：${esc(q.opts[q.a])}<br><span class="note">${esc(q.why)}</span></div>`).join("");
}
function renderPrompts(){
  $("promptSelect").innerHTML=D.prompts.map((p,i)=>`<option value="${i}">${i+1}. ${esc(p.q)}</option>`).join("");renderPrompt(0);
}
function renderPrompt(i){
  const p=D.prompts[i];$("promptCategory").textContent=p.cat;$("promptQuestion").textContent=p.q;$("promptZh").textContent=p.zh;$("frame").textContent=p.frame;$("model").textContent=p.model;$("modelZh").textContent=p.modelZh;
}
$("promptSelect").addEventListener("change",e=>renderPrompt(Number(e.target.value)));
$("nextPrompt").addEventListener("click",()=>{let i=(Number($("promptSelect").value)+1)%D.prompts.length;$("promptSelect").value=i;renderPrompt(i);["situation","task","action","result","finalAnswer"].forEach(id=>$(id).value="");updateCount();});
function updateCount(){const n=$("finalAnswer").value.trim()?$("finalAnswer").value.trim().split(/\s+/).length:0;$("answerCount").textContent=n+" words";}
$("finalAnswer").addEventListener("input",updateCount);
function renderRubric(){
  $("rubric").innerHTML=D.rubric.map(r=>`<div class="rubricRow"><label for="r-${r.key}">${r.label}</label><select id="r-${r.key}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===3?"selected":""}>${n} / 5</option>`).join("")}</select></div>`).join("");
}
$("savePractice").addEventListener("click",()=>{
  const answer=$("finalAnswer").value.trim();if(!answer){$("practiceStatus").textContent="請先寫出整合後的英文回答。";return}
  const i=Number($("promptSelect").value),p=D.prompts[i],scores={};D.rubric.forEach(r=>scores[r.key]=Number($("r-"+r.key).value));
  const avg=Object.values(scores).reduce((a,b)=>a+b,0)/Object.values(scores).length;
  state.practices.push({id:"INT-"+Date.now(),promptIndex:i,question:p.q,category:p.cat,star:{situation:$("situation").value.trim(),task:$("task").value.trim(),action:$("action").value.trim(),result:$("result").value.trim()},answer,scores,average:Number(avg.toFixed(1)),createdAt:new Date().toISOString()});
  save();$("practiceStatus").textContent=`已儲存。自評平均 ${avg.toFixed(1)} / 5。`;renderSummary();renderHistory();if(window.prepareInterviewDelivery)window.prepareInterviewDelivery();
});
function renderSummary(){
  const d=state.diagnosis,p=state.practices;
  $("summary").innerHTML=`<div class="metrics"><div class="metric"><b>診斷</b><span>${d?d.total+"/12":"尚未完成"}</span></div><div class="metric"><b>已儲存演練</b><span>${p.length} 次</span></div></div>`;
}
function renderHistory(){
  const h=state.practices.slice().reverse();
  $("history").innerHTML=h.length?h.map(x=>`<div class="historyItem"><b>${esc(x.category)}｜${esc(x.question)}</b><br><span class="note">${new Date(x.createdAt).toLocaleString()} · 自評 ${x.average}/5</span><p>${esc(x.answer)}</p></div>`).join(""):"尚無紀錄。";
}
$("download").addEventListener("click",()=>{
  const payload={exportedAt:new Date().toISOString(),student:$("student").value.trim(),email:$("email").value.trim(),...state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="interview-english-coach-"+Date.now()+".json";a.click();URL.revokeObjectURL(a.href);
});
$("print").addEventListener("click",()=>window.print());
$("reset").addEventListener("click",()=>{if(!confirm("確定清除此裝置的 Interview English Coach 紀錄？"))return;localStorage.removeItem(KEY);location.reload();});
["student","email"].forEach(id=>{const el=$(id);el.value=state[id]||"";el.addEventListener("input",()=>{state[id]=el.value;save()})});
renderQuiz();renderDiagnosis();renderPrompts();renderRubric();renderSummary();renderHistory();updateCount();
})();