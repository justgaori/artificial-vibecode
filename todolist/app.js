const STORAGE_KEY = 'haru-note.vanilla.v1'
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORIES = {
  work: '업무',
  personal: '개인',
  study: '공부',
}

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
const calendarDayPanel = document.querySelector('.calendar-day-panel')
const doneBoard = document.getElementById('done-board')

const today = toISODate(new Date())
const now = new Date()

let todos = loadTodos()
let currentFilter = 'all'
let currentView = 'list'
let selectedDate = today
let calCursor = {
  year: now.getFullYear(),
  month: now.getMonth(),
}

dateInput.value = today
todayLabel.textContent = formatLongDate(today)

form.addEventListener('submit', handleSubmit)
listEl.addEventListener('click', handleListClick)
listEl.addEventListener('change', handleListChange)
doneListEl.addEventListener('click', handleListClick)
doneListEl.addEventListener('change', handleListChange)
calendarDayList.addEventListener('click', handleListClick)
calendarDayList.addEventListener('change', handleListChange)

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

document.getElementById('cal-prev').addEventListener('click', () => shiftMonth(-1))
document.getElementById('cal-next').addEventListener('click', () => shiftMonth(1))

render()

function handleSubmit(event) {
  event.preventDefault()

  const title = titleInput.value.trim()
  const category = form.category.value
  const date = dateInput.value || today

  if (!title) return

  todos.unshift({
    id: String(Date.now()),
    title: title,
    category: category,
    date: date,
    done: false,
  })

  titleInput.value = ''
  dateInput.value = date
  titleInput.focus()
  selectedDate = date
  saveTodos()
  render()
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

function shiftMonth(delta) {
  const next = new Date(calCursor.year, calCursor.month + delta, 1)
  calCursor = { year: next.getFullYear(), month: next.getMonth() }
  render()
}

function render() {
  const visible = todos.filter((item) => {
    return currentFilter === 'all' || item.category === currentFilter
  })
  const active = visible.filter((item) => !item.done)
  const done = visible.filter((item) => item.done)
  const left = todos.filter((item) => !item.done).length

  summaryEl.textContent = left === 0 ? '오늘 할 일을 모두 마쳤어요' : `남은 일 ${left}개`
  doneSummaryEl.textContent = done.length === 0 ? '아직 완료한 일이 없어요' : `완료 ${done.length}개`

  const showCalendar = currentView === 'calendar'
  listEl.hidden = showCalendar
  doneBoard.hidden = showCalendar
  calendarDayPanel.hidden = true
  calendarView.hidden = !showCalendar

  fillList(listEl, active, '이 분류에 할 일이 없습니다. 위에서 하나 추가해 보세요.')
  fillList(doneListEl, done, '완료한 일이 여기로 옮겨집니다.')

  if (showCalendar) {
    renderCalendar(visible)
  }
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
  title.textContent = todo.title

  const meta = document.createElement('div')
  meta.className = 'todo-meta'

  const badge = document.createElement('span')
  badge.className = `badge badge-${todo.category}`
  badge.textContent = CATEGORIES[todo.category] || todo.category

  const dateText = document.createElement('span')
  dateText.className = 'date-text'
  dateText.textContent = formatShortDate(todo.date)

  meta.appendChild(badge)
  meta.appendChild(dateText)
  body.appendChild(title)
  body.appendChild(meta)

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

  item.appendChild(checkbox)
  item.appendChild(body)
  item.appendChild(actions)
  return item
}

function renderCalendar(visible) {
  calendarLabel.textContent = `${calCursor.year}년 ${calCursor.month + 1}월`
  calendarGrid.innerHTML = ''

  monthCells(calCursor.year, calCursor.month).forEach((cell) => {
    const dayTodos = visible.filter((item) => item.date === cell.iso)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = [
      'calendar-cell',
      cell.inMonth ? '' : 'outside',
      cell.iso === today ? 'today' : '',
      cell.iso === selectedDate ? 'is-selected' : '',
    ]
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

  const selectedTodos = visible.filter((item) => item.date === selectedDate)
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

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return createSeedTodos()

    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return createSeedTodos()

    return parsed.map((item) => ({
      ...item,
      date: item.date || today,
    }))
  } catch (error) {
    return createSeedTodos()
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function createSeedTodos() {
  return [
    { id: '1', title: '오늘 회의 자료 한 장만 정리하기', category: 'work', date: today, done: false },
    { id: '2', title: '저녁 산책 30분', category: 'personal', date: today, done: false },
    { id: '3', title: '자바스크립트 예제 한 개 따라 치기', category: 'study', date: addDays(today, 1), done: false },
  ]
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
