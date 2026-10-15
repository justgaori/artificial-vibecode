const STORAGE_KEY = 'haru-note.vanilla.v1'
const THEME_KEY = 'haru-note.theme'
const SETTINGS_KEY = 'haru-note.classify.v1'
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORIES = {
  work: '업무',
  personal: '개인',
  study: '공부',
}

const DEFAULT_KEYWORDS = {
  work: ['회사', '회의', '보고', '업무', '출근', '메일', '스케줄', '프로젝트', '발표', '미팅', '근무'],
  personal: ['영화', '운동', '산책', '친구', '쇼핑', '병원', '약속', '취미', '요리', '청소', '여행'],
  study: ['공부', '과제', '시험', '강의', '학습', '코딩', '복습', '수업', '문제집', '독서'],
}

const QUOTES = [
  '시작이 반이다.',
  '천 리 길도 한 걸음부터.',
  '오늘 할 일을 내일로 미루지 않는다.',
  '작은 기록이 하루를 지킨다.',
  '끝난 일보다, 시작한 일이 중요하다.',
  '비교 대신 어제보다 한 칸만.',
  '완벽보다 완료.',
  '적는 순간 일은 반으로 줄어든다.',
]

const form = document.getElementById('todo-form')
const titleInput = document.getElementById('todo-title')
const dateInput = document.getElementById('todo-date')
const listEl = document.getElementById('todo-list')
const doneListEl = document.getElementById('done-list')
const summaryEl = document.getElementById('summary')
const doneSummaryEl = document.getElementById('done-summary')
const todayLabel = document.getElementById('today-label')
const filterButtons = document.querySelectorAll('.filter')
const viewButtons = document.querySelectorAll('.view-btn')
const calendarView = document.getElementById('calendar-view')
const calendarGrid = document.getElementById('calendar-grid')
const calendarLabel = document.getElementById('cal-label')
const calendarDayTitle = document.getElementById('calendar-day-title')
const calendarDayList = document.getElementById('calendar-day-list')
const doneBoard = document.getElementById('done-board')
const sortSelect = document.getElementById('sort-select')
const suggestHint = document.getElementById('suggest-hint')
const suggestDialog = document.getElementById('suggest-dialog')
const suggestText = document.getElementById('suggest-text')
const settingsDialog = document.getElementById('settings-dialog')
const toastEl = document.getElementById('toast')

const today = toISODate(new Date())
const now = new Date()

let todos = loadTodos()
let settings = loadSettings()
let currentFilter = 'all'
let currentView = 'list'
let currentSort = 'latest'
let selectedDate = today
let calCursor = {
  year: now.getFullYear(),
  month: now.getMonth(),
}
let toastTimer = 0

dateInput.value = today
todayLabel.textContent = formatLongDate(today)
document.getElementById('daily-quote').textContent = `오늘의 격언  ·  ${quoteForToday()}`
applyTheme(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')

form.addEventListener('submit', handleSubmit)
titleInput.addEventListener('input', updateSuggestHint)
listEl.addEventListener('click', handleListClick)
listEl.addEventListener('change', handleListChange)
listEl.addEventListener('dblclick', handleEdit)
doneListEl.addEventListener('click', handleListClick)
doneListEl.addEventListener('change', handleListChange)
doneListEl.addEventListener('dblclick', handleEdit)
calendarDayList.addEventListener('click', handleListClick)
calendarDayList.addEventListener('change', handleListChange)
calendarDayList.addEventListener('dblclick', handleEdit)

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter
    filterButtons.forEach((item) => item.classList.toggle('is-active', item === button))
    render()
  })
})

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentView = button.dataset.view
    viewButtons.forEach((item) => item.classList.toggle('is-active', item === button))
    render()
  })
})

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value
  render()
})

form.category.addEventListener('change', updateSuggestHint)

