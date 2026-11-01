window.SPEAKING_DATA={
dimensions:{
start:{label:"啟動速度",tip:"固定練「先說第一句」：不用完整，3 秒內先說出主詞＋動詞。"},
extend:{label:"句子延伸",tip:"用 because / for example / so 三個連接點，把一句延伸成三句。"},
base:{label:"語言基礎",tip:"先用熟悉字彙與簡單句，不追求高難度字；把正確率放在複雜度前面。"},
tolerance:{label:"容錯信心",tip:"刻意允許小錯誤不中斷，完成整段後再修正，不在句中自我打斷。"},
response:{label:"實戰應對",tip:"用「直接回答 → 理由 → 例子」三步，處理臨時問題。"}
},
questions:[
["start","臨時被點名用英文回答時，我通常能在 3 秒內開始第一句。"],
["start","即使還沒想完整，我也能先用簡單英文開始。"],
["start","我不會因為第一句不完美就完全停住。"],
["extend","我能把一個短答案延伸到至少 3 句。"],
["extend","我會自然使用 because / for example / so 來延伸。"],
["extend","我能在沒有稿子的情況下持續說 30 秒左右。"],
["base","我能用熟悉的基本句型表達大部分日常意思。"],
["base","我不會因為想找高級單字而長時間停頓。"],
["base","我能用另一種簡單說法替代想不起來的字。"],
["tolerance","說錯一個字時，我可以繼續說而不是立刻停下。"],
["tolerance","我能接受口說時有小文法錯誤。"],
["tolerance","我比較在意把意思說完，而不是每句都零錯誤。"],
["response","遇到沒準備過的問題，我知道如何先直接回答。"],
["response","我能補一個理由或例子，不只回答 Yes / No。"],
["response","對方聽不懂時，我能換句話再說一次。"]
],
prompts:[
{cat:"日常",q:"Tell me about your morning routine.",zh:"說說你的早晨日常。",frame:"I usually… / Because… / For example…",model:"I usually start my day with coffee and a short walk. It helps me wake up and plan my day.",modelZh:"我通常用咖啡和短暫散步開始一天。這幫助我清醒並規劃一天。"},
{cat:"工作",q:"What is one thing you are working on now?",zh:"你現在正在做的一件事是什麼？",frame:"Right now, I'm working on… / The goal is…",model:"Right now, I'm working on a new learning website. The goal is to make practice easier and more consistent.",modelZh:"我現在正在做一個新的學習網站，目標是讓練習更容易、更穩定。"},
{cat:"觀點",q:"Do you think AI helps people learn English?",zh:"你認為 AI 有助於學英文嗎？",frame:"I think… because… / One example is…",model:"I think AI can help because it gives immediate practice and feedback. One example is using it to rehearse short answers.",modelZh:"我認為 AI 有幫助，因為它能立即提供練習與回饋，例如用來排練短答。"},
{cat:"經驗",q:"Tell me about a recent challenge.",zh:"說說最近遇到的一個挑戰。",frame:"Recently, I had to… / The difficult part was… / I solved it by…",model:"Recently, I had to finish a project quickly. The difficult part was organizing the details, so I broke the work into smaller steps.",modelZh:"最近我必須快速完成一個專案。困難是整理細節，所以我把工作拆成較小步驟。"},
{cat:"社交",q:"How would you introduce yourself to a new colleague?",zh:"你會如何向新同事自我介紹？",frame:"Hi, I'm… / I work on… / It's great to…",model:"Hi, I'm Gary. I work on English learning and education projects. It's great to meet you.",modelZh:"嗨，我是 Gary。我從事英文學習與教育專案。很高興認識你。"}
],
checks:["我有在 3 秒內開始","我有說完整意思","我有至少一個理由或例子","我沒有因小錯誤中斷"]
};