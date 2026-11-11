const byId = id => document.getElementById(id);
const videos = [...lessons, ...supplements];
const lessonTitle = lesson => lesson.title || `第 ${lesson.number} 堂（${lesson.part}）`;
const videoURL = (lesson, seconds = lesson.start || 0) =>
  `https://www.youtube.com/watch?v=${lesson.id}${seconds ? '&t=' + seconds + 's' : ''}`;
const storageKey = 'gary-word-origins-v1';

function readState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

const state = readState();
const valid = id => videos.some(lesson => lesson.id === id);
const marked = new Set((state.marked || []).filter(valid));
const params = new URLSearchParams(location.search);
let active = videos.find(lesson => lesson.id === (params.get('v') || state.active)) || lessons[0];
let player;
let ready = false;
let generation = 0;
let apiRequested = false;
let playerError = '';

const list = byId('lessons');
const select = byId('question-lesson');
const time = byId('time');
const message = byId('message');
const feedback = byId('feedback');
const capture = byId('capture');
const slot = byId('player-slot');
const complete = byId('complete');
for (const [label, items] of [['字源創世紀正課', lessons], ['Gary 老師延伸學習', supplements]]) {
  const group = document.createElement('optgroup');
  group.label = label;
  for (const lesson of items) group.append(new Option(lessonTitle(lesson), lesson.id));
  select.append(group);
}
select.value = valid(state.draft?.id) && (state.draft?.message || state.draft?.time) ? state.draft.id : active.id;
time.value = state.draft?.time || '';
message.value = state.draft?.message || '';

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      active: active.id,
      marked: [...marked],
      draft: {id: select.value, time: time.value, message: message.value}
    }));
  } catch {
    return false;
  }
  return true;
}

function renderCatalog() {
  const focusedId = list.contains(document.activeElement) ? document.activeElement.dataset.video : null;
  const query = byId('filter').value.normalize('NFKC').trim();
  const visible = lessons.filter(lesson => {
    const title = lessonTitle(lesson).normalize('NFKC');
    return title.includes(query) || title.replaceAll(' ', '').includes(query.replaceAll(' ', '')) ||
      String(lesson.number).padStart(2, '0') === query;
  });
  list.replaceChildren();
  for (const lesson of visible) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    const number = document.createElement('span');
    const title = document.createElement('span');
    const length = document.createElement('span');
    button.type = 'button';
    button.dataset.video = lesson.id;
    button.setAttribute('aria-current', String(lesson.id === active.id));
    number.className = 'num';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(lesson.number).padStart(2, '0');
    title.textContent = lessonTitle(lesson);
    length.className = 'length';
    length.textContent = `${lesson.minutes} 分鐘`;
    button.append(number, title, length);
    if (marked.has(lesson.id)) {
      const check = document.createElement('span');
      check.className = 'done';
      check.setAttribute('aria-label', '已看完');
      check.textContent = '✓';
      button.append(check);
    }
    button.addEventListener('click', () => chooseLesson(lesson, true));
    row.append(button);
    list.append(row);
  }
  if (focusedId) list.querySelector(`[data-video="${focusedId}"]`)?.focus({preventScroll: true});
  byId('empty').hidden = visible.length > 0;
  byId('count').textContent = `${lessons.length} 部影片`;
  const completedLessons = lessons.filter(lesson => marked.has(lesson.id)).length;
  byId('progress').textContent = `正課已看完 ${completedLessons} / ${lessons.length} 部`;
  const bar = byId('progress-bar');
  bar.max = lessons.length;
  bar.value = completedLessons;
}

function showCover() {
  generation++;
  if (player) {
    player.destroy();
    player = undefined;
  }
  ready = false;
  playerError = '';
  capture.disabled = true;
  const cover = document.createElement('button');
  cover.className = 'cover';
  cover.type = 'button';
  const thumbnail = document.createElement('img');
  thumbnail.alt = '';
  thumbnail.src = `https://i.ytimg.com/vi/${active.id}/hqdefault.jpg`;
  thumbnail.addEventListener('error', () => thumbnail.remove(), {once: true});
  const label = document.createElement('span');
  label.textContent = '▶ 播放影片';
  cover.append(thumbnail, label);
  cover.addEventListener('click', loadVideo, {once: true});
  slot.replaceChildren(cover);
  byId('player-status').textContent = '';
}

