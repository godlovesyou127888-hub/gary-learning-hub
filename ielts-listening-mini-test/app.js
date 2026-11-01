(()=>{"use strict";
const $=id=>document.getElementById(id),KEY="ielts_listening_mini_test_v1",DELIVERY_URL="https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec";
$("date").value=new Date().toISOString().slice(0,10);

const scripts={
1:"Good morning, Riverside Arts Centre. How can I help? Hi, I’m calling about the weekend photography course. Certainly. The next course is on Saturday the fourteenth of November. Great. What time does it begin? It starts at nine thirty in the morning and finishes at one. And how much is it? The fee is thirty-five pounds, including materials. Do I need to bring my own camera? No, cameras are provided, but please bring a notebook for the practical session. Fine. Where do we meet? Please come to the main reception ten minutes before the course starts.",
4:"Today I’d like to discuss how urban trees can reduce heat in cities. Their most obvious benefit is shade, which lowers surface temperatures on streets and buildings. Tree roots also help absorb heavy rainfall, so they can reduce pressure on drainage systems after storms. Another advantage is that trees planted near busy roads can reduce some forms of air pollution by trapping particles on leaves. However, planting trees is not automatically effective. A common limitation is poor species selection. Some species cannot tolerate local heat or limited soil space, and they may fail within a few years. For this reason, cities should first map the hottest areas and then choose species that are suitable for each location. This targeted approach is usually more effective than simply planting the tallest trees available."
};

const answers={
q1:{a:"14 november",alt:["november 14","14th november","november 14th"],type:"detail",why:"對話中明確說 next course is on Saturday the fourteenth of November。"},
q2:{a:"9:30",alt:["9.30","nine thirty","9 30","09:30"],type:"detail",why:"開始時間為 nine thirty in the morning。"},
q3:{a:"35",alt:["£35","35 pounds"],type:"detail",why:"費用是 thirty-five pounds。"},
q4:{a:"B",type:"detail",why:"相機由中心提供，但學生需要帶 notebook。"},
q5:{a:"C",type:"detail",why:"集合地點是 main reception。"},
q6:{a:"shade",type:"note",why:"講者說最明顯的好處是 shade，可降低地表溫度。"},
q7:{a:"rainfall",type:"note",why:"樹根可吸收 heavy rainfall。"},
q8:{a:"pollution",type:"note",why:"樹木可降低部分 air pollution。"},
q9:{a:"B",type:"gist",why:"主要限制是 poor species selection。"},
q10:{a:"B",type:"gist",why:"講者建議第一步先 map the hottest areas。"}
};

let state={attempts:[]};try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");if(Array.isArray(x.attempts))state=x}catch{}
let plays={1:0,4:0},latest=null,retryItems=[];

function normalize(s){return String(s||"").trim().toLowerCase().replace(/s+/g," ")}
function correct(id,v){const x=answers[id],n=normalize(v);return n===normalize(x.a)||(x.alt||[]).some(a=>n===normalize(a))}
function speak(part){
 const mode=$("mode").value;
 if(mode==="exam"&&plays[part]>=1){$(part===1?"play1Status":"play4Status").textContent="正式模式：此段已播放一次。";return}
 if(!("speechSynthesis" in window)){$(part===1?"play1Status":"play4Status").textContent="此瀏覽器不支援語音播放。";return}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(scripts[part]);u.lang="en-GB";u.rate=.9;u.pitch=1;
 plays[part]++;const status=$(part===1?"play1Status":"play4Status");status.textContent="播放中… 第 "+plays[part]+" 次";u.onend=()=>status.textContent="播放完成｜已播放 "+plays[part]+" 次";speechSynthesis.speak(u)
}
$("play1").onclick=()=>speak(1);$("play4").onclick=()=>speak(4);

function getResponses(){const r={};for(let i=1;i<=10;i++)r["q"+i]=$("q"+i).value;return r}
function scoreResponses(r){let score=0;const wrong=[];Object.keys(answers).forEach(id=>{if(correct(id,r[id]))score++;else wrong.push(id)});return{score,wrong}}
function bandEstimate(score){if(score>=9)return"7.5–8.0";if(score>=8)return"7.0";if(score>=7)return"6.5";if(score>=6)return"6.0";if(score>=5)return"5.5";return"≤5.0"}
function renderReview(r,wrong){
 $("review").innerHTML=Object.keys(answers).map((id,i)=>{const ok=!wrong.includes(id),x=answers[id];return '<div class="reviewItem"><b>Q'+(i+1)+'｜'+(ok?'<span class="ok">O</span>':'<span class="bad">X</span>')+'</b><br>你的答案：<span class="answer">'+(r[id]||"—")+'</span><br>正解：<span class="answer">'+x.a+'</span><br><span class="note">'+x.why+'</span></div>'}).join("")
}
function renderRetry(wrong){retryItems=wrong;$("retry").innerHTML=wrong.length?wrong.map((id,i)=>'<label>Q'+id.slice(1)+' 再答一次<input id="r-'+id+'" autocomplete="off"></label>').join(""):'<p class="ok">這次沒有錯題。</p>'}
function weakType(wrong){const count={detail:0,note:0,gist:0};wrong.forEach(id=>count[answers[id].type]++);return Object.entries(count).sort((a,b)=>b[1]-a[1])[0][0]}
function weakLabel(t){return t==="detail"?"細節定位／數字資訊":t==="note"?"筆記填空／關鍵字":"主旨與選項辨識"}

$("submitTest").onclick=()=>{
 const r=getResponses();if(Object.values(r).some(v=>String(v).trim()==="")){$("submitStatus").textContent="請完成全部 10 題。";return}
 const {score,wrong}=scoreResponses(r),weak=wrong.length?weakType(wrong):"none";
 latest={id:"IELTS-LMINI-"+Date.now(),student:$("student").value.trim(),email:$("email").value.trim(),date:$("date").value,mode:$("mode").value,plays:{...plays},responses:r,score,accuracy:score*10,bandEstimate:bandEstimate(score),wrong,weakness:weak==="none"?"無":weakLabel(weak),createdAt:new Date().toISOString()};
 state.attempts.unshift(latest);localStorage.setItem(KEY,JSON.stringify(state));
 $("submitStatus").textContent="已送出並完成判分。";
 $("summary").innerHTML='<div class="grid"><div class="metric"><span>分數</span><br><b>'+score+'/10</b></div><div class="metric"><span>正確率</span><br><b>'+score*10+'%</b></div><div class="metric"><span>Mini Band 參考</span><br><b>'+latest.bandEstimate+'</b></div><div class="metric"><span>優先弱點</span><br><b>'+latest.weakness+'</b></div></div>';
 $("analysis").innerHTML='<div class="analysisBox"><b>Gary 診斷：</b>這是 10 題 Mini Test，只適合看方向，不等同正式 IELTS Band。下一步先處理「'+latest.weakness+'」，再用完整 40 題模考驗證。</div>';
 renderReview(r,wrong);renderRetry(wrong)
};

$("submitRetry").onclick=()=>{
 if(!latest){$("retryStatus").textContent="請先完成 Mini Test。";return}
 if(!retryItems.length){$("retryStatus").textContent="沒有錯題需要重練。";return}
 let ok=0;for(const id of retryItems){const el=$("r-"+id);if(!el||!el.value.trim()){$("retryStatus").textContent="請完成所有錯題。";return}if(correct(id,el.value))ok++}
 latest.retryScore=Math.round(ok/retryItems.length*100);localStorage.setItem(KEY,JSON.stringify(state));$("retryStatus").textContent="錯題重練正確率："+latest.retryScore+"%"
};

function payload(){return{site_version:"IELTS Listening Mini Test MVP V1",exported_at:new Date().toISOString(),latest_attempt:latest||state.attempts[0]||null,attempts:state.attempts}}
$("download").onclick=()=>{const p=payload(),u=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download="ielts-listening-mini-"+Date.now()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};
$("print").onclick=()=>window.print();
$("sendCoach").onclick=()=>{
 const p=payload(),a=p.latest_attempt;if(!a){$("deliveryStatus").textContent="請先完成 Mini Test。";return}
 if(a.email&&!/^[^s@]+@[^s@]+.[^s@]+$/.test(a.email)){$("deliveryStatus").textContent="Email 格式不正確。";return}
 const body={submission_id:"IELTS-LMINI-"+Date.now(),submitted_at:new Date().toISOString(),assessment_type:"IELTS Listening Mini Test｜原創10題模考",source_page:location.href,student_name:a.student||"IELTS Student",email:a.email,current_score:a.score+"/10",target_score:"IELTS Listening 7.0",total_score:a.score+"/10",accuracy:a.accuracy+"%",primary_weakness:a.weakness,secondary_weakness:"",summary:["IELTS Listening Mini Test","分數："+a.score+"/10","正確率："+a.accuracy+"%","Mini Band 參考："+a.bandEstimate,"優先弱點："+a.weakness,"Part 1 播放："+a.plays[1]+" 次","Part 4 播放："+a.plays[4]+" 次"].join("\n"),responses_json:JSON.stringify(p)};
 $("deliveryStatus").textContent="正在寄送完整結果給 Gary 教練。看到 Email 狀態：sent 才算完成。";
 const form=document.createElement("form");form.method="POST";form.action=DELIVERY_URL;form.target="_self";form.style.display="none";Object.entries(body).forEach(([k,v])=>{const i=document.createElement("input");i.type="hidden";i.name=k;i.value=String(v??"");form.appendChild(i)});document.body.appendChild(form);form.submit()
};
})();