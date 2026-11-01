function prepareDelivery(payload){
  const box=document.getElementById('delivery');box.innerHTML='';
  const intro=document.createElement('p');intro.textContent='先下載備份，再選擇寄送方式。表單成功頁僅代表服務接收，實際收件仍需確認。';box.appendChild(intro);
  const bridge=document.createElement('a');bridge.className='button';bridge.href='/tpass-next/form-test/?mode=assessment';bridge.target='_blank';bridge.rel='noopener';bridge.textContent='使用既有表單寄送給 Gary';bridge.onclick=e=>{try{localStorage.setItem('tpass_next_pending_delivery',JSON.stringify(payload));}catch{e.preventDefault();document.getElementById('deliveryStatus').textContent='無法準備寄送資料，請下載 JSON，使用自己的 Email 附件寄出。';}};box.appendChild(bridge);
  const mail=document.createElement('a');mail.className='button secondary';const body=['姓名：'+payload.student_name,'Email：'+payload.email,'測驗：'+payload.assessment_type,'分數：'+payload.total_score+'（'+payload.accuracy+'）','優先複習：'+payload.primary_weakness,...payload.responses_json.map(r=>r.question_id+'｜'+r.question+'｜作答：'+r.student_answer+'｜正解：'+r.correct_answer+'｜'+(r.is_correct?'O':'X')+'｜'+r.skill)];mail.href='mailto:godlovesyou127888@gmail.com?subject='+encodeURIComponent('TOEIC 單字練習結果｜'+payload.student_name)+'&body='+encodeURIComponent(body.join('\n'));mail.textContent='使用自己的 Email 寄送／留存副本';box.appendChild(mail);
  document.getElementById('deliveryStatus').textContent='尚未寄送。本站不會自動寄出郵件；寄件備份或收件確認請於你的 Email 中核對。';
}
if(last)prepareDelivery(last);
