const PEC_DELIVERY_URL='https://script.google.com/macros/s/AKfycbwyb8pphHtOR_oyMu5ICKAYaGZxmWad_3CjX_BchY0PF71tIiuB8KM85utE6Qj27AWK/exec';
const PEC_SENT_PREFIX='presentation_english_sent_';

function deliverySummary(data){
  const dims=Array.isArray(data.dimensions)?data.dimensions.map(x=>x.skill+': '+x.score+'/'+x.total).join(' | '):'';
  const roles=Array.isArray(data.role_responses)?data.role_responses:[];
  return [
    'Presentation English Coach V1.0',
    '診斷層級：'+(data.diagnostic_level||''),
    '五構面：'+dims,
    '主要弱點：'+(data.primary_weakness||''),
    '簡報練習次數：'+roles.length,
    roles.length?'簡報稿摘要：':'',
    ...roles.slice(-5).map((r,i)=>(i+1)+'. ['+(r.skill||'')+'] '+(r.student_answer||''))
  ].filter(Boolean).join('\n');
}

function deliveryPayload(){
  const data=report();
  return {
    submission_id:data.submission_id||'PEC-'+Date.now(),
    submitted_at:data.submitted_at||new Date().toISOString(),
    assessment_type:data.assessment_type||'Presentation English Coach｜英文簡報診斷',
    source_page:location.href,
    student_name:data.student_name||$('student').value.trim(),
    email:data.email||$('email').value.trim(),
    current_score:'',
    target_score:'',
    total_score:data.total_score||'',
    accuracy:data.accuracy||'',
    primary_weakness:data.primary_weakness||'',
    secondary_weakness:'',
    summary:deliverySummary(data),
    responses_json:JSON.stringify({
      quiz_responses:Array.isArray(data.responses_json)?data.responses_json:[],
      dimensions:Array.isArray(data.dimensions)?data.dimensions:[],
      role_responses:Array.isArray(data.role_responses)?data.role_responses:[],
      scoring_note:data.scoring_note||''
    })
  };
}

function sentKey(id){return PEC_SENT_PREFIX+id}

function prepareDelivery(){
  const box=$('delivery'),status=$('deliveryStatus');
  if(!box||!status)return;
  const data=state.last;
  if(!data){
    box.innerHTML='<div class="deliveryBox"><b>寄送完整紀錄</b><p class="note">請先完成 15 題診斷。簡報練習可以之後再補。</p></div>';
    status.textContent='';
    return;
  }
  const already=localStorage.getItem(sentKey(data.submission_id));
  box.innerHTML='<div class="deliveryBox"><b>寄送完整紀錄給自己與 Gary 教練</b><p class="note">會送出姓名、Email、診斷分數、五構面、弱點、逐題紀錄與已儲存的簡報稿。寄送前仍建議先下載 JSON。</p><button id="sendMeetingResult" type="button" '+(already?'disabled':'')+'>'+(already?'這筆結果已送出':'寄送完整結果')+'</button><div class="statusLine">'+(already?'已記錄送出時間：'+already:'使用 Google Apps Script → Google Sheet → Gmail 原生寄送。')+'</div></div>';
  const btn=$('sendMeetingResult');
  if(!btn)return;
  btn.onclick=()=>{
    if(!validIdentity()){status.textContent='請先確認姓名與有效 Email。';return;}
    const p=deliveryPayload();
    if(localStorage.getItem(sentKey(p.submission_id))){status.textContent='這個 Submission ID 已送出；為避免重複信件，本站已阻擋再次送出。';prepareDelivery();return;}
    try{localStorage.setItem(sentKey(p.submission_id),new Date().toISOString());}catch{}
    status.textContent='正在送出。下一頁看到「Email 狀態：sent」後，才算 Apps Script 已完成寄信。';
    const form=document.createElement('form');
    form.method='POST';form.action=PEC_DELIVERY_URL;form.target='_self';form.style.display='none';
    Object.entries(p).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);});
    document.body.appendChild(form);
    form.submit();
  };
}
