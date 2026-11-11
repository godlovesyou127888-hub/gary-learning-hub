const byId = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const isExtended = params.get('view') === 'extended';
const coreLessons = lessonData.map((parts, index) => ({
  number: index + 1,
  start: index * 10 + 1,
  end: (index + 1) * 10,
  parts
}));
const lessons = isExtended ? extensionData.map((video, index) => ({
  ...video, number: index + 1, parts: [[video.id]]
})) : coreLessons;
const total = lessons.reduce((count, lesson) => count + lesson.parts.filter(Boolean).length, 0);
const pad = number => String(number).padStart(2, '0');
const range = lesson => pad(lesson.start) + '–' + pad(lesson.end);
const lessonTitle = lesson => lesson.title || ('第 ' + lesson.number + ' 堂');
const partName = (lesson, index) => lesson.parts.length === 1 ? '課程影片' : ['上半段', '下半段'][index];
const videoUrl = id => 'https://www.youtube.com/watch?v=' + id;
const storageKey = isExtended ? 'gary-vocabulary-2016-extended' : 'gary-vocabulary-2016';
let state = { selected: 0, part: 0, done: {}, drafts: {} };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved) state = { ...state, ...saved };
} catch {}

const lessonFromUrl = params.get(isExtended ? 'video' : 'lesson');
const partFromUrl = params.get('part');
let selected = lessons[Number(lessonFromUrl) - 1] ? Number(lessonFromUrl) - 1 : state.selected;
if (!lessons[selected]) selected = 0;
let part = lessonFromUrl ? Number(partFromUrl || 1) - 1 : state.part;
if (!lessons[selected].parts[part]) part = lessons[selected].parts.findIndex(Boolean);

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function showCatalog() {
  const query = byId('search').value.normalize('NFKC').trim().toLowerCase();
  const numeric = /^\d+$/.test(query) ? Number(query) : NaN;
  const box = byId('lessons');
  const matching = lessons.filter(lesson => {
    if (isExtended) return (lesson.title + ' ' + lesson.group).toLowerCase().includes(query);
    const text = '第 ' + lesson.number + ' 堂 第' + lesson.number + '堂 ' + range(lesson);
    return !query || text.includes(query.replace(/-/g, '–')) || numeric === lesson.number ||
      (numeric >= lesson.start && numeric <= lesson.end);
  });
  box.replaceChildren();
  let group;
  for (const lesson of matching) {
    if (isExtended && lesson.group !== group) {
      group = lesson.group;
      const heading = document.createElement('h3');
      heading.className = 'catalog-group';
      heading.textContent = group;
      box.append(heading);
    }
    const row = document.createElement('button');
    row.className = 'lesson';
    const found = lesson.parts.filter(Boolean);
    const watched = found.filter(([id]) => state.done[id]).length;
    row.setAttribute('aria-current', String(selected === lesson.number - 1));
    row.innerHTML = '<span class="lesson-index" aria-hidden="true">' + pad(lesson.number) + '</span>' +
      '<span>' + lessonTitle(lesson) + '<small>' + (isExtended ? lesson.group : '字彙 ' + range(lesson)) + '</small></span>' +
      '<span class="lesson-check">' + (watched === found.length ? '✓ 已看完' : isExtended ? '' : found.length + ' 部') + '</span>';
    row.addEventListener('click', () => {
      choose(lesson.number - 1, lesson.parts.findIndex(Boolean));
      if (matchMedia('(max-width: 780px)').matches) byId('lesson-title').scrollIntoView({block:'start'});
    });
    box.append(row);
  }
  if (!matching.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = isExtended ? '找不到影片。可搜尋「發音」或「Bon Voyage」。' :
      '找不到符合的課程。可試試課次「12」或字彙編號「135」。';
    box.append(empty);
  }
}

function showProgress() {
  const [videoId] = lessons[selected].parts[part];
  const completed = Object.values(state.done).filter(Boolean).length;
  byId('progress').max = total;
  byId('progress').value = completed;
  byId('progress-label').textContent = completed + ' / ' + total + ' 已看完';
  byId('mark').textContent = state.done[videoId] ? '✓ 已看完 · 取消標記' : '標記已看完';
  byId('mark').setAttribute('aria-pressed', String(Boolean(state.done[videoId])));
}

