const TODO_KEY = 'start-home.todos'
const clockEl = document.getElementById('clock')
const clockCard = document.getElementById('clock-card')
const dateCard = document.getElementById('date-card')
const listEl = document.getElementById('todo-list')
const weatherTemp = document.getElementById('weather-temp')
const weatherText = document.getElementById('weather-text')
const newsList = document.getElementById('news-list')

let todos = loadTodos()

document.getElementById('todo-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const input = document.getElementById('todo-input')
  const title = input.value.trim()
  if (!title) return
  todos.unshift({ id: String(Date.now()), title, done: false })
  input.value = ''
  saveTodos()
  renderTodos()
})

listEl.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-remove]')
  if (remove) {
    todos = todos.filter((item) => item.id !== remove.dataset.remove)
    saveTodos()
    renderTodos()
    return
  }
  const check = event.target.closest('input[type="checkbox"]')
  if (!check) return
  const todo = todos.find((item) => item.id === check.dataset.id)
  if (!todo) return
  todo.done = check.checked
  saveTodos()
  renderTodos()
})

tick()
setInterval(tick, 1000)
renderTodos()
loadWeather()
loadNews()

function tick() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const date = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  clockEl.textContent = `${hh}:${mm}:${ss}`
  clockCard.textContent = `${hh}:${mm}`
  dateCard.textContent = date
}

function renderTodos() {
  listEl.innerHTML = ''
  if (todos.length === 0) {
    const empty = document.createElement('li')
    empty.textContent = '아직 적힌 일이 없습니다.'
    listEl.appendChild(empty)
    return
  }
  todos.forEach((todo) => {
    const item = document.createElement('li')
    item.className = todo.done ? 'done' : ''
    const label = document.createElement('label')
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = todo.done
    box.dataset.id = todo.id
    const text = document.createElement('span')
    text.textContent = ` ${todo.title}`
    label.append(box, text)
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'icon-btn'
    remove.dataset.remove = todo.id
    remove.textContent = '삭제'
    item.append(label, remove)
    listEl.appendChild(item)
  })
}

async function loadWeather() {
  try {
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code&timezone=Asia%2FSeoul',
    )
    if (!response.ok) throw new Error(String(response.status))
    const data = await response.json()
    const temp = Math.round(data.current.temperature_2m)
    weatherTemp.textContent = `${temp}°C`
    weatherText.textContent = `서울 · ${weatherLabel(data.current.weather_code)}`
  } catch (error) {
    weatherTemp.textContent = '연결 실패'
    weatherText.textContent = '기상청에서 서울 날씨를 확인해 주세요.'
  }
}

function weatherLabel(code) {
  if (code === 0) return '맑음'
  if (code <= 3) return '구름'
  if (code <= 48) return '안개'
  if (code <= 57) return '이슬비'
  if (code <= 67) return '비'
  if (code <= 77) return '눈'
  if (code <= 82) return '소나기'
  if (code >= 95) return '뇌우'
  return '날씨 확인'
}

async function loadNews() {
  try {
    const response = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=4')
    if (!response.ok) throw new Error(String(response.status))
    const data = await response.json()
    const hits = (data.hits || []).filter((hit) => hit.title && hit.url)
    newsList.innerHTML = ''
    if (hits.length === 0) throw new Error('empty')
    hits.forEach((hit) => {
      const item = document.createElement('li')
      const link = document.createElement('a')
      link.href = hit.url
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.textContent = hit.title
      item.appendChild(link)
      newsList.appendChild(item)
    })
  } catch (error) {
    newsList.innerHTML = ''
    const item = document.createElement('li')
    const link = document.createElement('a')
    link.href = 'https://news.ycombinator.com'
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.textContent = '소식을 불러오지 못했습니다. Hacker News에서 직접 확인'
    item.appendChild(link)
    newsList.appendChild(item)
  }
}

function loadTodos() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TODO_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

function saveTodos() {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos))
}
