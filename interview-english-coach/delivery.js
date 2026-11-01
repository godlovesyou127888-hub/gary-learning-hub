(()=>{"use strict";
const DELIVERY_URL='https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec';
const SENT_PREFIX='interview_english_sent_';
const el=id=>document.getElementById(id);
function getState(){
  try{return JSON.parse(localStorage.getItem('interview_english_coach_v1')||'{}')}catch{return {}}
}

function validIdentity(){
  const name=el('student')?.value.trim()||'';
  const email=el('email')?.value.trim()||'';
  return !!name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function weakestDimension(d){
  if(!d?.dims)return '';
  return Object.entries(d.dims)
    .map(([k,v])=>({k,p:v.total?v.right/v.total:0}))
    .sort((a,b)=>a.p-b.p)[0]?.k||'';
}
function summaryText(){
  const s=getState();
  const d=s.diagnosis;
  const p=Array.isArray(s.practices)?s.practices:[];
  const wk=weakestDimension(d);
  const map={understand:'理解題目',structure:'組織內容',evidence:'舉證成果',language:'英文表達'};
  const latest=p[p.length-1];
  return [
    'Interview English Coach MVP V1',
    '診斷分數：'+(d?d.total+'/12':'尚未完成'),
    '主要弱點：'+(map[wk]||'尚未完成診斷'),
    'STAR 演練次數：'+p.length,
    latest?'最新演練題目：'+latest.question:'',
    latest?'最新自評平均：'+latest.average+'/5':'',
    latest?'最新英文回答：'+latest.answer:''
  ].filter(Boolean).join('\n');
}
function payload(){
  const s=getState();
  const d=s.diagnosis;
  const p=Array.isArray(s.practices)?s.practices:[];
  const wk=weakestDimension(d);
  const map={understand:'理解題目',structure:'組織內容',evidence:'舉證成果',language:'英文表達'};
  const submission='INT-'+Date.now();
  return {
    submission_id:submission,
    submitted_at:new Date().toISOString(),
    assessment_type:'Interview English Coach｜英文面試診斷與 STAR 演練',
    source_page:location.href,
    student_name:el('student')?.value.trim()||'',
    email:el('email')?.value.trim()||'',
    current_score:'',
    target_score:'',
    total_score:d?d.total+'/12':'',
    accuracy:d?Math.round(d.total/12*100)+'%':'',
    primary_weakness:map[wk]||'',
    secondary_weakness:'',
    summary:summaryText(),
    responses_json:JSON.stringify({
      diagnosis:d||null,
      practices:p,
      student:el('student')?.value.trim()||'',
      email:el('email')?.value.trim()||''
    })
  };
}
function sentKey(id){return SENT_PREFIX+id}
function prepare(){
  const box=el('delivery'),status=el('deliveryStatus');
  if(!box||!status)return;
  const ready=!!getState().diagnosis;
  box.innerHTML='<b>寄送完整紀錄給 Gary 教練</b>'+
    '<p class="note">寄出內容包含姓名、Email、12 題診斷結果、主要弱點，以及已儲存的 STAR 面試演練。寄送前仍建議先下載 JSON 備份。</p>'+
    '<button id="sendInterviewResult" type="button" '+(ready?'':'disabled')+'>'+(ready?'寄送完整結果給 Gary 教練':'請先完成 12 題診斷')+'</button>'+
    '<p class="note">使用 Google Apps Script → Google Sheet → Gmail 寄送。</p>';
  const btn=el('sendInterviewResult');
  if(!btn||!ready)return;
  btn.onclick=()=>{
    if(!validIdentity()){status.textContent='請先填寫姓名與有效 Email。';return}
    const p=payload();
    if(localStorage.getItem(sentKey(p.submission_id))){status.textContent='這筆 Submission ID 已送出。';return}
    try{localStorage.setItem(sentKey(p.submission_id),new Date().toISOString())}catch{}
    status.textContent='正在送出。下一頁看到 Email 狀態：sent 後，才算寄信完成。';
    const form=document.createElement('form');
    form.method='POST';form.action=DELIVERY_URL;form.target='_self';form.style.display='none';
    Object.entries(p).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input)});
    document.body.appendChild(form);form.submit();
  };
}
window.prepareInterviewDelivery=prepare;
setTimeout(prepare,0);
})();