document.getElementById('cal-prev').addEventListener('click', () => shiftMonth(-1))
document.getElementById('cal-next').addEventListener('click', () => shiftMonth(1))
document.getElementById('theme-toggle').addEventListener('click', toggleTheme)
document.getElementById('reclassify-btn').addEventListener('click', reclassifyAll)
document.getElementById('settings-btn').addEventListener('click', openSettings)
document.getElementById('settings-cancel').addEventListener('click', () => settingsDialog.close())
document.getElementById('settings-save').addEventListener('click', saveSettingsFromForm)
document.getElementById('export-btn').addEventListener('click', exportTodos)
document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click())
document.getElementById('import-file').addEventListener('change', importTodos)
document.getElementById('clear-done-btn').addEventListener('click', clearDone)
document.getElementById('suggest-accept').addEventListener('click', () => suggestDialog.close('accept'))
document.getElementById('suggest-keep').addEventListener('click', () => suggestDialog.close('keep'))

document.addEventListener('keydown', (event) => {
  const tag = event.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target.isContentEditable) return
  if (event.key === 'd' || event.key === 'D') {
    event.preventDefault()
    toggleTheme()
  }
  if (event.key === '/') {
    event.preventDefault()
    titleInput.focus()
  }
})

render()

async function handleSubmit(event) {
  event.preventDefault()
  if (suggestDialog.open) return

  const title = titleInput.value.trim()
  const date = dateInput.value || today
  if (!title) return

  let category = form.category.value
  if (settings.enabled) {
    const suggested = detectCategory(title)
    if (suggested && suggested !== category) {
      category = await askSuggestion(title, category, suggested)
    }
  }

  todos.unshift({
    id: String(Date.now()),
    title: title,
    category: category,
    date: date,
    done: false,
    createdAt: Date.now(),
  })

  titleInput.value = ''
  dateInput.value = date
  suggestHint.hidden = true
  titleInput.focus()
  selectedDate = date
  saveTodos()
  render()
}

function askSuggestion(title, selected, suggested) {
  suggestText.textContent = `${topicParticle(title)} ${objectParticle(CATEGORIES[suggested])} 분류하는 것을 추천합니다. 적용할까요?`
  return new Promise((resolve) => {
    const onClose = () => {
      suggestDialog.removeEventListener('close', onClose)
      resolve(suggestDialog.returnValue === 'accept' ? suggested : selected)
    }
    suggestDialog.addEventListener('close', onClose)
    suggestDialog.showModal()
  })
}

function updateSuggestHint() {
  const title = titleInput.value.trim()
  const suggested = settings.enabled ? detectCategory(title) : null
  if (!suggested || suggested === form.category.value) {
    suggestHint.hidden = true
    suggestHint.textContent = ''
    return
  }
  suggestHint.hidden = false
  suggestHint.textContent = `추천 분류: ${CATEGORIES[suggested]}. 추가할 때 한 번 더 확인합니다.`
}

function handleListChange(event) {
  const checkbox = event.target.closest('input[type="checkbox"]')
  if (!checkbox) return

  const todo = todos.find((item) => item.id === checkbox.dataset.id)
  if (!todo) return

  todo.done = checkbox.checked
  saveTodos()
  render()
}

function handleListClick(event) {
  const cancel = event.target.closest('[data-cancel]')
  if (cancel) {
    const todo = todos.find((item) => item.id === cancel.dataset.cancel)
    if (!todo) return
    todo.done = false
    saveTodos()
    render()
    return
  }

  const button = event.target.closest('[data-delete]')
  if (!button) return

  todos = todos.filter((item) => item.id !== button.dataset.delete)
  saveTodos()
  render()
}

function handleEdit(event) {
  const title = event.target.closest('[data-edit]')
  if (!title || title.querySelector('input')) return
  const todo = todos.find((item) => item.id === title.dataset.edit)
  if (!todo) return

  const input = document.createElement('input')
  input.className = 'edit-input'
  input.value = todo.title
  input.maxLength = 80
  title.textContent = ''
  title.appendChild(input)
  input.focus()
  input.select()

  let closed = false
  const finish = (save) => {
    if (closed) return
    closed = true
    if (save) {
      const next = input.value.trim()
      if (next) todo.title = next
      saveTodos()
    }
    render()
  }

  input.addEventListener('keydown', (keyEvent) => {
    if (keyEvent.key === 'Enter') {
      keyEvent.preventDefault()
      finish(true)
    } else if (keyEvent.key === 'Escape') {
      keyEvent.preventDefault()
      finish(false)
    }
  })
  input.addEventListener('blur', () => finish(true))
}

function shiftMonth(delta) {
  const next = new Date(calCursor.year, calCursor.month + delta, 1)
  calCursor = { year: next.getFullYear(), month: next.getMonth() }
  render()
}