function choose(lessonIndex, partIndex) {
  selected = lessonIndex;
  part = partIndex;
  const lesson = lessons[selected];
  const [videoId, minutes] = lesson.parts[part];
  const label = lessonTitle(lesson);
  const context = isExtended ? label : label + ' · ' + partName(lesson, part);
  const original = videoUrl(videoId) + (isExtended && lesson.start ? '&t=' + lesson.start + 's' : '');

  state.selected = selected;
  state.part = part;
  persist();
  const url = new URL(location.href);
  url.searchParams.set(isExtended ? 'video' : 'lesson', String(lesson.number));
  if (!isExtended) url.searchParams.set('part', String(part + 1));
  history.replaceState(null, '', url);

  byId('lesson-title').textContent = isExtended ? label : label + '｜' + partName(lesson, part);
  byId('word-range').textContent = isExtended ? lesson.group : '字彙 ' + range(lesson) + ' · 約 ' + minutes + ' 分鐘';
  byId('practice').hidden = !isExtended;
  byId('practice').textContent = isExtended ? '觀看練習｜' + lesson.prompt : '';
  byId('question-context').textContent = context;
  byId('external').href = original;

  const parts = byId('parts');
  parts.replaceChildren();
  parts.hidden = isExtended;
  if (!isExtended) lesson.parts.forEach((entry, index) => {
    const name = partName(lesson, index);
    if (!entry) {
      const link = document.createElement('a');
      link.textContent = name + '待補 · 搜尋 YouTube ↗';
      link.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('2016公益字彙課程第十堂 91-100 上半段 Gary老師');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      parts.append(link);
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.setAttribute('aria-pressed', String(index === part));
    button.addEventListener('click', () => {
      if (index !== part) choose(selected, index);
    });
    parts.append(button);
  });

  const poster = document.createElement('button');
  poster.className = 'poster';
  poster.type = 'button';
  const image = document.createElement('img');
  image.src = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
  image.alt = '';
  image.addEventListener('error', () => image.remove());
  const play = document.createElement('span');
  play.textContent = '▶ 播放影片';
  poster.append(image, play);
  poster.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&playsinline=1&rel=0' + (isExtended && lesson.start ? '&start=' + lesson.start : '');
    frame.title = 'GARY 老師公益字彙課程 ' + context;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    byId('player').replaceChildren(frame);
    frame.focus();
  });
  byId('player').replaceChildren(poster);

  const draft = state.drafts[videoId] || {};
  for (const field of ['word', 'timestamp', 'question']) byId(field).value = draft[field] || '';
  byId('question').placeholder = isExtended ? lesson.prompt : '例如：這個字根的意思是什麼？可以給我兩個例句嗎？';
  byId('feedback').textContent = '';

  const catalog = byId('lessons');
  const scroll = catalog.scrollTop;
  showCatalog();
  catalog.scrollTop = scroll;
  showProgress();
}

byId('search').addEventListener('input', showCatalog);
byId('mark').addEventListener('click', () => {
  const [videoId] = lessons[selected].parts[part];
  if (state.done[videoId]) delete state.done[videoId];
  else state.done[videoId] = true;
  persist();
  const list = byId('lessons');
  const previousScroll = list.scrollTop;
  showCatalog();
  list.scrollTop = previousScroll;
  showProgress();
});

byId('question-form').addEventListener('input', () => {
  const [videoId] = lessons[selected].parts[part];
  state.drafts[videoId] = Object.fromEntries(['word', 'timestamp', 'question'].map(id => [id, byId(id).value]));
  byId('feedback').textContent = persist() ? '草稿已儲存。' : '這個瀏覽器無法儲存草稿，可直接開啟 Gmail。';

});

byId('question-form').addEventListener('submit', event => {
  const lesson = lessons[selected];
  const [videoId] = lesson.parts[part];
  const word = byId('word').value.trim();
  const timestamp = byId('timestamp').value.trim();
  const question = byId('question').value.trim();
  if (!question) {
    event.preventDefault();
    byId('feedback').textContent = '請先輸入想問的問題。';
    byId('question').focus();
    return;
  }
  const stamp = /^(?:\d+:)?\d{1,3}:[0-5]\d$/.test(timestamp)
    ? timestamp.split(':').reduce((value, unit) => value * 60 + Number(unit), 0)
    : isExtended ? lesson.start : 0;
  const subject = isExtended ? lesson.title : lessonTitle(lesson) + ' ' + partName(lesson, part);
  byId('gmail-subject').value = 'GARY 老師課程提問｜' + subject;
  byId('gmail-body').value = [
    'GARY 老師您好，',
    '',
    (isExtended ? '延伸學習｜' : '2016 公益字彙課程｜') + subject,
    ...(!isExtended ? ['字彙編號：' + range(lesson)] : []),
    '影片：' + videoUrl(videoId) + (stamp ? '&t=' + stamp + 's' : ''),
    ...(word ? ['單字或字根：' + word] : []),
    ...(timestamp ? ['影片時間：' + timestamp] : []),
    '',
    '我的問題：' + question
  ].join('\n');
  byId('feedback').textContent = '請在 Gmail 確認內容並自行寄出。';
});

if (isExtended) {
  document.title = '延伸學習｜GARY 老師公益字彙課程';
  byId('main-title').textContent = '延伸學習';
  byId('intro').textContent = '從字彙記憶、自然發音到生活英文，選一支影片開始。';
  byId('stats').hidden = true;
  byId('catalog-title').textContent = '延伸影片';
  byId('extended-nav').setAttribute('aria-current', 'page');
  byId('search').placeholder = '搜尋片名或主題';
  byId('search').labels[0].textContent = '搜尋片名或主題';
}

byId('lesson-count').textContent = lessons.length;
byId('video-count').textContent = total;
choose(selected, part);