function connectPlayer() {
  const frame = slot.querySelector('iframe');
  if (!frame || player || !window.YT?.Player) return;
  const loadingGeneration = generation;
  player = new YT.Player(frame, {
    events: {
      onReady() {
        if (loadingGeneration !== generation || playerError) return;
        ready = true;
        syncCapture();
      },
      onError() {
        if (loadingGeneration !== generation) return;
        ready = false;
        playerError = '此影片目前無法在站內播放，請按下方連結到 YouTube 觀看。';
        byId('player-status').textContent = playerError;
        syncCapture();
      },
      onStateChange(event) {
        if (loadingGeneration === generation && event.data === YT.PlayerState.ENDED) {
          marked.add(active.id);
          renderProgress();
        }
      }
    }
  });
}

window.onYouTubeIframeAPIReady = connectPlayer;

function loadVideo() {
  const frame = document.createElement('iframe');
  frame.title = `《字源創世紀》${lessonTitle(active)}`;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  const settings = new URLSearchParams({enablejsapi: '1', autoplay: '1', playsinline: '1', origin: location.origin});
  if (active.start) settings.set('start', active.start);
  frame.src = `https://www.youtube-nocookie.com/embed/${active.id}?${settings}`;
  slot.replaceChildren(frame);
  if (window.YT?.Player) {
    connectPlayer();
  } else if (!apiRequested) {
    apiRequested = true;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.addEventListener('error', () => { apiRequested = false; script.remove(); });
    document.head.append(script);
  }
}

function syncCapture() {
  capture.disabled = !ready || select.value !== active.id;
}

function renderProgress() {
  const seen = marked.has(active.id);
  complete.textContent = seen ? '✓ 已看完' : '標為看完';
  complete.setAttribute('aria-pressed', String(seen));
  saveState();
  renderCatalog();
}

function renderLesson() {
  const collection = active.category ? supplements : lessons;
  const index = collection.indexOf(active);
  byId('video-category').textContent = active.category || '課程影片';
  const source = byId('video-source');
  source.textContent = active.source || '';
  source.hidden = !active.source;
  byId('lesson-title').textContent = lessonTitle(active);
  byId('external').href = videoURL(active);
  byId('prev').disabled = index === 0;
  byId('next').disabled = index === collection.length - 1;
  showCover();
  renderProgress();
}

function chooseLesson(lesson, scroll) {
  if (lesson.id !== active.id) {
    active = lesson;
    const url = new URL(location.href);
    url.searchParams.set('v', active.id);
    history.replaceState(null, '', url);
    if (!message.value.trim() && !time.value.trim()) {
      select.value = active.id;
    }
    renderLesson();
  }
  if (scroll && matchMedia('(max-width: 780px)').matches) byId('watch').scrollIntoView();
}

function formatTime(seconds) {
  const parts = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
  if (!parts[0]) parts.shift();
  return parts.map((part, index) => index ? String(part).padStart(2, '0') : String(part)).join(':');
}

function questionText() {
  const lesson = videos.find(item => item.id === select.value);
  const stamp = time.value.trim();
  const validStamp = !stamp || /^(?:\d{1,2}:[0-5]\d:[0-5]\d|\d{1,3}:[0-5]\d)$/.test(stamp);
  time.setCustomValidity(validStamp ? '' : '請用 分:秒 或 時:分:秒，例如 12:35。');
  const body = message.value.trim();
  message.setCustomValidity(body ? '' : '請輸入你的問題。');
  if (!byId('question').reportValidity()) return null;
  const seconds = stamp ? stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0) : undefined;
  return {
    subject: `《字源創世紀》${lessonTitle(lesson)}提問`,
    body: `Gary 老師您好！\n\n${lessonTitle(lesson)}${stamp ? '｜影片時間 ' + stamp : ''}\n${videoURL(lesson, seconds)}\n\n${body}`
  };
}