function render() {
  const visible = sortItems(
    todos.filter((item) => currentFilter === 'all' || item.category === currentFilter),
  )
  const active = visible.filter((item) => !item.done)
  const done = visible.filter((item) => item.done)
  const left = todos.filter((item) => !item.done).length

  summaryEl.textContent = left === 0 ? '오늘 할 일을 모두 마쳤어요' : `남은 일 ${left}개`
  doneSummaryEl.textContent = done.length === 0 ? '아직 완료한 일이 없어요' : `완료 ${done.length}개`

  const showCalendar = currentView === 'calendar'
  listEl.hidden = showCalendar
  doneBoard.hidden = showCalendar
  calendarView.hidden = !showCalendar

  fillList(listEl, active, '이 분류에 할 일이 없습니다. 위에서 하나 추가해 보세요.')
  fillList(doneListEl, done, '완료한 일이 여기로 옮겨집니다.')
  renderProgress()

  if (showCalendar) {
    renderCalendar(todos.filter((item) => currentFilter === 'all' || item.category === currentFilter))
  }
}

function renderProgress() {
  const total = todos.length
  const done = todos.filter((item) => item.done).length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  document.getElementById('progress-overall-text').textContent =
    total === 0 ? '할 일 없음' : `${done}/${total} · ${pct}%`
  document.getElementById('progress-overall-bar').style.width = `${pct}%`

  const wrap = document.getElementById('progress-categories')
  wrap.innerHTML = ''
  Object.keys(CATEGORIES).forEach((key) => {
    const items = todos.filter((item) => item.category === key)
    const doneCount = items.filter((item) => item.done).length
    const ratio = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100)
    const row = document.createElement('div')
    row.className = 'mini-progress'

    const label = document.createElement('div')
    label.className = 'progress-label'
    const name = document.createElement('span')
    name.textContent = CATEGORIES[key]
    const value = document.createElement('strong')
    value.textContent = items.length === 0 ? '0' : `${doneCount}/${items.length}`
    label.append(name, value)

    const track = document.createElement('div')
    track.className = 'progress-track'
    const bar = document.createElement('span')
    bar.className = `bar-${key}`
    bar.style.width = `${ratio}%`
    track.appendChild(bar)

    row.append(label, track)
    wrap.appendChild(row)
  })
}

function fillList(target, items, emptyText) {
  target.innerHTML = ''

  if (items.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = emptyText
    target.appendChild(empty)
    return
  }

  items.forEach((todo) => {
    target.appendChild(createTodoItem(todo))
  })
}

function createTodoItem(todo) {
  const item = document.createElement('li')
  item.className = todo.done ? 'todo-item is-done' : 'todo-item'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = todo.done
  checkbox.dataset.id = todo.id
  checkbox.setAttribute('aria-label', todo.done ? '완료 취소' : '완료로 표시')

  const body = document.createElement('div')
  const title = document.createElement('p')
  title.className = 'todo-title'
  title.dataset.edit = todo.id
  title.textContent = todo.title
  title.title = '더블클릭하면 수정합니다'

  const meta = document.createElement('div')
  meta.className = 'todo-meta'

  const badge = document.createElement('span')
  badge.className = `badge badge-${todo.category}`
  badge.textContent = CATEGORIES[todo.category] || todo.category

  const dateText = document.createElement('span')
  dateText.className = 'date-text'
  dateText.textContent = formatShortDate(todo.date)

  meta.append(badge, dateText)
  body.append(title, meta)

  const actions = document.createElement('div')
  actions.className = 'todo-actions'

  if (todo.done) {
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.className = 'cancel-btn'
    cancel.dataset.cancel = todo.id
    cancel.textContent = '취소'
    actions.appendChild(cancel)
  }

  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'delete-btn'
  remove.dataset.delete = todo.id
  remove.textContent = '삭제'
  actions.appendChild(remove)

  item.append(checkbox, body, actions)
  return item
}

