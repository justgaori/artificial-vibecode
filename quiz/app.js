const CATEGORY_LABEL = {
  history: '한국사',
  science: '과학',
  geo: '지리',
  art: '예술과 문화',
}

const MODE_LABEL = {
  standard: '일반',
  speed: '스피드',
  category: '분야별',
}

const RANK_KEY = 'quiz-rank.v1'
const SPEED_MS = 15000

const setupEl = document.getElementById('setup')
const playEl = document.getElementById('play')
const resultEl = document.getElementById('result')
const choicesEl = document.getElementById('choices')
const feedbackEl = document.getElementById('feedback')
const hintBtn = document.getElementById('hint-btn')
const nextBtn = document.getElementById('next-btn')
const timerLabel = document.getElementById('timer-label')
const categoryPicker = document.getElementById('category-picker')

let mode = 'standard'
let category = 'history'
let round = []
let index = 0
let score = 0
let correctCount = 0
let locked = false
let hinted = false
let timerId = 0
let remain = SPEED_MS
let savedRank = false

document.querySelectorAll('.mode').forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode
    document.querySelectorAll('.mode').forEach((item) => item.classList.toggle('is-on', item === button))
    categoryPicker.hidden = mode !== 'category'
  })
})

document.querySelectorAll('.cat').forEach((button) => {
  button.addEventListener('click', () => {
    category = button.dataset.category
    document.querySelectorAll('.cat').forEach((item) => item.classList.toggle('is-on', item === button))
  })
})

document.getElementById('start-btn').addEventListener('click', startGame)
hintBtn.addEventListener('click', useHint)
nextBtn.addEventListener('click', nextQuestion)
document.getElementById('again-btn').addEventListener('click', showSetup)
document.getElementById('rank-form').addEventListener('submit', saveRank)

renderRanks()

function startGame() {
  const bank = window.QUIZ_BANK.slice()
  if (mode === 'category') {
    round = shuffle(bank.filter((item) => item.category === category))
  } else if (mode === 'speed') {
    round = shuffle(bank).slice(0, 8)
  } else {
    round = shuffle(bank).slice(0, 10)
  }
  index = 0
  score = 0
  correctCount = 0
  savedRank = false
  setupEl.hidden = true
  resultEl.hidden = true
  playEl.hidden = false
  showQuestion()
}

function showQuestion() {
  const quiz = round[index]
  locked = false
  hinted = false
  feedbackEl.hidden = true
  nextBtn.hidden = true
  hintBtn.hidden = false
  hintBtn.disabled = false
  document.getElementById('progress-label').textContent = `${index + 1} / ${round.length}`
  document.getElementById('score-label').textContent = `${score}점`
  document.getElementById('question-meta').textContent = `${CATEGORY_LABEL[quiz.category]} · ${quiz.difficulty}`
  document.getElementById('question-text').textContent = quiz.question
  const criteria = document.getElementById('criteria')
  criteria.hidden = !quiz.criteria
  criteria.textContent = quiz.criteria ? `기준 · ${quiz.criteria}` : ''

  choicesEl.innerHTML = ''
  quiz.choices.forEach((choice, choiceIndex) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'choice'
    button.textContent = choice
    button.addEventListener('click', () => judge(choiceIndex))
    choicesEl.appendChild(button)
  })

  if (mode === 'speed') startTimer()
  else stopTimer()
}

function startTimer() {
  stopTimer()
  remain = SPEED_MS
  timerLabel.hidden = false
  paintTimer()
  const started = performance.now()
  timerId = window.setInterval(() => {
    remain = SPEED_MS - (performance.now() - started)
    paintTimer()
    if (remain <= 0) {
      remain = 0
      paintTimer()
      judge(-1)
    }
  }, 100)
}

function paintTimer() {
  const seconds = Math.max(0, remain / 1000)
  timerLabel.textContent = `${seconds.toFixed(1)}초`
  timerLabel.classList.toggle('warn', seconds <= 5)
}

function stopTimer() {
  window.clearInterval(timerId)
  if (mode !== 'speed') timerLabel.hidden = true
}

function useHint() {
  if (locked || hinted) return
  const quiz = round[index]
  const wrong = quiz.choices.map((_, i) => i).filter((i) => i !== quiz.answer)
  shuffle(wrong).slice(0, 2).forEach((choiceIndex) => {
    const button = choicesEl.children[choiceIndex]
    button.disabled = true
    button.classList.add('dim')
  })
  hinted = true
  hintBtn.disabled = true
}

function judge(choiceIndex) {
  if (locked) return
  locked = true
  stopTimer()
  const quiz = round[index]
  const correct = choiceIndex === quiz.answer
  const gained = correct ? (hinted ? 6 : 10) : 0
  score += gained
  if (correct) correctCount += 1

  Array.from(choicesEl.children).forEach((button, buttonIndex) => {
    button.disabled = true
    if (buttonIndex === quiz.answer) button.classList.add('correct')
    else if (buttonIndex === choiceIndex) button.classList.add('wrong')
  })

  feedbackEl.hidden = false
  feedbackEl.className = `feedback ${correct ? 'good' : 'bad'}`
  const head = choiceIndex < 0 ? '시간이 끝났습니다.' : correct ? `정답입니다. +${gained}점` : '오답입니다.'
  feedbackEl.textContent = `${head} ${quiz.explanation}`
  document.getElementById('score-label').textContent = `${score}점`
  hintBtn.hidden = true
  nextBtn.hidden = false
  nextBtn.textContent = index === round.length - 1 ? '결과 보기' : '다음'
}

function nextQuestion() {
  index += 1
  if (index >= round.length) showResult()
  else showQuestion()
}

function showResult() {
  playEl.hidden = true
  resultEl.hidden = false
  const possible = round.length * 10
  document.getElementById('result-title').textContent = `${score}점`
  document.getElementById('result-copy').textContent =
    `${MODE_LABEL[mode]} 모드 · ${round.length}문제 중 ${correctCount}문제 정답 · 만점 ${possible}점`
  document.getElementById('rank-form').hidden = false
  document.getElementById('player-name').value = ''
}

function saveRank(event) {
  event.preventDefault()
  if (savedRank) return
  const name = document.getElementById('player-name').value.trim()
  if (!name) return
  const ranks = loadRanks()
  ranks.push({
    name: name.slice(0, 12),
    score,
    total: round.length,
    mode,
    at: Date.now(),
  })
  ranks.sort((a, b) => b.score - a.score || a.at - b.at)
  localStorage.setItem(RANK_KEY, JSON.stringify(ranks.slice(0, 8)))
  savedRank = true
  document.getElementById('rank-form').hidden = true
  renderRanks()
}

function showSetup() {
  resultEl.hidden = true
  playEl.hidden = true
  setupEl.hidden = false
  renderRanks()
}

function renderRanks() {
  const list = document.getElementById('rank-list')
  const ranks = loadRanks()
  list.innerHTML = ''
  if (ranks.length === 0) {
    const item = document.createElement('li')
    item.textContent = '아직 기록이 없습니다.'
    list.appendChild(item)
    return
  }
  ranks.forEach((rank) => {
    const item = document.createElement('li')
    item.textContent = `${rank.name} · ${MODE_LABEL[rank.mode] || rank.mode} · ${rank.score}점 (${rank.total}문제)`
    list.appendChild(item)
  })
}

function loadRanks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RANK_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

function shuffle(items) {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