byId('filter').addEventListener('input', renderCatalog);
function moveLesson(offset) {
  const collection = active.category ? supplements : lessons;
  const target = collection[collection.indexOf(active) + offset];
  if (target) chooseLesson(target, false);
}
byId('prev').addEventListener('click', () => moveLesson(-1));
byId('next').addEventListener('click', () => moveLesson(1));

function askAbout(lesson) {
  if (select.value !== lesson.id) {
    select.value = lesson.id;
    time.value = '';
    time.setCustomValidity('');
  }
  syncCapture();
  saveState();
}

byId('ask-current').addEventListener('click', () => askAbout(active));
byId('warmup').addEventListener('click', event => {
  event.preventDefault();
  chooseLesson(supplements[0], false);
  byId('watch').scrollIntoView();
});

for (const video of supplements) {
  const card = document.createElement('article');
  card.className = 'card supplement-card';
  const category = document.createElement('p');
  category.className = 'section-label';
  category.textContent = video.category;
  const title = document.createElement('h3');
  title.textContent = lessonTitle(video);
  const source = document.createElement('p');
  source.className = 'video-source';
  source.textContent = video.source;
  const practice = document.createElement('p');
  practice.textContent = video.practice;
  const actions = document.createElement('div');
  actions.className = 'supplement-actions';
  const watch = document.createElement('a');
  watch.href = `?v=${video.id}#watch`;
  watch.className = 'outline';
  watch.textContent = '觀看影片';
  watch.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    chooseLesson(video, false);
    byId('watch').scrollIntoView();
  });
  const ask = document.createElement('a');
  ask.href = '#ask';
  ask.textContent = '問這支影片';
  ask.addEventListener('click', () => {
    chooseLesson(video, false);
    askAbout(video);
  });
  actions.append(watch, ask);
  card.append(category, title, source, practice, actions);
  byId('supplement-list').append(card);
}
complete.addEventListener('click', () => {
  if (marked.has(active.id)) marked.delete(active.id);
  else marked.add(active.id);
  renderProgress();
});
select.addEventListener('change', () => {
  time.value = '';
  time.setCustomValidity('');
  syncCapture();
  saveState();
});
capture.addEventListener('click', () => {
  const seconds = player?.getCurrentTime?.();
  if (!Number.isFinite(seconds)) return;
  time.value = formatTime(Math.floor(seconds));
  time.setCustomValidity('');
  saveState();
});
for (const input of [time, message]) input.addEventListener('input', () => {
  input.setCustomValidity('');
  feedback.textContent = saveState() ? '' : '此瀏覽器目前無法保存草稿，可以先複製提問。';
});
byId('question').addEventListener('submit', event => {
  event.preventDefault();
  const draft = questionText();
  if (!draft) return;
  const gmail = new URL('https://mail.google.com/mail/');
  gmail.search = new URLSearchParams({
    view: 'cm', fs: '1', to: 'godlovesyou127888@gmail.com',
    su: draft.subject, body: draft.body
  });
  window.open(gmail.href, '_blank', 'noopener,noreferrer');
  feedback.textContent = '請到新分頁的 Gmail 確認並寄出。若分頁未開啟，可先複製提問。';
});
byId('copy').addEventListener('click', async () => {
  const draft = questionText();
  if (!draft) return;
  const content = `${draft.subject}\n\n${draft.body}`;
  try {
    await navigator.clipboard.writeText(content);
    feedback.textContent = '已複製提問與影片連結。';
  } catch {
    const preview = byId('copy-preview');
    preview.hidden = false;
    preview.value = content;
    preview.focus();
    preview.select();
    feedback.textContent = '請長按或使用鍵盤複製已選取的內容。';
  }
});
renderLesson();