function renderCalendar(visible) {
  calendarLabel.textContent = `${calCursor.year}년 ${calCursor.month + 1}월`
  calendarGrid.innerHTML = ''

  monthCells(calCursor.year, calCursor.month).forEach((cell) => {
    const dayTodos = visible.filter((item) => item.date === cell.iso)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = ['calendar-cell', cell.inMonth ? '' : 'outside', cell.iso === today ? 'today' : '', cell.iso === selectedDate ? 'is-selected' : '']
      .filter(Boolean)
      .join(' ')
    button.addEventListener('click', () => {
      selectedDate = cell.iso
      dateInput.value = cell.iso
      render()
    })

    const num = document.createElement('span')
    num.className = 'calendar-num'
    num.textContent = Number(cell.iso.slice(8, 10))
    button.appendChild(num)

    dayTodos.slice(0, 2).forEach((todo) => {
      const event = document.createElement('span')
      event.className = `calendar-event ${todo.category}`
      event.textContent = todo.title
      button.appendChild(event)
    })

    if (dayTodos.length > 2) {
      const more = document.createElement('span')
      more.className = 'calendar-more'
      more.textContent = `+${dayTodos.length - 2}`
      button.appendChild(more)
    }

    calendarGrid.appendChild(button)
  })

  const selectedTodos = sortItems(visible.filter((item) => item.date === selectedDate))
  calendarDayTitle.textContent = `${formatLongDate(selectedDate)} 일정`
  fillList(calendarDayList, selectedTodos, '이 날짜에 할 일이 없습니다.')
}

function monthCells(year, month) {
  const first = new Date(year, month, 1)
  const pad = first.getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < pad; i += 1) {
    cells.push({
      iso: toISODate(new Date(year, month, i - pad + 1)),
      inMonth: false,
    })
  }

  for (let day = 1; day <= lastDate; day += 1) {
    cells.push({
      iso: toISODate(new Date(year, month, day)),
      inMonth: true,
    })
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].iso
    cells.push({ iso: addDays(last, 1), inMonth: false })
  }

  return cells
}

