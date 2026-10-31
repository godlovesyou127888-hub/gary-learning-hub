const SPREADSHEET_ID = '1iUxZ9N3gjxkkw-bPeIbX3FOYMTrpk0kMxIMYRPslezU';
const SHEET_NAME = 'Submissions';
const COACH_EMAIL = 'godlovesyou127888@gmail.com';

function doPost(e) {
  const p = (e && e.parameter) || {};
  const submissionId = p.submission_id || Utilities.getUuid();
  const submittedAt = p.submitted_at || new Date().toISOString();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  let sheet;
  let rowNumber;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Missing sheet: ' + SHEET_NAME);

    sheet.appendRow([
      submissionId,
      submittedAt,
      p.assessment_type || '',
      p.source_page || '',
      p.student_name || '',
      p.email || '',
      p.current_score || '',
      p.target_score || '',
      p.total_score || '',
      p.accuracy || '',
      p.primary_weakness || '',
      p.secondary_weakness || '',
      p.summary || '',
      p.responses_json || '',
      'pending',
      '',
      ''
    ]);
    rowNumber = sheet.getLastRow();
  } finally {
    lock.releaseLock();
  }

  let emailStatus = 'sent';
  let emailSentAt = new Date().toISOString();
  let emailError = '';

  try {
    const subject = '[T-PASS] ' + (p.assessment_type || 'Assessment') + '｜' + (p.student_name || 'Student') + '｜' + submissionId;
    const body = buildEmailBody_(p, submissionId, submittedAt);

    MailApp.sendEmail({
      to: COACH_EMAIL,
      subject: subject,
      body: body
    });

    if (p.email && p.email !== COACH_EMAIL) {
      MailApp.sendEmail({
        to: p.email,
        subject: '你的 ' + (p.assessment_type || 'T-PASS') + ' 結果副本',
        body: body
      });
    }
  } catch (err) {
    emailStatus = 'failed';
    emailSentAt = '';
    emailError = String(err && err.message ? err.message : err);
  }

  if (sheet && rowNumber) {
    sheet.getRange(rowNumber, 15, 1, 3).setValues([[emailStatus, emailSentAt, emailError]]);
  }

  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>已收到結果</title></head><body style="font-family:Arial,\'Noto Sans TC\',sans-serif;max-width:760px;margin:40px auto;padding:20px;line-height:1.7">' +
    '<h2>結果已先保存到 T-PASS 診斷紀錄總表</h2>' +
    '<p><b>Submission ID：</b>' + escapeHtml_(submissionId) + '</p>' +
    '<p><b>Email 狀態：</b>' + escapeHtml_(emailStatus) + '</p>' +
    '<p>即使 Email 失敗，這次提交資料仍已保存。</p>' +
    '<p><a href="https://gary-learning-hub.onrender.com/tpass-toeic-command-center/">回 T-PASS Command Center</a></p>' +
    '</body></html>'
  );
}

function buildEmailBody_(p, submissionId, submittedAt) {
  return [
    'Submission ID：' + submissionId,
    'Submitted At：' + submittedAt,
    'Assessment：' + (p.assessment_type || ''),
    'Source：' + (p.source_page || ''),
    '學員：' + (p.student_name || ''),
    'Email：' + (p.email || ''),
    '目前分數：' + (p.current_score || ''),
    '目標分數：' + (p.target_score || ''),
    '總分：' + (p.total_score || ''),
    '正確率：' + (p.accuracy || ''),
    '主要弱點：' + (p.primary_weakness || ''),
    '次要弱點：' + (p.secondary_weakness || ''),
    '',
    '摘要：',
    p.summary || '',
    '',
    '完整逐題紀錄 JSON：',
    p.responses_json || ''
  ].join('\n');
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
