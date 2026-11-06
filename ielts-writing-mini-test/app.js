(()=>{"use strict";
const $=id=>document.getElementById(id),KEY="ielts_writing_mini_test_v1",DELIVERY_URL="https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec";
$("date").value=new Date().toISOString().slice(0,10);
const dims=[["task","Task Achievement / Response"],["coherence","Coherence & Cohesion"],["lexical","Lexical Resource"],["grammar","Grammatical Range & Accuracy"]];
$("rubric").innerHTML=dims.map(([k,l])=>'<div class="rubricRow"><label>'+l+'</label><select id="r-'+k+'">'+[1,2,3,4,5,6,7,8,9].map(n=>'<option value="'+n+'" '+(n===5?'selected':'')+'>'+n+'</option>').join("")+'</select></div>').join("");
$("mainIssue").innerHTML=dims.map(([k,l])=>'<option value="'+k+'">'+l+'</option>').join("");

let state={attempts:[]};try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");if(Array.isArray(x.attempts))state=x}catch{}
let remaining=3600,timerId=null,startedAt=null,elapsed=0,latest=null;
function showTimer(){const m=String(Math.floor(remaining/60)).padStart(2,"0"),s=String(remaining%60).padStart(2,"0");$("timerText").textContent=m+":"+s}
$("startTimer").onclick=()=>{if($("mode").value!=="exam")return;if(timerId)return;if(!startedAt)startedAt=new Date().toISOString();timerId=setInterval(()=>{if(remaining>0){remaining--;elapsed++;showTimer()}else{clearInterval(timerId);timerId=null;$("submitStatus").textContent="60 分鐘已到，請立即送出。"}},1000)};
$("pauseTimer").onclick=()=>{clearInterval(timerId);timerId=null};
$("resetTimer").onclick=()=>{clearInterval(timerId);timerId=null;remaining=3600;elapsed=0;startedAt=null;showTimer()};showTimer();

function words(s){const t=String(s||"").trim();return t?t.split(/\s+/).filter(Boolean).length:0}
function updateCount(id,out,check,min){const n=words($(id).value);$(out).textContent=n;$(check).textContent=n>=min?"已達最低字數":"未達 "+min+" 字";$(check).className=n>=min?"ok":"warn"}
$("task1").oninput=()=>updateCount("task1","t1Words","t1Check",150);$("task2").oninput=()=>updateCount("task2","t2Words","t2Check",250);
updateCount("task1","t1Words","t1Check",150);updateCount("task2","t2Words","t2Check",250);

function paragraphCount(s){return String(s||"").trim()?String(s).trim().split(/\n\s*\n/).filter(x=>x.trim()).length:0}
function hasOverview(s){return /\b(overall|in general|it is clear|it can be seen)\b/i.test(s)}
function hasOpinion(s){return /\b(i believe|i think|in my view|in my opinion|i agree|i disagree)\b/i.test(s)}
function collect(){const scores={};dims.forEach(([k])=>scores[k]=Number($("r-"+k).value));return{student:$("student").value.trim(),email:$("email").value.trim(),date:$("date").value,mode:$("mode").value,task1:$("task1").value.trim(),task2:$("task2").value.trim(),scores,mainIssue:$("mainIssue").value,reflection:$("reflection").value.trim()}}
$("submitTest").onclick=()=>{const p=collect();if(!p.task1||!p.task2){$("submitStatus").textContent="Task 1 與 Task 2 都必須完成。";return}clearInterval(timerId);timerId=null;const t1w=words(p.task1),t2w=words(p.task2),avg=Object.values(p.scores).reduce((a,b)=>a+b,0)/4;const checks={task1Word:t1w>=150,task2Word:t2w>=250,task1Overview:hasOverview(p.task1),task1Paragraphs:paragraphCount(p.task1)>=3,task2Paragraphs:paragraphCount(p.task2)>=4,task2Opinion:hasOpinion(p.task2)};latest={...p,id:"IELTS-WMINI-"+Date.now(),startedAt,submittedAt:new Date().toISOString(),elapsedSec:elapsed||null,task1Words:t1w,task2Words:t2w,averageSelfBand:Number(avg.toFixed(1)),checks};state.attempts.unshift(latest);localStorage.setItem(KEY,JSON.stringify(state));$("submitStatus").textContent="Writing Mini Test 已完成並儲存。";render(latest)};
function render(a){$("summary").innerHTML='<div class="grid"><div class="metric"><b>'+a.task1Words+'</b><br>Task 1 words</div><div class="metric"><b>'+a.task2Words+'</b><br>Task 2 words</div><div class="metric"><b>'+a.averageSelfBand+'/9</b><br>四構面自評平均</div><div class="metric"><b>'+(a.elapsedSec==null?"—":Math.round(a.elapsedSec/60)+" min")+'</b><br>作答時間</div></div>';
 const failed=Object.entries(a.checks).filter(x=>!x[1]).map(x=>x[0]);
 $("analysis").innerHTML='<div class="analysisBox"><b>完成度診斷：</b>'+(failed.length?'有 '+failed.length+' 個基本項目需要優先檢查。':'基本完成度檢查全部通過。')+'<br><span class="note">這不是正式 IELTS Band 評分；正式分數仍需依四項評分標準由合格評分者判定。</span></div>';
 const labels={task1Word:"Task 1 至少 150 字",task2Word:"Task 2 至少 250 字",task1Overview:"Task 1 有明確 Overview 訊號",task1Paragraphs:"Task 1 至少 3 段",task2Paragraphs:"Task 2 至少 4 段",task2Opinion:"Task 2 有清楚立場訊號"};
 $("review").innerHTML=Object.entries(a.checks).map(([k,v])=>'<div class="reviewItem"><b class="'+(v?"ok":"warn")+'">'+(v?"PASS":"CHECK")+'</b>｜'+labels[k]+'</div>').join("")}
if(state.attempts[0]){latest=state.attempts[0];render(latest)}

function payload(){return{site_version:"IELTS Academic Writing Mini Test MVP V1",exported_at:new Date().toISOString(),latest_attempt:latest||state.attempts[0]||null,attempts:state.attempts}}
$("download").onclick=()=>{const p=payload(),u=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download="ielts-writing-mini-"+Date.now()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};$("print").onclick=()=>window.print();

$("sendCoach").onclick=()=>{const p=payload(),a=p.latest_attempt;if(!a){$("deliveryStatus").textContent="請先完成 Writing Mini Test。";return}if(!a.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)){$("deliveryStatus").textContent="請填寫可接收結果的有效 Email。";return}const submissionId="IELTS-WMINI-"+Date.now();const fullDelivery={submission_id:submissionId,submitted_at:new Date().toISOString(),assessment:"IELTS Academic Writing Mini Test｜原創Task 1+2正式交付",source_page:location.href,student_name:a.student||"IELTS Student",student_email:a.email,test_date:a.date,mode:a.mode,elapsed_sec:a.elapsedSec,task1_prompt:"Commuter transport table 2010 vs 2025",task1_response:a.task1,task1_word_count:a.task1Words,task2_prompt:"Universities: employment preparation vs broad education",task2_response:a.task2,task2_word_count:a.task2Words,self_scores:a.scores,self_band_average:a.averageSelfBand,primary_weakness:dims.find(x=>x[0]===a.mainIssue)?.[1]||"",reflection:a.reflection,completion_checks:a.checks,attempt:a};
const body={submission_id:submissionId,submitted_at:fullDelivery.submitted_at,assessment_type:fullDelivery.assessment,source_page:location.href,student_name:fullDelivery.student_name,email:a.email,current_score:a.averageSelfBand+"/9 self-rating",target_score:"IELTS Writing 7.0",total_score:a.averageSelfBand+"/9",accuracy:"",primary_weakness:fullDelivery.primary_weakness,secondary_weakness:"",summary:["IELTS Academic Writing Mini Test","Submission ID："+submissionId,"Task 1："+a.task1Words+" words","Task 2："+a.task2Words+" words","自評平均："+a.averageSelfBand+"/9","主要問題："+fullDelivery.primary_weakness,"作答時間："+(a.elapsedSec==null?"未計時":Math.round(a.elapsedSec/60)+" 分鐘")].join("\n"),responses_json:JSON.stringify(fullDelivery)};
try{localStorage.setItem("ielts_writing_delivery_last_v1",JSON.stringify({submission_id:submissionId,created_at:body.submitted_at,status:"submitted_to_gateway",email:a.email}))}catch{}
$("deliveryStatus").textContent="已準備提交完整模考資料。Submission ID："+submissionId+"。需以 Gmail 實收確認才算正式完成。";
const form=document.createElement("form");form.method="POST";form.action=DELIVERY_URL;form.target="_blank";form.style.display="none";Object.entries(body).forEach(([k,v])=>{const i=document.createElement("input");i.type="hidden";i.name=k;i.value=String(v??"");form.appendChild(i)});document.body.appendChild(form);window.open("https://mail.google.com/mail/?view=cm&fs=1&to=godlovesyou127888%40gmail.com&su="+encodeURIComponent("[IELTS] "+body.assessment_type+" "+submissionId)+"&body="+encodeURIComponent(body.summary+"\n\n請將下載的完整 JSON 報告附加到此信，再按傳送。"),"_blank")};
})();