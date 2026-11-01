(()=> {
  const COMMAND_CENTER="/tpass-toeic-command-center/";
  if(location.pathname===COMMAND_CENTER)return;
  if(document.getElementById("toeic-command-center-return"))return;
  const wrap=document.createElement("div");
  wrap.id="toeic-command-center-return";
  wrap.setAttribute("role","navigation");
  wrap.setAttribute("aria-label","TOEIC Command Center");
  wrap.style.cssText="position:fixed;right:16px;bottom:16px;z-index:9999;max-width:calc(100vw - 32px)";
  const a=document.createElement("a");
  a.href=COMMAND_CENTER;
  a.textContent="← 回到 TOEIC Command Center";
  a.style.cssText="display:inline-block;padding:12px 16px;border-radius:999px;background:#173f2d;color:#fff;text-decoration:none;font-weight:800;box-shadow:0 6px 20px rgba(0,0,0,.18);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans TC',sans-serif";
  wrap.appendChild(a);
  document.body.appendChild(wrap);
})();