import express from "express";
import cors from "cors";
import pg from "pg";
import crypto from "crypto";

const { Pool } = pg;
const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false }
});
const allowedOrigins = new Set([
  "https://gary-learning-hub.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:5500"
]);
app.use(cors({
  origin(origin, cb){
    if(!origin || allowedOrigins.has(origin)) return cb(null,true);
    return cb(new Error("Origin not allowed"));
  }
}));
app.use(express.json({limit:"2mb"}));

async function init(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tpass_submissions (
      submission_id UUID PRIMARY KEY,
      source_page TEXT NOT NULL,
      assessment_type TEXT NOT NULL,
      student_name TEXT,
      student_email TEXT,
      current_score TEXT,
      target_score TEXT,
      summary JSONB NOT NULL DEFAULT '{}'::jsonb,
      responses JSONB NOT NULL DEFAULT '[]'::jsonb,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      email_status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_tpass_submissions_email_created ON tpass_submissions(student_email, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_tpass_submissions_type_created ON tpass_submissions(assessment_type, created_at DESC);`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ielts_contact_tickets (
      ticket_id UUID PRIMARY KEY,
      public_token TEXT NOT NULL UNIQUE,
      source_subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      student_name TEXT,
      student_email TEXT,
      message TEXT NOT NULL,
      snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT '待回覆',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      handled_at TIMESTAMPTZ
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ielts_contact_status_created ON ielts_contact_tickets(status, created_at DESC);`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ielts_writing_submissions (
      submission_id TEXT PRIMARY KEY,
      student_name TEXT,
      student_email TEXT,
      task_type TEXT,
      day_number INTEGER,
      question TEXT,
      essay TEXT NOT NULL,
      word_count INTEGER,
      minutes INTEGER,
      self_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
      self_concern TEXT,
      source_page TEXT,
      email_status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ielts_writing_email_created ON ielts_writing_submissions(student_email, created_at DESC);`);
}
let dbReady=false;
if(process.env.DATABASE_URL){
  try{await init();dbReady=true;}catch(err){console.error("Database init failed",err);}
}
app.get("/health",(req,res)=>res.json({ok:true,database:dbReady?"ready":"not_configured"}));

app.post("/api/submissions", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  try{
    const b=req.body||{};
    if(!b.assessment_type || !b.source_page){
      return res.status(400).json({ok:false,error:"assessment_type and source_page are required"});
    }
    const submissionId=crypto.randomUUID();
    const responses=Array.isArray(b.responses)?b.responses:[];
    const summary=(b.summary && typeof b.summary==="object")?b.summary:{};
    await pool.query(`
      INSERT INTO tpass_submissions
      (submission_id,source_page,assessment_type,student_name,student_email,current_score,target_score,summary,responses,raw_payload)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb)
    `,[
      submissionId,
      String(b.source_page),
      String(b.assessment_type),
      b.student_name?String(b.student_name):null,
      b.student_email?String(b.student_email):null,
      b.current_score!=null?String(b.current_score):null,
      b.target_score!=null?String(b.target_score):null,
      JSON.stringify(summary),
      JSON.stringify(responses),
      JSON.stringify(b)
    ]);
    res.status(201).json({ok:true,submission_id:submissionId,stored_at:new Date().toISOString()});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false,error:"database_write_failed"});
  }
});

app.patch("/api/submissions/:id/email-status", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  try{
    const status=String(req.body?.status||"").slice(0,40);
    if(!status)return res.status(400).json({ok:false,error:"status required"});
    const r=await pool.query("UPDATE tpass_submissions SET email_status=$1 WHERE submission_id=$2 RETURNING submission_id,email_status",[status,req.params.id]);
    if(!r.rowCount)return res.status(404).json({ok:false,error:"not found"});
    res.json({ok:true,...r.rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false,error:"update_failed"});
  }
});

app.post("/api/ielts-writing-submit", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,stored:false,emailAccepted:false,error:"database_not_configured"});
  try{
    const b=req.body||{};
    if(!b.submission_id || !b.essay)return res.status(400).json({ok:false,stored:false,emailAccepted:false,error:"submission_id and essay are required"});
    const checks=Array.isArray(b.self_checks)?b.self_checks:[];
    await pool.query(`
      INSERT INTO ielts_writing_submissions
      (submission_id,student_name,student_email,task_type,day_number,question,essay,word_count,minutes,self_checks,self_concern,source_page,email_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,'pending')
      ON CONFLICT (submission_id) DO UPDATE SET
        student_name=EXCLUDED.student_name,
        student_email=EXCLUDED.student_email,
        task_type=EXCLUDED.task_type,
        day_number=EXCLUDED.day_number,
        question=EXCLUDED.question,
        essay=EXCLUDED.essay,
        word_count=EXCLUDED.word_count,
        minutes=EXCLUDED.minutes,
        self_checks=EXCLUDED.self_checks,
        self_concern=EXCLUDED.self_concern,
        source_page=EXCLUDED.source_page
    `,[
      String(b.submission_id),
      b.student_name?String(b.student_name):null,
      b.student_email?String(b.student_email):null,
      b.task_type?String(b.task_type):null,
      Number.isFinite(Number(b.day_number))?Number(b.day_number):null,
      b.question?String(b.question):null,
      String(b.essay),
      Number.isFinite(Number(b.word_count))?Number(b.word_count):null,
      Number.isFinite(Number(b.minutes))?Number(b.minutes):null,
      JSON.stringify(checks),
      b.self_concern?String(b.self_concern):null,
      b.source_page?String(b.source_page):null
    ]);

    const form=new URLSearchParams();
    form.set("_subject", "[Sylvia IELTS][Writing]["+(b.task_type||"Assignment")+"] "+String(b.submission_id));
    form.set("_template","table");
    form.set("_captcha","false");
    form.set("form_type","Sylvia IELTS Writing Submission");
    form.set("submission_id",String(b.submission_id));
    form.set("source_page",String(b.source_page||""));
    form.set("name",String(b.student_name||"Sylvia"));
    form.set("email",String(b.student_email||""));
    form.set("test_message",String(b.preformatted_message||b.essay||""));

    let emailAccepted=false;
    let emailStatus=0;
    let emailError=null;
    for(let attempt=1;attempt<=2 && !emailAccepted;attempt++){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      try{
        const r=await fetch("https://formsubmit.co/43c5627bc898e872509ffd1b6aa8d728",{
          method:"POST",
          headers:{
            "Content-Type":"application/x-www-form-urlencoded",
            "Accept":"text/html",
            "Origin":"https://gary-learning-hub.onrender.com",
            "Referer":"https://gary-learning-hub.onrender.com/sylvia-ielts-submit/"
          },
          body:form.toString(),
          redirect:"manual",
          signal:controller.signal
        });
        emailStatus=r.status;
        emailAccepted=r.status>=200 && r.status<400;
        if(!emailAccepted)emailError="formsubmit_http_"+r.status;
      }catch(err){
        emailError=err?.name==="AbortError"?"formsubmit_timeout":String(err?.message||err);
      }finally{clearTimeout(timer)}
      if(!emailAccepted && attempt<2) await new Promise(resolve=>setTimeout(resolve,700));
    }

    await pool.query(
      "UPDATE ielts_writing_submissions SET email_status=$1 WHERE submission_id=$2",
      [emailAccepted?"formsubmit_accepted":"formsubmit_failed",String(b.submission_id)]
    );

    return res.status(emailAccepted?201:202).json({
      ok:true,
      stored:true,
      emailAccepted,
      emailStatus,
      emailError,
      submission_id:String(b.submission_id),
      stored_at:new Date().toISOString()
    });
  }catch(err){
    console.error("IELTS writing submit failed",err);
    return res.status(500).json({ok:false,stored:false,emailAccepted:false,error:"ielts_writing_submit_failed"});
  }
});

app.post("/api/ielts-writing-submissions", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  try{
    const b=req.body||{};
    if(!b.submission_id || !b.essay)return res.status(400).json({ok:false,error:"submission_id and essay are required"});
    await pool.query(`
      INSERT INTO ielts_writing_submissions
      (submission_id,student_name,student_email,task_type,day_number,question,essay,word_count,minutes,self_checks,self_concern,source_page)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)
      ON CONFLICT (submission_id) DO UPDATE SET
        student_name=EXCLUDED.student_name,
        student_email=EXCLUDED.student_email,
        task_type=EXCLUDED.task_type,
        day_number=EXCLUDED.day_number,
        question=EXCLUDED.question,
        essay=EXCLUDED.essay,
        word_count=EXCLUDED.word_count,
        minutes=EXCLUDED.minutes,
        self_checks=EXCLUDED.self_checks,
        self_concern=EXCLUDED.self_concern,
        source_page=EXCLUDED.source_page
    `,[
      String(b.submission_id),
      b.student_name?String(b.student_name):null,
      b.student_email?String(b.student_email):null,
      b.task_type?String(b.task_type):null,
      Number.isFinite(Number(b.day_number))?Number(b.day_number):null,
      b.question?String(b.question):null,
      String(b.essay),
      Number.isFinite(Number(b.word_count))?Number(b.word_count):null,
      Number.isFinite(Number(b.minutes))?Number(b.minutes):null,
      JSON.stringify(Array.isArray(b.self_checks)?b.self_checks:[]),
      b.self_concern?String(b.self_concern):null,
      b.source_page?String(b.source_page):null
    ]);
    res.status(201).json({ok:true,submission_id:String(b.submission_id),stored_at:new Date().toISOString()});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false,error:"ielts_writing_store_failed"});
  }
});

app.patch("/api/ielts-writing-submissions/:id/email-status", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  try{
    const status=String(req.body?.status||"").slice(0,40);
    if(!status)return res.status(400).json({ok:false,error:"status required"});
    const r=await pool.query("UPDATE ielts_writing_submissions SET email_status=$1 WHERE submission_id=$2 RETURNING submission_id,email_status",[status,req.params.id]);
    if(!r.rowCount)return res.status(404).json({ok:false,error:"not_found"});
    res.json({ok:true,...r.rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false,error:"update_failed"});
  }
});

app.get("/api/ielts-writing-submissions", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  if(!process.env.ADMIN_TOKEN || req.headers.authorization!==`Bearer ${process.env.ADMIN_TOKEN}`){
    return res.status(401).json({ok:false,error:"unauthorized"});
  }
  const limit=Math.min(Math.max(Number(req.query.limit)||100,1),200);
  const r=await pool.query(`
    SELECT submission_id,student_name,student_email,task_type,day_number,question,essay,word_count,minutes,self_checks,self_concern,source_page,email_status,created_at
    FROM ielts_writing_submissions ORDER BY created_at DESC LIMIT $1
  `,[limit]);
  res.json({ok:true,items:r.rows});
});

app.post("/api/ielts-contact-tickets", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  try{
    const b=req.body||{};
    if(!b.topic || !b.message)return res.status(400).json({ok:false,error:"topic and message are required"});
    const ticketId=crypto.randomUUID();
    const publicToken=crypto.randomBytes(24).toString("hex");
    const snapshot=(b.snapshot && typeof b.snapshot==="object")?b.snapshot:{};
    await pool.query(`
      INSERT INTO ielts_contact_tickets
      (ticket_id,public_token,source_subject,topic,student_name,student_email,message,snapshot)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    `,[
      ticketId, publicToken, String(b.source_subject||"General"), String(b.topic),
      b.student_name?String(b.student_name):null,
      b.student_email?String(b.student_email):null,
      String(b.message), JSON.stringify(snapshot)
    ]);
    res.status(201).json({ok:true,ticket_id:ticketId,public_token:publicToken,status:"待回覆",created_at:new Date().toISOString()});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false,error:"ticket_create_failed"});
  }
});

app.post("/api/ielts-contact-tickets/statuses", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  try{
    const tickets=Array.isArray(req.body?.tickets)?req.body.tickets.slice(0,50):[];
    const items=[];
    for(const t of tickets){
      if(!t?.ticket_id || !t?.public_token)continue;
      const r=await pool.query(`
        SELECT ticket_id,source_subject,topic,status,created_at,updated_at,handled_at
        FROM ielts_contact_tickets WHERE ticket_id=$1 AND public_token=$2
      `,[String(t.ticket_id),String(t.public_token)]);
      if(r.rowCount)items.push(r.rows[0]);
    }
    res.json({ok:true,items});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false,error:"ticket_status_lookup_failed"});
  }
});

app.get("/api/ielts-contact-tickets", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  if(!process.env.ADMIN_TOKEN || req.headers.authorization!==`Bearer ${process.env.ADMIN_TOKEN}`){
    return res.status(401).json({ok:false,error:"unauthorized"});
  }
  const limit=Math.min(Math.max(Number(req.query.limit)||100,1),200);
  const r=await pool.query(`
    SELECT ticket_id,source_subject,topic,student_name,student_email,message,snapshot,status,created_at,updated_at,handled_at
    FROM ielts_contact_tickets ORDER BY created_at DESC LIMIT $1
  `,[limit]);
  res.json({ok:true,items:r.rows});
});

app.patch("/api/ielts-contact-tickets/:id/status", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  if(!process.env.ADMIN_TOKEN || req.headers.authorization!==`Bearer ${process.env.ADMIN_TOKEN}`){
    return res.status(401).json({ok:false,error:"unauthorized"});
  }
  const status=String(req.body?.status||"");
  if(!["待回覆","已處理"].includes(status))return res.status(400).json({ok:false,error:"invalid_status"});
  const r=await pool.query(`
    UPDATE ielts_contact_tickets
    SET status=$1, updated_at=NOW(), handled_at=CASE WHEN $1='已處理' THEN NOW() ELSE NULL END
    WHERE ticket_id=$2
    RETURNING ticket_id,status,updated_at,handled_at
  `,[status,req.params.id]);
  if(!r.rowCount)return res.status(404).json({ok:false,error:"not_found"});
  res.json({ok:true,...r.rows[0]});
});

app.get("/api/submissions", async (req,res)=>{
  if(!dbReady)return res.status(503).json({ok:false,error:"database_not_configured"});
  if(!process.env.ADMIN_TOKEN || req.headers.authorization!==`Bearer ${process.env.ADMIN_TOKEN}`){
    return res.status(401).json({ok:false,error:"unauthorized"});
  }
  const limit=Math.min(Math.max(Number(req.query.limit)||100,1),100);
  const r=await pool.query(`
    SELECT submission_id,source_page,assessment_type,student_name,student_email,current_score,target_score,summary,responses,email_status,created_at
    FROM tpass_submissions ORDER BY created_at DESC LIMIT $1
  `,[limit]);
  res.json({ok:true,items:r.rows});
});

const port=process.env.PORT||10000;
app.listen(port,()=>console.log(`T-PASS Results API listening on ${port}`));
