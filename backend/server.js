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
