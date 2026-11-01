(()=>{"use strict";
const $=id=>document.getElementById(id),KEY="ielts_listening_mini_test_2_v1",DELIVERY_URL="https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec";
$("date").value=new Date().toISOString().slice(0,10);
const scripts={
2:"Welcome to the Riverside Community Walking Club. This Saturday's walk will begin at the east entrance of Green Park. Please arrive by eight forty-five because the group will leave at nine o'clock sharp. The walk is about seven kilometres, so everyone should bring a water bottle and wear comfortable shoes. We had planned to follow the river path, but because of road repairs near the bridge, the route has been changed. The registration fee is twelve pounds. This includes basic accident insurance, but not lunch or transport. After the walk, participants may buy food at the park cafe.",
3:"Tutor: So, how is the group project going? Student 1: Better now, but at first our research question was too broad and we weren't sure what exactly to measure. Student 2: We found plenty of sources, but that made it harder to focus. Tutor: That sounds like the main issue. What have you done since then? Student 1: We narrowed the question and drafted a questionnaire. Tutor: Good. Before collecting more data, I suggest you rewrite the questionnaire. Some questions are still leading. Student 2: We were also wondering whether the literature review is too long. Tutor: Yes, shorten that section. Your method section is fine. Also, explain more clearly how you selected the participants. Student 1: Right. And when should we send you the revised plan? Tutor: By Friday, please. Then I can give you feedback before next week's seminar."
};
const answers={
q1:{a:"east",type:"detail",why:"集合點是 Green Park 的 east entrance。"},
q2:{a:"9",alt:["9:00","9.00","nine","nine o'clock"],type:"detail",why:"團體會在 nine o'clock sharp 出發。"},
q3:{a:"water bottle",alt:["bottle"],type:"detail",why:"工作人員要求帶 water bottle。"},
q4:{a:"A",type:"gist",why:"路線更改是因為 bridge 附近 road repairs。"},
q5:{a:"B",type:"gist",why:"費用包含 basic accident insurance。"},
q6:{a:"B",type:"discussion",why:"學生一開始的問題是 research question 太廣、不清楚。"},
q7:{a:"A",type:"discussion",why:"教授建議在蒐集更多資料前先 rewrite the questionnaire。"},
q8:{a:"C",type:"discussion",why:"教授明確說 shorten the literature review。"},
q9:{a:"participants",type:"note",why:"需要說明如何 selected the participants。"},
q10:{a:"friday",type:"note",why:"修正版要在 Friday 前繳交。"}
};
let state={attempts:[]};try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");if(Array.isArray(x.attempts))state=x}catch{}
let plays={2:0,3:0},latest=null,retryItems=[];
function normalize(s){return String(s||"").trim().toLowerCase().replace(/s+/g," ")}
function correct(id,v){const x=answers[id],n=normalize(v);return n===normalize(x.a)||(x.alt||[]).some(a=>n===normalize(a))}
function speak(part){if($("mode").value==="exam"&&plays[part]>=1){$(part===2?"play2Status":"play3Status").textContent="正式模式：此段已播放一次。";return}if(!("speechSynthesis" in window)){$(part===2?"play2Status":"play3Status").textContent="此瀏覽器不支援語音播放。";return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(scripts[part]);u.lang="en-GB";u.rate=.9;plays[part]++;const s=$(part===2?"play2Status":"play3Status");s.textContent="播放中… 第 "+plays[part]+" 次";u.onend=()=>s.textContent="播放完成｜已播放 "+plays[part]+" 次";speechSynthesis.speak(u)}
$("play2").onclick=()=>speak(2);$("play3").onclick=()=>speak(3);
function getResponses(){const r={};for(let i=1;i<=10;i++)r["q"+i]=$("q"+i).value;return r}
function scoreResponses(r){let score=0;const wrong=[];Object.keys(answers).forEach(id=>{if(correct(id,r[id]))score++;else wrong.push(id)});return{score,wrong}}
function bandEstimate(score){if(score>=9)return"7.5–8.0";if(score>=8)return"7.0";if(score>=7)return"6.5";if(score>=6)return"6.0";if(score>=5)return"5.5";return"≤5.0"}
function weakType(wrong){const count={detail:0,gist:0,discussion:0,note:0};wrong.forEach(id=>count[answers[id].type]++);return Object.entries(count).sort((a,b)=>b[1]-a[1])[0][0]}
function weakLabel(t){return t==="detail"?"細節資訊／數字定位":t==="gist"?"單人說明主旨與選項":t==="discussion"?"多人討論觀點辨識":"筆記填空／關鍵字"}
function renderReview(r,wrong){$("review").innerHTML=Object.keys(answers).map((id,i)=>{const ok=!wrong.includes(id),x=answers[id];return '<div class="reviewItem"><b>Q'+(i+1)+'｜'+(ok?'<span class="ok">O</span>':'<span class="bad">X</span>')+'</b><br>你的答案：'+(r[id]||"—")+'<br>正解：'+x.a+'<br><span class="note">'+x.why+'</span></div>'}).join("")}
function renderRetry(wrong){retryItems=wrong;$("retry").innerHTML=wrong.length?wrong.map(id=>'<label>Q'+id.slice(1)+' 再答一次<input id="r-'+id+'" autocomplete="off"></label>').join(""):'<p class="ok">這次沒有錯題。</p>'}
$("submitTest").onclick=()=>{const r=getResponses();if(Object.values(r).some(v=>String(v).trim()==="")){$("submitStatus").textContent="請完成全部 10 題。";return}const {score,wrong}=scoreResponses(r),weak=wrong.length?weakType(wrong):"none";latest={id:"IELTS-LMINI2-"+Date.now(),student:$("student").value.trim(),email:$("email").value.trim(),date:$("date").value,mode:$("mode").value,plays:{...plays},responses:r,score,accuracy:score*10,bandEstimate:bandEstimate(score),wrong,weakness:weak==="none"?"無":weakLabel(weak),createdAt:new Date().toISOString()};state.attempts.unshift(latest);localStorage.setItem(KEY,JSON.stringify(state));$("submitStatus").textContent="已送出並完成判分。";$("summary").innerHTML='<div class="grid"><div class="metric"><b>'+score+'/10</b><br>分數</div><div class="metric"><b>'+score*10+'%</b><br>正確率</div><div class="metric"><b>'+latest.bandEstimate+'</b><br>Mini Band 參考</div><div class="metric"><b>'+latest.weakness+'</b><br>優先弱點</div></div>';$("analysis").innerHTML='<div class="analysisBox"><b>Gary 診斷：</b>Mini Test 2 主要驗證社會情境獨白與多人學術討論。下一步先修「'+latest.weakness+'」，再把兩份 Mini Test 的錯題一起帶進完整 Listening Mock。</div>';renderReview(r,wrong);renderRetry(wrong)};
$("submitRetry").onclick=()=>{if(!latest){$("retryStatus").textContent="請先完成 Mini Test 2。";return}if(!retryItems.length){$("retryStatus").textContent="沒有錯題需要重練。";return}let ok=0;for(const id of retryItems){const el=$("r-"+id);if(!el||!el.value.trim()){$("retryStatus").textContent="請完成所有錯題。";return}if(correct(id,el.value))ok++}latest.retryScore=Math.round(ok/retryItems.length*100);localStorage.setItem(KEY,JSON.stringify(state));$("retryStatus").textContent="錯題重練正確率："+latest.retryScore+"%"};
function payload(){return{site_version:"IELTS Listening Mini Test 2 MVP V1",exported_at:new Date().toISOString(),latest_attempt:latest||state.attempts[0]||null,attempts:state.attempts}}
$("download").onclick=()=>{const p=payload(),u=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download="ielts-listening-mini-2-"+Date.now()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};$("print").onclick=()=>window.print();
$("sendCoach").onclick=()=>{
 const p=payload(),a=p.latest_attempt;
 if(!a){$("deliveryStatus").textContent="請先完成測驗並取得結果。";return}
 if(!a.email||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(a.email)){$("deliveryStatus").textContent="請填寫可接收結果的有效 Email。";return}
 const submissionId="IELTS-LMINI2-"+Date.now();
 const wrongDetails=(a.wrong||[]).map(id=>({
   question:id.toUpperCase(),
   student_answer:a.responses?.[id]??"",
   correct_answer:answers[id]?.a??"",
   explanation:answers[id]?.why??""
 }));
 const itemResults=Object.keys(answers).map(id=>({
   question:id.toUpperCase(),
   student_answer:a.responses?.[id]??"",
   correct_answer:answers[id].a,
   correct:correct(id,a.responses?.[id]??""),
   type:answers[id].type,
   explanation:answers[id].why
 }));
 const fullDelivery={
   submission_id:submissionId,
   submitted_at:new Date().toISOString(),
   assessment:"IELTS Listening Mini Test 2｜原創Part 2+3正式交付",
   source_page:location.href,
   student_name:a.student||"IELTS Student",
   student_email:a.email,
   test_date:a.date||"",
   mode:a.mode,
   score:a.score,
   total_questions:10,
   accuracy:a.accuracy,
   mini_band_reference:a.bandEstimate,
   primary_weakness:a.weakness,
   play_counts:a.plays,
   wrong_questions:a.wrong||[],
   wrong_details:wrongDetails,
   retry_score:a.retryScore??null,
   item_results:itemResults,
   attempt:a
 };
 const body={
   submission_id:submissionId,
   submitted_at:fullDelivery.submitted_at,
   assessment_type:"IELTS Listening Mini Test 2｜原創Part 2+3正式交付",
   source_page:location.href,
   student_name:fullDelivery.student_name,
   email:a.email,
   current_score:a.score+"/10",
   target_score:"IELTS Listening 7.0",
   total_score:a.score+"/10",
   accuracy:a.accuracy+"%",
   primary_weakness:a.weakness,
   secondary_weakness:(a.wrong||[]).slice(0,2).join(", "),
   summary:[
     "IELTS Listening Mini Test 2",
     "Submission ID："+submissionId,
     "模式："+a.mode,
     "分數："+a.score+"/10",
     "正確率："+a.accuracy+"%",
     "Mini Band 參考："+a.bandEstimate,
     "優先弱點："+a.weakness,
     "播放次數："+Object.entries(a.plays||{}).map(([k,v])=>"Part "+k+" "+v+" 次").join("；"),
     "錯題："+((a.wrong||[]).map(x=>x.toUpperCase()).join(", ")||"無"),
     "錯題重練："+(a.retryScore==null?"尚未":a.retryScore+"%")
   ].join("\n"),
   responses_json:JSON.stringify(fullDelivery)
 };
 try{
   localStorage.setItem("ielts_listening_delivery_last_v1",JSON.stringify({
     submission_id:submissionId,
     assessment:"IELTS Listening Mini Test 2",
     created_at:body.submitted_at,
     status:"submitted_to_gateway",
     score:a.score,
     email:a.email
   }));
 }catch{}
 $("deliveryStatus").textContent="正在寄送完整模考資料給 Gary 教練。Submission ID："+submissionId+"。需以 Gmail 實收確認才算正式完成。";
 const form=document.createElement("form");
 form.method="POST";form.action=DELIVERY_URL;form.target="_self";form.style.display="none";
 Object.entries(body).forEach(([k,v])=>{const i=document.createElement("input");i.type="hidden";i.name=k;i.value=String(v??"");form.appendChild(i)});
 document.body.appendChild(form);form.submit()
};
})();