function sortItems(items) {
  const copy = items.slice()
  const byCreated = (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
  if (currentSort === 'oldest') copy.sort(byCreated)
  else if (currentSort === 'date') copy.sort((a, b) => a.date.localeCompare(b.date) || byCreated(a, b))
  else if (currentSort === 'category') copy.sort((a, b) => a.category.localeCompare(b.category) || byCreated(a, b))
  else if (currentSort === 'title') copy.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  else copy.sort((a, b) => byCreated(b, a))
  return copy
}

function hasBatchim(word) {
  const last = word.charCodeAt(word.length - 1)
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0
}

function topicParticle(word) {
  return `‘${word}’${hasBatchim(word) ? '은' : '는'}`
}

function objectParticle(word) {
  return `${word}${hasBatchim(word) ? '으로' : '로'}`
}

function detectCategory(title) {
  const text = title.replace(/\s+/g, '')
  let best = null
  let bestLen = 0
  let tie = false

  Object.keys(settings.keywords).forEach((category) => {
    settings.keywords[category].forEach((word) => {
      const token = String(word).trim()
      const compact = token.replace(/\s+/g, '')
      if (compact.length < 2 || !text.includes(compact)) return
      if (compact.length > bestLen) {
        best = category
        bestLen = compact.length
        tie = false
      } else if (compact.length === bestLen && category !== best) {
        tie = true
      }
    })
  })

  return tie ? null : best
}

function reclassifyAll() {
  if (!settings.enabled) {
    toast('자동 분류가 꺼져 있습니다. 분류 설정에서 켤 수 있습니다.')
    return
  }

  let changed = 0
  todos.forEach((todo) => {
    if (todo.done) return
    const suggested = detectCategory(todo.title)
    if (suggested && suggested !== todo.category) {
      todo.category = suggested
      changed += 1
    }
  })
  saveTodos()
  render()
  toast(changed ? `${changed}개를 다시 분류했습니다.` : '바꿀 항목이 없습니다.')
}

function openSettings() {
  document.getElementById('classify-enabled').checked = settings.enabled
  document.getElementById('keywords-work').value = settings.keywords.work.join(', ')
  document.getElementById('keywords-personal').value = settings.keywords.personal.join(', ')
  document.getElementById('keywords-study').value = settings.keywords.study.join(', ')
  settingsDialog.showModal()
}

function saveSettingsFromForm() {
  settings = {
    enabled: document.getElementById('classify-enabled').checked,
    keywords: {
      work: parseKeywords(document.getElementById('keywords-work').value),
      personal: parseKeywords(document.getElementById('keywords-personal').value),
      study: parseKeywords(document.getElementById('keywords-study').value),
    },
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  settingsDialog.close()
  updateSuggestHint()
  toast('분류 설정을 저장했습니다.')
}

function parseKeywords(value) {
  return value
    .split(/[,，\n]/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
}

function clearDone() {
  const ids = new Set(
    todos
      .filter((item) => item.done && (currentFilter === 'all' || item.category === currentFilter))
      .map((item) => item.id),
  )
  if (ids.size === 0) {
    toast('삭제할 완료 항목이 없습니다.')
    return
  }
  todos = todos.filter((item) => !ids.has(item.id))
  saveTodos()
  render()
  toast(`완료 항목 ${ids.size}개를 삭제했습니다.`)
}

function exportTodos() {
  const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '하루수첩.json'
  link.click()
  URL.revokeObjectURL(url)
  toast('JSON 파일로 내보냈습니다.')
}

function importTodos(event) {
  const file = event.target.files && event.target.files[0]
  event.target.value = ''
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      if (!Array.isArray(parsed)) throw new Error('array')
      const next = parsed.map(normalizeTodo).filter(Boolean)
      if (next.length === 0) throw new Error('empty')
      todos = next
      saveTodos()
      render()
      toast(`${next.length}개의 할 일을 가져왔습니다.`)
    } catch (error) {
      toast('JSON 형식을 읽지 못했습니다.')
    }
  }
  reader.readAsText(file)
}

function normalizeTodo(item) {
  if (!item || typeof item.title !== 'string' || !item.title.trim()) return null
  return {
    id: String(item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    title: item.title.trim().slice(0, 80),
    category: CATEGORIES[item.category] ? item.category : 'personal',
    date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : today,
    done: Boolean(item.done),
    createdAt: Number(item.createdAt) || Date.now(),
  }
}

function toggleTheme() {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  localStorage.setItem(THEME_KEY, next)
  applyTheme(next)
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const button = document.getElementById('theme-toggle')
  button.textContent = theme === 'dark' ? '라이트모드' : '다크모드'
  button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false')
}

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return createSeedTodos()

    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return createSeedTodos()

    return parsed.map((item, index) => ({
      ...item,
      date: item.date || today,
      createdAt: item.createdAt || index + 1,
    }))
  } catch (error) {
    return createSeedTodos()
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    if (!saved || !saved.keywords) throw new Error('empty')
    return {
      enabled: saved.enabled !== false,
      keywords: {
        work: saved.keywords.work?.length ? saved.keywords.work : DEFAULT_KEYWORDS.work,
        personal: saved.keywords.personal?.length ? saved.keywords.personal : DEFAULT_KEYWORDS.personal,
        study: saved.keywords.study?.length ? saved.keywords.study : DEFAULT_KEYWORDS.study,
      },
    }
  } catch (error) {
    return {
      enabled: true,
      keywords: {
        work: DEFAULT_KEYWORDS.work.slice(),
        personal: DEFAULT_KEYWORDS.personal.slice(),
        study: DEFAULT_KEYWORDS.study.slice(),
      },
    }
  }
}

function createSeedTodos() {
  return [
    { id: '1', title: '오늘 회의 자료 한 장만 정리하기', category: 'work', date: today, done: false, createdAt: 1 },
    { id: '2', title: '저녁 산책 30분', category: 'personal', date: today, done: false, createdAt: 2 },
    { id: '3', title: '자바스크립트 예제 한 개 따라 치기', category: 'study', date: addDays(today, 1), done: false, createdAt: 3 },
  ]
}

function quoteForToday() {
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now - start) / 86400000)
  return QUOTES[day % QUOTES.length]
}

function toast(message) {
  toastEl.hidden = false
  toastEl.textContent = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastEl.hidden = true
  }, 2400)
}

function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  return toISODate(new Date(year, month - 1, day + days))
}

function formatLongDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${year}년 ${month}월 ${day}일 ${WEEKDAYS[date.getDay()]}요일`
}

function formatShortDate(iso) {
  if (!iso) return '날짜 없음'
  if (iso === today) return '오늘'
  if (iso === addDays(today, 1)) return '내일'
  if (iso === addDays(today, -1)) return '어제'
  const [, month, day] = iso.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}
