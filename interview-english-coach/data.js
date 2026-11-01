window.INTERVIEW_DATA={
dimensions:{
understand:{label:"理解題目",tip:"先重述題意，再抓問題真正要你證明的能力。"},
structure:{label:"組織內容",tip:"用 1 句結論＋STAR，避免邊想邊說。"},
evidence:{label:"舉證成果",tip:"把『我負責』改成具體行動與可驗證結果。"},
language:{label:"英文表達",tip:"優先清楚與正確，不追求過度複雜句型。"}
},
questions:[
{d:"understand",q:"面試官問：Tell me about yourself. 你最好的開場方式？",opts:["從出生背景一路講到現在","用現在角色→關鍵經驗→為何適合職缺，控制在60–90秒","直接問面試官想聽什麼"],a:1,why:"自我介紹要服務職缺，不是完整自傳。"},
{d:"understand",q:"What is your biggest weakness? 最好的策略？",opts:["說自己沒有缺點","選真實但可管理的弱點＋改善行動＋目前進展","選一個其實是優點的假弱點"],a:1,why:"重點是自我覺察與改善能力。"},
{d:"understand",q:"Why should we hire you? 面試官真正想知道的是？",opts:["你的薪資期待","你如何用證據連結職缺需求","你有多需要這份工作"],a:1,why:"回答需把你的能力映射到職務成果。"},
{d:"structure",q:"行為題最適合用哪個架構？",opts:["STAR","SWOT","5W1H 全部都講"],a:0,why:"STAR 能控制敘事順序與證據密度。"},
{d:"structure",q:"回答太長時，第一個要刪掉什麼？",opts:["背景細節","結果","你的具體行動"],a:0,why:"背景只要夠理解情境，行動與結果才是核心。"},
{d:"structure",q:"遇到沒準備過的題目，最好的第一步？",opts:["立刻開始講避免沉默","停1–2秒，先定義主旨再回答","說 I don't know"],a:1,why:"短暫停頓比無結構輸出更專業。"},
{d:"evidence",q:"哪一句最有證據力？",opts:["I helped the team a lot.","I was responsible for many tasks.","I redesigned the handoff process and reduced response time by 30%."],a:2,why:"行動＋結果＋數字最容易建立可信度。"},
{d:"evidence",q:"如果沒有精確數字，怎麼辦？",opts:["捏造一個合理數字","完全不談結果","用可核實的前後差異、範圍或具體成果"],a:2,why:"不能捏造；可用質化證據替代。"},
{d:"evidence",q:"回答團隊成果時，怎麼避免只說 we？",opts:["清楚區分 team outcome 與 your action","把全部成果說成自己做的","只談團隊不談自己"],a:0,why:"面試官要知道你個人的貢獻。"},
{d:"language",q:"英文面試最重要的是？",opts:["使用大量高級單字","清楚、具體、可理解","講得越快越像母語者"],a:1,why:"清楚與證據優先於華麗。"},
{d:"language",q:"卡住一個單字時，最佳策略？",opts:["停住直到想起來","換成簡單說法繼續","立刻切回中文"],a:1,why:"paraphrase 是實際溝通能力。"},
{d:"language",q:"哪句更適合表達成果？",opts:["It was good and everyone liked it.","The change improved consistency and reduced rework across the team.","Things became better."],a:1,why:"具體動詞與結果比空泛形容詞更有效。"}
],
prompts:[
{cat:"自我介紹",q:"Tell me about yourself.",zh:"請用現在角色→關鍵經驗→與職缺連結回答。",frame:"Currently, I… Previously, I… What connects these experiences is… That is why I’m interested in…",model:"Currently, I work in a role where I combine client communication with training design. Over the past few years, I have focused on turning complex needs into practical learning solutions. What connects these experiences is my ability to diagnose problems and build clear systems. That is why I am interested in a role where I can contribute both strategically and operationally.",modelZh:"目前我從事結合客戶溝通與訓練設計的工作。過去幾年，我專注於把複雜需求轉成可執行的學習方案。這些經驗共同展現我診斷問題與建立系統的能力，因此我希望投入一個能同時貢獻策略與執行的職位。"},
{cat:"成就",q:"Tell me about an achievement you are proud of.",zh:"挑一個能量化或具體證明價值的成果。",frame:"The situation was… My responsibility was… I decided to… As a result…",model:"One achievement I am proud of was improving a learning workflow that had become difficult to maintain. I mapped the repeated tasks, redesigned the process, and introduced reusable templates. As a result, preparation became faster and the quality became more consistent.",modelZh:"我很自豪的一項成果，是改善一個難以維護的學習流程。我先整理重複工作，再重新設計流程並導入可重複使用的模板，最後讓準備速度更快、品質也更一致。"},
{cat:"挑戰",q:"Tell me about a difficult problem you solved.",zh:"不要只描述困難，要讓 Action 佔回答最多篇幅。",frame:"We were facing… I first… Then I… The outcome was…",model:"We were facing repeated communication errors across several handoffs. I first identified where information was being lost, then created a single checklist and clarified ownership. The result was fewer follow-up questions and a smoother handoff process.",modelZh:"我們當時在多個交接點反覆發生溝通錯誤。我先找出資訊遺失的位置，再建立單一檢查表並釐清責任，最後減少追問並讓交接更順暢。"},
{cat:"衝突",q:"Tell me about a conflict with a colleague.",zh:"重點是如何處理分歧，不是證明誰對誰錯。",frame:"We disagreed about… I wanted to understand… We agreed to… The result was…",model:"A colleague and I disagreed about the priority of a project. Instead of arguing about solutions, I asked us to clarify the goal and constraints first. We then agreed on a smaller test before committing more resources, which helped us move forward without damaging the relationship.",modelZh:"我和同事曾對專案優先順序有不同看法。我沒有直接爭論方案，而是先確認共同目標與限制，再同意先做小型測試，讓團隊能繼續前進，也沒有傷害合作關係。"},
{cat:"失敗",q:"Tell me about a time you failed.",zh:"選一個真實但可承擔的失敗，重點放在校準與改變。",frame:"I made the mistake of… I realized… I changed… Since then…",model:"I once moved too quickly into execution before confirming the success criteria. I realized the team had different definitions of a good outcome. I changed my approach by aligning expectations first and adding a short review checkpoint. Since then, projects have had fewer late-stage revisions.",modelZh:"我曾經在成功標準還沒確認前就太快進入執行，後來發現團隊對好成果的定義不同。我改成先對齊期待，並加入短週期檢查點，之後專案後期的大幅修改明顯減少。"},
{cat:"領導",q:"Tell me about a time you influenced others without authority.",zh:"展現影響力、證據與協作，不要只談職稱。",frame:"I needed others to… I gathered… I proposed… Eventually…",model:"I needed several stakeholders to adopt a new process even though I had no formal authority over them. I gathered examples of the current pain points, proposed a small pilot, and shared the results. Once people saw the improvement, adoption became much easier.",modelZh:"我需要幾位沒有直接向我報告的利害關係人採用新流程。我先整理現有痛點，再提出小型試點並分享結果。當大家看到改善後，採用就變得容易許多。"},
{cat:"動機",q:"Why do you want this role?",zh:"把公司／職缺需求與你的長期能力線連在一起。",frame:"I’m interested in this role because… My experience in… would allow me to… I also want to grow in…",model:"I am interested in this role because it combines problem solving, communication, and cross-functional execution. My experience in diagnosing needs and building practical systems would allow me to contribute quickly, while the role would also let me deepen my experience in a larger organization.",modelZh:"我對這個職位有興趣，是因為它結合問題解決、溝通與跨部門執行。我的診斷需求與建立實務系統經驗能讓我快速貢獻，同時這個角色也能讓我在更大型的組織中深化經驗。"},
{cat:"弱點",q:"What is one weakness you are working on?",zh:"弱點必須真實、可管理，而且已有改善證據。",frame:"One area I’m improving is… I noticed it when… I now… The progress I’ve seen is…",model:"One area I am improving is spending too much time refining early drafts. I noticed that this sometimes delayed feedback. I now define a clear first-draft standard and share earlier versions sooner. This has helped me get input faster without lowering the quality of the final work.",modelZh:"我正在改善的一點，是早期草稿花太多時間精修。我發現這會延後取得回饋，因此現在會先設定第一版完成標準，提早分享。這讓我更快取得意見，同時不影響最終品質。"}
],
rubric:[
{key:"clarity",label:"Clarity 清楚度"},
{key:"relevance",label:"Relevance 對題度"},
{key:"evidence",label:"Evidence 證據力"},
{key:"language",label:"Language 英文表達"},
{key:"confidence",label:"Confidence 穩定度"}
]};