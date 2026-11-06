(()=>{"use strict";
const KEY="ielts_mock_test_lab_v1",DELIVERY_URL="https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec",$=id=>document.getElementById(id);
let state={mocks:[]};try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");state={mocks:Array.isArray(x.mocks)?x.mocks:[]}}catch{}
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));$("mockDate").value=new Date().toISOString().slice(0,10);
$("loadE2E").onclick=()=>{
 $("student").value="Gary E2E Test";
 $("email").value="godlovesyou127888@gmail.com";
 $("mockName").value="IELTS Mock E2E Verification";
 $("mockDate").value=new Date().toISOString().slice(0,10);
 $("listening").value="7.0";
 $("reading").value="6.5";
 $("writing").value="6.0";
 $("speaking").value="6.5";
 $("listeningRaw").value="30";
 $("readingRaw").value="28";
 $("lError").value="定位";
 $("rError").value="同义替换";
 $("wError").value="Task Response";
 $("sError").value="Fluency & Coherence";
 $("note").value="E2E 验收测试：预期 Overall 6.5，最低科目 Writing 6.0。";
 $("saveStatus").textContent="E2E 测试资料已载入：请按「储存这次模考」，再按「寄送完整结果给 Gary 教练」。";
};
function roundBand(x){const n=Math.round(x*4)/4;const frac=n%1;if(frac===0.25)return Math.floor(n)+0.5;if(frac===0.75)return Math.ceil(n);return n}
function validBand(v){const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=9&&Math.abs(n*2-Math.round(n*2))<1e-9}
function collect(){return{student:$("student").value.trim(),email:$("email").value.trim(),mockName:$("mockName").value.trim(),mockDate:$("mockDate").value,bands:{Listening:Number($("listening").value),Reading:Number($("reading").value),Writing:Number($("writing").value),Speaking:Number($("speaking").value)},raw:{Listening:$("listeningRaw").value===""?null:Number($("listeningRaw").value),Reading:$("readingRaw").value===""?null:Number($("readingRaw").value)},errors:{Listening:$("lError").value,Reading:$("rError").value,Writing:$("wError").value,Speaking:$("sError").value},note:$("note").value.trim()}}
function computeOverall(b){return roundBand((b.Listening+b.Reading+b.Writing+b.Speaking)/4)}
function weakest(b){return Object.entries(b).sort((a,b)=>a[1]-b[1])[0]}
const links={Listening:"/ielts-listening-accent-lab/",Reading:"/ielts-reading-speed-lab/",Writing:"/sylvia-ielts-30day/",Speaking:"/sylvia-ielts-speaking/"};
$("saveMock").onclick=()=>{const p=collect();if(!Object.values(p.bands).every(validBand)){$("saveStatus").textContent="请填写 0–9、每 0.5 一格的四科 Band。";return}const overall=computeOverall(p.bands),weak=weakest(p.bands);state.mocks.unshift({...p,id:"IELTS-MOCK-"+Date.now(),overall,weakestSkill:weak[0],weakestBand:weak[1],createdAt:new Date().toISOString()});save();$("saveStatus").textContent="模考已储存。";render()};
function deltaHtml(now,prev){const d=Number((now-prev).toFixed(1));if(d===0)return "持平";return `<span class="${d>0?"deltaUp":"deltaDown"}">${d>0?"+":""}${d}</span>`}
function render(){const a=state.mocks[0],p=state.mocks[1];if(!a){$("summary").innerHTML='<p class="note">尚无模考纪录。</p>';$("comparison").innerHTML="";$("history").innerHTML="尚无纪录。";$("eligibilityBox").innerHTML='完成并储存一次四科 Mock 后，系统会自动判定资格并带入你的成绩。';return}
$("summary").innerHTML=`<div class="grid"><div class="metric"><span>Overall Band</span><br><b class="band">${a.overall.toFixed(1)}</b></div><div class="metric"><span>最低科目</span><br><b>${a.weakestSkill} ${a.weakestBand.toFixed(1)}</b></div><div class="metric"><span>Listening / Reading</span><br><b>${a.bands.Listening.toFixed(1)} / ${a.bands.Reading.toFixed(1)}</b></div><div class="metric"><span>Writing / Speaking</span><br><b>${a.bands.Writing.toFixed(1)} / ${a.bands.Speaking.toFixed(1)}</b></div></div>`;
$("comparison").innerHTML=p?`<div class="card"><h3>与上次比较</h3><p>Overall：${deltaHtml(a.overall,p.overall)}　Listening：${deltaHtml(a.bands.Listening,p.bands.Listening)}　Reading：${deltaHtml(a.bands.Reading,p.bands.Reading)}　Writing：${deltaHtml(a.bands.Writing,p.bands.Writing)}　Speaking：${deltaHtml(a.bands.Speaking,p.bands.Speaking)}</p></div>`:'<p class="note">完成第二次模考后会显示前后变化。</p>';
$("nextAction").innerHTML=`<b>目前唯一优先：${a.weakestSkill}</b><br>Band ${a.weakestBand.toFixed(1)}｜主要错误：${a.errors[a.weakestSkill]}<br><br><a class="btn" href="${links[a.weakestSkill]}">进入 ${a.weakestSkill} 专项训练</a><br><span class="note">完成专项训练后，再做下一次模考验证，不平均分配时间。</span>`;
const handoff={student:a.student||$("student").value.trim(),email:a.email||$("email").value.trim(),overall:a.overall,bands:a.bands,weakestSkill:a.weakestSkill,weakestBand:a.weakestBand,weakestError:a.errors[a.weakestSkill],mockName:a.mockName||"",mockDate:a.mockDate||""};
localStorage.setItem("ielts_free_consultation_handoff_v1",JSON.stringify(handoff));
const used=localStorage.getItem("ielts_free_consultation_used_v1")==="1";
$("eligibilityBox").innerHTML=used
? '<b>你已使用／送出過免費一次策略諮詢申請。</b><br><span class="note">後續請使用付費一對一教練校準。</span><br><br><a class="btn" href="/ielts-command-center/#paid-coaching">查看後續教練校準</a>'
: `<b>你符合免費一次 Gary 一對一策略諮詢申請資格。</b><br>Overall ${a.overall.toFixed(1)}｜L ${a.bands.Listening.toFixed(1)} · R ${a.bands.Reading.toFixed(1)} · W ${a.bands.Writing.toFixed(1)} · S ${a.bands.Speaking.toFixed(1)}<br>目前最低：${a.weakestSkill} ${a.weakestBand.toFixed(1)}｜主要錯誤：${a.errors[a.weakestSkill]}<br><br><a class="btn" href="/ielts-command-center/?from=mock#free-consultation">一鍵帶入成績，免費申請一次</a><br><span class="note">每位學員限免費申請一次；時段與名額仍需確認。</span>`;
$("history").innerHTML=state.mocks.map(x=>`<div class="historyItem"><b>${x.mockDate||""}｜${x.mockName||"Mock"}｜Overall ${x.overall.toFixed(1)}</b><br><span class="note">L ${x.bands.Listening.toFixed(1)} · R ${x.bands.Reading.toFixed(1)} · W ${x.bands.Writing.toFixed(1)} · S ${x.bands.Speaking.toFixed(1)}｜最低：${x.weakestSkill}</span></div>`).join("")}
render();
function payload(){return{site_version:"IELTS Mock Test Lab MVP V1",exported_at:new Date().toISOString(),student:$("student").value.trim(),email:$("email").value.trim(),mocks:state.mocks,latest_mock:state.mocks[0]||null}}
$("download").onclick=()=>{const p=payload(),u=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download="ielts-mock-test-"+Date.now()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};$("print").onclick=()=>window.print();
$("sendCoach").onclick=()=>{const p=payload(),a=p.latest_mock;if(!a){$("deliveryStatus").textContent="请先储存至少一次模考。";return}if(!p.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)){$("deliveryStatus").textContent="Email 格式不正确。";return}const body={submission_id:"IELTS-MOCK-"+Date.now(),submitted_at:new Date().toISOString(),assessment_type:"IELTS Mock Test Lab｜四科模考验证",source_page:location.href,student_name:p.student||"IELTS Student",email:p.email,current_score:a.overall+"/9",target_score:"IELTS 7.0",total_score:a.overall+"/9",accuracy:"",primary_weakness:a.weakestSkill+"｜"+a.errors[a.weakestSkill],secondary_weakness:"",summary:["IELTS Mock Test Lab","Overall："+a.overall.toFixed(1),"Listening："+a.bands.Listening.toFixed(1),"Reading："+a.bands.Reading.toFixed(1),"Writing："+a.bands.Writing.toFixed(1),"Speaking："+a.bands.Speaking.toFixed(1),"最低科目："+a.weakestSkill,"主要错误："+a.errors[a.weakestSkill]].join("\n"),responses_json:JSON.stringify(p)};$("deliveryStatus").textContent="已提交至 Google Apps Script；請查看新分頁的提交結果。只有 Gary 的 Gmail／Sheets 實際收件才算完成。";const form=document.createElement("form");form.method="POST";form.action=DELIVERY_URL;form.target="_blank";form.style.display="none";Object.entries(body).forEach(([k,v])=>{const i=document.createElement("input");i.type="hidden";i.name=k;i.value=String(v??"");form.appendChild(i)});document.body.appendChild(form);form.submit()};
})();