/* 생활관 공용 세탁실 "지금 빈 세탁기" — 상태 데이터는 시뮬레이션 */
(function () {
  "use strict";

  var KEY = "bin-washer-v1";
  var WAIT_LIMIT = 15 * 60;
  var PICKUP_AFTER = 10 * 60;

  var COURSES = {
    washer: [
      { id: "std", name: "표준", min: 48 },
      { id: "quick", name: "급속", min: 30 },
      { id: "bedding", name: "이불", min: 70 },
      { id: "delicate", name: "섬세", min: 35 }
    ],
    dryer: [
      { id: "std", name: "표준", min: 40 },
      { id: "strong", name: "강력", min: 55 }
    ]
  };

  var SCENARIOS = {
    rush: {
      name: "저녁 혼잡",
      blurb: "바로 쓸 세탁기는 없고, 7분 뒤 끝나는 기기와 회수 대기가 있습니다.",
      machines: [
        ["W1", "washer", "세탁 1", "run", 7, "표준"],
        ["W2", "washer", "세탁 2", "run", 19, "표준"],
        ["W3", "washer", "세탁 3", "run", 28, "급속"],
        ["W4", "washer", "세탁 4", "hold", 4, null],
        ["W5", "washer", "세탁 5", "run", 36, "이불"],
        ["W6", "washer", "세탁 6", "run", 44, "표준"],
        ["D1", "dryer", "건조 1", "free", 0, null],
        ["D2", "dryer", "건조 2", "run", 12, "표준"]
      ]
    },
    open: {
      name: "자리 있음",
      blurb: "지금 바로 쓸 수 있는 세탁기가 있습니다.",
      machines: [
        ["W1", "washer", "세탁 1", "free", 0, null],
        ["W2", "washer", "세탁 2", "run", 22, "표준"],
        ["W3", "washer", "세탁 3", "free", 0, null],
        ["W4", "washer", "세탁 4", "hold", 5, null],
        ["W5", "washer", "세탁 5", "run", 9, "급속"],
        ["W6", "washer", "세탁 6", "run", 51, "표준"],
        ["D1", "dryer", "건조 1", "free", 0, null],
        ["D2", "dryer", "건조 2", "run", 16, "강력"]
      ]
    },
    hold: {
      name: "회수 대기",
      blurb: "끝난 기기에 빨래가 남아 다음 사람이 기다립니다.",
      machines: [
        ["W1", "washer", "세탁 1", "hold", 2, null],
        ["W2", "washer", "세탁 2", "hold", 6, null],
        ["W3", "washer", "세탁 3", "run", 18, "표준"],
        ["W4", "washer", "세탁 4", "hold", 3, null],
        ["W5", "washer", "세탁 5", "run", 27, "표준"],
        ["W6", "washer", "세탁 6", "hold", 8, null],
        ["D1", "dryer", "건조 1", "hold", 4, null],
        ["D2", "dryer", "건조 2", "free", 0, null]
      ]
    }
  };

  var SPEEDS = [
    { id: 1, label: "1×", desc: "실제 시간" },
    { id: 30, label: "30×", desc: "살펴보기" },
    { id: 120, label: "120×", desc: "발표용" }
  ];

  var state = {
    v: 1,
    building: "B",
    scenario: "rush",
    speed: 1,
    simNow: 0,
    savedAt: Date.now(),
    machines: [],
    myJob: null,
    watch: null,
    postponed: false,
    notifications: [],
    notifSeq: 1,
    seenHelp: false,
    draft: { course: "std", offset: 300 },
    filter: "all",
    pending: null,
    pickupCheck: false
  };

  var lastReal = Date.now();
  var lastPersist = 0;
  var toastTimer = 0;
  var app = document.getElementById("app");

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function noun(type) {
    return type === "dryer" ? "건조기" : "세탁기";
  }

  function byId(id) {
    return state.machines.filter(function (m) { return m.id === id; })[0] || null;
  }

  function isMine(m) {
    return !!(state.myJob && m && state.myJob.machineId === m.id);
  }

  function formatMin(sec) {
    if (sec <= 0) return "0분";
    return Math.ceil(sec / 60) + "분";
  }

  function formatClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function formatNow() {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(new Date());
  }

  function formatAgo(ts) {
    var sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (sec < 10) return "방금";
    if (sec < 60) return sec + "초 전";
    var min = Math.round(sec / 60);
    if (min < 60) return min + "분 전";
    return Math.round(min / 60) + "시간 전";
  }

  function toast(message) {
    var el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function persist() {
    var copy = JSON.parse(JSON.stringify(state));
    delete copy.pending;
    delete copy.pickupCheck;
    copy.savedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(copy));
    } catch (err) {}
    lastPersist = Date.now();
  }

  function summarize(type) {
    var list = state.machines.filter(function (m) { return m.type === type; });
    var free = list.filter(function (m) { return m.status === "free"; });
    var hold = list.filter(function (m) { return m.status === "hold"; });
    var running = list.filter(function (m) { return m.status === "run"; });
    var soonest = null;
    running.forEach(function (m) {
      var remain = m.endAt - state.simNow;
      if (!soonest || remain < soonest.remain) soonest = { m: m, remain: remain };
    });
    return { free: free, hold: hold, running: running, soonest: soonest };
  }

  function focusType() {
    return state.filter === "dryer" ? "dryer" : "washer";
  }

  function decisionKind(summary) {
    if (summary.free.length) return "go";
    if (summary.soonest && summary.soonest.remain <= WAIT_LIMIT) return "soon";
    if (summary.soonest) return "later";
    if (summary.hold.length) return "hold";
    return "empty";
  }

  function reseed(partial) {
    partial = partial || {};
    if (partial.building) state.building = partial.building;
    if (partial.scenario) state.scenario = partial.scenario;
    state.myJob = null;
    state.watch = null;
    state.pickupCheck = false;
    state.postponed = false;
    state.notifications = [];
    state.pending = null;
    var scenario = SCENARIOS[state.scenario] || SCENARIOS.rush;
    var shift = { A: -2, B: 0, C: 4 }[state.building] || 0;
    state.machines = scenario.machines.map(function (row) {
      var min = row[4];
      if (row[3] === "run") {
        var remainMin = Math.max(1, min + (row[1] === "washer" ? shift : 0));
        var dur = remainMin * 60;
        return {
          id: row[0], type: row[1], name: row[2], status: "run", course: row[5],
          endAt: state.simNow + dur, durationSec: dur, holdUntil: null, npcHoldSec: 180
        };
      }
      if (row[3] === "hold") {
        var hold = Math.max(1, min) * 60;
        return {
          id: row[0], type: row[1], name: row[2], status: "hold", course: null,
          endAt: state.simNow, durationSec: 0, holdUntil: state.simNow + hold, npcHoldSec: hold
        };
      }
      return {
        id: row[0], type: row[1], name: row[2], status: "free", course: null,
        endAt: null, durationSec: 0, holdUntil: null, npcHoldSec: 180
      };
    });
    persist();
    if (!partial.silent) {
      toast(state.building + "동 · " + scenario.name + " 상황을 불러왔습니다.");
      go("#/");
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data.v === 1 && Array.isArray(data.machines) && data.machines.length) {
          Object.assign(state, data);
          state.pending = null;
          if (!SCENARIOS[state.scenario]) state.scenario = "rush";
          if (["A", "B", "C"].indexOf(state.building) < 0) state.building = "B";
          if ([1, 30, 120].indexOf(state.speed) < 0) state.speed = 30;
          var gap = (Date.now() - (data.savedAt || Date.now())) / 1000;
          if (gap > 0 && gap < 60 * 60 * 12) state.simNow += gap * state.speed;
          applyTransitions();
          checkWatch({ silent: true });
          checkMyJob({ silent: true });
          return;
        }
      }
    } catch (err) {}
    reseed({ building: "B", scenario: "rush", silent: true });
  }

  function applyTransitions() {
    var changedIds = [];
    state.machines.forEach(function (m) {
      if (m.status === "run" && state.simNow >= m.endAt) {
        m.status = "hold";
        var mine = isMine(m);
        m.holdUntil = mine ? null : state.simNow + (m.npcHoldSec || 180);
        changedIds.push(m.id);
      } else if (m.status === "hold" && m.holdUntil != null && state.simNow >= m.holdUntil) {
        m.status = "free";
        m.course = null;
        m.endAt = null;
        m.durationSec = 0;
        m.holdUntil = null;
        changedIds.push(m.id);
      }
    });
    return changedIds;
  }

  function pushNotif(entry, options) {
    options = options || {};
    state.notifications.unshift({
      id: "n" + state.notifSeq++,
      read: false,
      createdAt: Date.now(),
      title: entry.title,
      body: entry.body,
      machineId: entry.machineId || "",
      kind: entry.kind || "info"
    });
    state.notifications = state.notifications.slice(0, 40);
    if (options.toast) toast(entry.title);
    if (options.system && window.Notification && Notification.permission === "granted") {
      try { new Notification(entry.title, { body: entry.body }); } catch (err) {}
    }
  }

  function checkWatch(options) {
    options = options || {};
    var watch = state.watch;
    if (!watch) return false;
    var machine = byId(watch.machineId);
    if (!machine || machine.status === watch.seen) return false;
    var next = machine.status;
    watch.seen = next;
    if (next === "hold") {
      pushNotif({
        title: machine.name + "이 끝났지만 빨래가 남아 있어요",
        body: "회수 대기입니다. 이름과 호실은 표시하지 않습니다. 비면 다시 알려 드릴게요.",
        machineId: machine.id,
        kind: "watch"
      }, { toast: !options.silent, system: !options.silent });
      return true;
    }
    if (next === "free") {
      pushNotif({
        title: machine.name + "을 지금 쓸 수 있어요",
        body: "지금 내려가면 됩니다.",
        machineId: machine.id,
        kind: "watch"
      }, { toast: !options.silent, system: !options.silent });
      state.watch = null;
      return true;
    }
    return false;
  }

  function checkMyJob(options) {
    options = options || {};
    var job = state.myJob;
    if (!job) return false;
    var machine = byId(job.machineId);
    if (!machine) return false;
    var fired = false;
    if (!job.alertFired && state.simNow >= machine.endAt + job.offsetSec) {
      job.alertFired = true;
      job.alertAt = state.simNow;
      pushNotif({
        title: "세탁이 끝났어요",
        body: job.offsetSec > 0
          ? machine.name + " 종료보다 " + (job.offsetSec / 60) + "분 늦춰 알렸어요. 지금 내려가면 됩니다."
          : machine.name + "이 끝난 시각에 맞춰 알렸어요. 지금 내려가면 됩니다.",
        machineId: machine.id,
        kind: "end"
      }, { toast: !options.silent, system: !options.silent });
      fired = true;
    }
    if (job.alertFired && !job.pickupFired && state.simNow >= job.alertAt + PICKUP_AFTER) {
      job.pickupFired = true;
      pushNotif({
        title: "빨래를 찾아 주세요",
        body: machine.name + "에 빨래가 남아 있어요. 다른 사람에게는 이름 없이 회수 대기로만 보입니다.",
        machineId: machine.id,
        kind: "pickup"
      }, { toast: !options.silent, system: !options.silent });
      fired = true;
    }
    return fired;
  }

  function unreadCount() {
    return state.notifications.filter(function (n) { return !n.read; }).length;
  }

  function requestReseed(partial) {
    if (state.myJob || state.watch) {
      state.pending = partial;
      render();
      return;
    }
    reseed(partial);
    render();
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function route() {
    var parts = (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean);
    if (parts[0] === "m" && parts[1]) return { name: "machine", id: decodeURIComponent(parts[1]) };
    if (parts[0] === "me") return { name: "me" };
    if (parts[0] === "alerts") return { name: "alerts" };
    if (parts[0] === "settings") return { name: "settings" };
    return { name: "home" };
  }

  function icon(type) {
    if (type === "dryer") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 7h8" stroke="currentColor" stroke-width="1.8"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 7h2.2M13.8 7h2.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="14" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  }

  function gear() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="7" r="1.7" fill="currentColor"/><circle cx="15" cy="12" r="1.7" fill="currentColor"/><circle cx="10" cy="17" r="1.7" fill="currentColor"/></svg>';
  }

  function backIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function header(title, meta, back) {
    var side = back
      ? '<a class="iconbtn" href="#/" aria-label="홈으로">' + backIcon() + "</a>"
      : '<a class="iconbtn" href="#/settings" aria-label="설정">' + gear() + "</a>";
    return '<header class="top"><div><h1>' + title + '</h1>' +
      (meta ? '<p class="meta">' + meta + "</p>" : "") +
      "</div>" + side + "</header>";
  }

  function tabs(current) {
    var unread = unreadCount();
    var alertLabel = "알림" + (unread ? '<span class="badge">' + unread + "</span>" : "");
    function tab(hash, name, label) {
      var on = current === name ? ' aria-current="page"' : "";
      return '<a href="' + hash + '"' + on + ">" + label + "</a>";
    }
    return '<nav class="tabbar" aria-label="주요 메뉴">' +
      tab("#/", "home", "홈") +
      tab("#/me", "me", "내 세탁") +
      tab("#/alerts", "alerts", alertLabel) +
      "</nav>";
  }

  function shell(head, body, tab, overlay) {
    return '<div class="phone">' + head +
      '<main class="scroll" id="main">' + body + "</main>" +
      (tab || "") + (overlay || "") + "</div>";
  }

  function remainSpan(endAt, text) {
    return '<span data-remain-end="' + endAt + '">' + esc(text) + "</span>";
  }

  function clockSpan(endAt) {
    return '<span data-clock-end="' + endAt + '">' + esc(formatClock(endAt - state.simNow)) + "</span>";
  }

  function metricCards(summary) {
    var soon;
    var soonClass;
    if (summary.free.length) {
      soon = "지금";
      soonClass = "good";
    } else if (summary.soonest) {
      soon = remainSpan(summary.soonest.m.endAt, formatMin(summary.soonest.remain));
      soonClass = "wait";
    } else {
      soon = "—";
      soonClass = "hold";
    }
    return '<section class="metrics" aria-label="가기 전 판단 정보">' +
      '<div class="metric good"><span>바로 가능</span><strong>' + summary.free.length + "대</strong></div>" +
      '<div class="metric ' + soonClass + '"><span>가장 빨리</span><strong>' + soon + "</strong></div>" +
      '<div class="metric hold"><span>회수 대기</span><strong>' + summary.hold.length + "대</strong></div>" +
      "</section>";
  }

  function decisionCard(type, summary) {
    var kind = decisionKind(summary);
    var name = noun(type);
    var title = "";
    var copy = "";
    var primary = "";
    var secondary = "";
    if (kind === "go") {
      var target = summary.free[0];
      title = "바로 쓸 수 있는 " + name + " " + summary.free.length + "대";
      copy = "세탁실에 가기 전에, 여기서 기기를 고르면 됩니다.";
      primary = '<a class="btn btn-primary" href="#/m/' + target.id + '">' + esc(target.name) + "에서 시작</a>";
    } else if (kind === "soon" || kind === "later") {
      var soon = summary.soonest;
      var watching = state.watch && state.watch.machineId === soon.m.id;
      if (kind === "soon") {
        title = "가장 빠른 " + name + " " + remainSpan(soon.m.endAt, formatMin(soon.remain)) + " 뒤";
        copy = "15분 안쪽이면 기다릴 만한 시간입니다.";
      } else {
        title = "지금은 오래 걸립니다";
        copy = "가장 빠른 " + name + "가 " + remainSpan(soon.m.endAt, formatMin(soon.remain)) + " 뒤입니다. 갔다가 다시 올라오기 쉬운 시간입니다.";
      }
      if (summary.hold.length) {
        copy += " 회수 대기 " + summary.hold.length + "대는 빨래가 남아 있어 쓸 수 없습니다.";
      }
      primary = '<button class="btn btn-primary" type="button" data-action="watch" data-id="' + soon.m.id + '">' +
        (watching ? "알림 예약 취소" : "끝나면 알려 주세요") + "</button>";
    } else if (kind === "hold") {
      var held = summary.hold[0];
      var watchingHold = state.watch && state.watch.machineId === held.id;
      title = "빈 " + name + "가 없습니다";
      copy = "끝난 기기에 빨래가 남아 있습니다. 이름과 호실은 보이지 않습니다.";
      primary = '<button class="btn btn-primary" type="button" data-action="watch" data-id="' + held.id + '">' +
        (watchingHold ? "알림 예약 취소" : "비면 알려 주세요") + "</button>";
    } else {
      title = "표시할 기기가 없습니다";
      copy = "설정에서 상황을 다시 불러와 주세요.";
    }
    if (kind !== "empty") {
      secondary = '<button class="btn btn-secondary" type="button" data-action="' +
        (state.postponed ? "resume" : "postpone") + '">' +
        (state.postponed ? "다시 오늘 정하기" : "오늘은 미룰게요") + "</button>";
    }
    return '<section class="decision ' + kind + '" aria-live="polite">' +
      '<p class="kicker">지금 결정</p><h2>' + title + "</h2><p>" + copy + "</p>" +
      '<div class="actions">' + primary + secondary + "</div></section>";
  }

  function strips() {
    var html = "";
    if (state.postponed) {
      html += '<div class="banner"><p>오늘은 세탁을 미뤘어요.</p>' +
        '<button type="button" data-action="resume">다시 보기</button></div>';
    }
    if (state.myJob) {
      var mine = byId(state.myJob.machineId);
      if (mine) {
        var extra = mine.status === "run"
          ? remainSpan(mine.endAt, formatMin(mine.endAt - state.simNow)) + " 남음"
          : "세탁이 끝남";
        var offset = state.myJob.offsetSec ? "알림 +" + (state.myJob.offsetSec / 60) + "분" : "알림 정시";
        html += '<div class="strip"><p><strong>내 세탁</strong> · ' + esc(mine.name) + " · " + extra + " · " + offset + "</p>" +
          '<a href="#/me">보기</a></div>';
      }
    }
    if (state.watch) {
      var watched = byId(state.watch.machineId);
      if (watched) {
        var when = watched.status === "hold" ? "비면" : "끝나면";
        html += '<div class="strip"><p>' + esc(watched.name) + "이 " + when + " 알려 드릴게요.</p>" +
          '<button type="button" data-action="watch" data-id="' + watched.id + '">끄기</button></div>';
      }
    }
    return html;
  }

  function machineRow(m) {
    var mine = isMine(m);
    var watched = state.watch && state.watch.machineId === m.id;
    var cls = "machine" + (mine ? " mine" : "") + (watched ? " watched" : "");
    var tag = mine ? '<em class="tag">내 세탁</em>' : (watched ? '<em class="tag">알림 예약</em>' : "");
    var sub = m.status === "hold"
      ? (mine ? "내 빨래가 아직 안에 있어요" : "이전 이용자 빨래 · 회수 대기")
      : ((m.course ? esc(m.course) + " · " : "") + (m.status === "free" ? "바로 가능" : "사용 중"));
    var side;
    if (m.status === "run") {
      side = '<span class="remain wait" data-remain-end="' + m.endAt + '">' + esc(formatMin(m.endAt - state.simNow)) + "</span>";
      if (!mine) {
        side += '<button class="mini" type="button" data-action="watch" data-id="' + m.id + '">' +
          (watched ? "알림 끔" : "알림") + "</button>";
      }
    } else if (m.status === "hold") {
      side = '<span class="remain hold">회수 대기</span>';
      if (!mine) {
        side += '<button class="mini" type="button" data-action="watch" data-id="' + m.id + '">' +
          (watched ? "알림 끔" : "빈 뒤 알림") + "</button>";
      }
    } else {
      side = '<span class="remain good">바로 가능</span>';
    }
    var bar = "";
    if (m.status === "run" && m.durationSec > 0) {
      var ratio = Math.max(0, Math.min(100, ((m.endAt - state.simNow) / m.durationSec) * 100));
      bar = '<div class="bar" aria-hidden="true"><i data-bar-end="' + m.endAt + '" data-bar-dur="' + m.durationSec + '" style="width:' + ratio + '%"></i></div>';
    }
    return '<article class="' + cls + '"><div class="machine-row"><a class="machine-link" href="#/m/' + m.id + '">' +
      '<span class="mark">' + icon(m.type) + "</span>" +
      '<span class="txt"><span class="name">' + esc(m.name) + tag + "</span>" +
      '<span class="sub">' + sub + "</span>" + bar + "</span></a>" +
      '<div class="side">' + side + "</div></div></article>";
  }

  function machineList() {
    var types = state.filter === "all" ? ["washer", "dryer"] : [state.filter];
    return types.map(function (type) {
      var rows = state.machines.filter(function (m) { return m.type === type; }).map(machineRow).join("");
      return '<h3 class="group-title">' + (type === "washer" ? "세탁기" : "건조기") + "</h3>" +
        '<div class="stack">' + rows + "</div>";
    }).join("");
  }

  function renderHome() {
    var type = focusType();
    var summary = summarize(type);
    var other = type === "washer" ? summarize("dryer") : null;
    var dryerLine = "";
    if (other && state.filter === "all") {
      if (other.free.length) dryerLine = "건조기는 지금 " + other.free.length + "대 비어 있습니다.";
      else if (other.soonest) dryerLine = "건조기는 가장 빨리 " + remainSpan(other.soonest.m.endAt, formatMin(other.soonest.remain)) + " 뒤 비습니다.";
      else dryerLine = "건조기는 모두 회수 대기입니다.";
    }
    var scenario = SCENARIOS[state.scenario];
    var meta = state.building + '동 지하 · <span data-now>' + esc(formatNow()) + "</span> · " +
      '<a href="#/settings">' + state.speed + "배속</a>";
    var help = state.seenHelp ? "" :
      '<div class="note"><p>이 세 숫자만 보고, 지금 갈지 기다릴지 미룰지 정하세요.</p>' +
      '<button type="button" data-action="dismiss-help">알겠어요</button></div>';
    var body = metricCards(summary) + help + strips() +
      decisionCard(type, summary) +
      '<div class="chips" role="radiogroup" aria-label="기기 종류">' +
      chip("filter", "all", "전체", state.filter === "all") +
      chip("filter", "washer", "세탁", state.filter === "washer") +
      chip("filter", "dryer", "건조", state.filter === "dryer") +
      "</div>" +
      machineList() +
      (dryerLine ? '<p class="footnote">' + dryerLine + "</p>" : "") +
      '<p class="footnote">지금 상황: ' + esc(scenario.name) + ". " + esc(scenario.blurb) + "</p>" +
      '<p class="footnote">기기 상태는 센서 없이 만든 시뮬레이션입니다. 끝나는 알림을 바로 보려면 설정에서 120배속으로 바꾸세요.</p>';
    return shell(header("지금 빈 세탁기", meta, false), body, tabs("home"), dialog());
  }

  function chip(action, id, label, on) {
    return '<button class="chip" type="button" data-action="' + action + '" data-id="' + id + '" aria-pressed="' +
      (on ? "true" : "false") + '">' + label + "</button>";
  }

  function renderMachine(id) {
    var m = byId(id);
    if (!m) {
      return shell(header("기기", "", true), '<div class="empty">없는 기기입니다.</div>', tabs(""), dialog());
    }
    var courses = COURSES[m.type];
    if (!courses.some(function (c) { return c.id === state.draft.course; })) state.draft.course = courses[0].id;
    var title = esc(m.name);
    var body = "";
    if (m.status === "free" && state.myJob) {
      body = '<section class="panel"><h2>이미 진행 중인 세탁이 있어요</h2>' +
        '<p>새 기기를 시작하려면 내 세탁을 먼저 마무리하거나 취소하세요.</p>' +
        '<a class="btn btn-primary" href="#/me">내 세탁 보기</a></section>';
    } else if (m.status === "free") {
      body = '<section class="panel"><h2>바로 쓸 수 있어요</h2>' +
        "<p>기본값 그대로 한 번만 눌러도 종료 알림이 예약됩니다. 표시 시각에 맞춰 가면 아직 돌고 있을 때를 피하려고, 기본은 5분 뒤입니다.</p>" +
        '<span class="field-label">코스</span><div class="chips" role="radiogroup" aria-label="코스">' +
        courses.map(function (c) {
          return chip("course", c.id, c.name + " · " + c.min + "분", state.draft.course === c.id);
        }).join("") + "</div>" +
        '<span class="field-label">종료 알림</span><div class="chips" role="radiogroup" aria-label="종료 알림 시점">' +
        chip("offset", "0", "정시", state.draft.offset === 0) +
        chip("offset", "300", "+5분 추천", state.draft.offset === 300) +
        "</div>" +
        '<button class="btn btn-primary" type="button" data-action="begin" data-id="' + m.id + '">종료 알림 예약하고 시작</button></section>';
    } else if (m.status === "run") {
      var remain = m.endAt - state.simNow;
      body = '<section class="panel"><h2>' + (isMine(m) ? "내 세탁이 진행 중이에요" : "사용 중이에요") + "</h2>" +
        '<p class="clock">' + clockSpan(m.endAt) + "</p>" +
        "<p>" + esc(m.course || "세탁") + " · " + remainSpan(m.endAt, formatMin(remain)) + " 남음</p>";
      if (isMine(m)) {
        var mode = state.myJob.offsetSec ? "종료 " + (state.myJob.offsetSec / 60) + "분 뒤" : "끝나는 시각";
        body += "<p>종료 알림은 " + mode + "에 오도록 예약되어 있어요.</p>" +
          collectActions() +
          '<a class="btn btn-ghost" href="#/me">내 세탁 보기</a>';
      } else {
        var watching = state.watch && state.watch.machineId === m.id;
        body += '<button class="btn btn-primary" type="button" data-action="watch" data-id="' + m.id + '">' +
          (watching ? "알림 예약 취소" : "끝나면 알려 주세요") + "</button>";
      }
      body += "</section>";
    } else {
      body = '<section class="panel"><h2>' + (isMine(m) ? "내 빨래가 안에 있어요" : "지금은 쓸 수 없어요") + "</h2>";
      if (isMine(m)) {
        var waitAlert = "";
        if (!state.myJob.alertFired) {
          var alertAt = m.endAt + state.myJob.offsetSec;
          waitAlert = "<p>알림은 " + remainSpan(alertAt, formatMin(alertAt - state.simNow)) + " 뒤에 와요. 그 전에 찾으러 가도 됩니다.</p>";
        } else if (!state.myJob.pickupFired) {
          waitAlert = "<p>종료 알림을 보냈어요. 한참 동안 찾아가지 않으면 회수 알림이 한 번 더 옵니다.</p>";
        } else {
          waitAlert = "<p>회수 알림을 보냈어요. 다른 사람에게는 이름 없이 회수 대기로만 보입니다.</p>";
        }
        body += waitAlert + collectActions();
      } else {
        var watchingHold = state.watch && state.watch.machineId === m.id;
        body += "<p>세탁은 끝났지만 이전 이용자의 빨래가 남아 있습니다. 누구의 빨래인지는 표시하지 않습니다. 직접 꺼내지 말고, 비면 알림을 받으세요.</p>" +
          '<button class="btn btn-primary" type="button" data-action="watch" data-id="' + m.id + '">' +
          (watchingHold ? "알림 예약 취소" : "비면 알려 주세요") + "</button>";
      }
      body += "</section>";
    }
    return shell(header(title, noun(m.type) + " · " + state.building + "동 지하", true), body, tabs(""), dialog());
  }

  function renderMe() {
    var job = state.myJob;
    var body;
    if (!job) {
      body = '<div class="empty"><strong>진행 중인 세탁이 없어요.</strong><p>홈에서 빈 기기를 고르면 종료 알림까지 한 번에 예약됩니다.</p>' +
        '<a class="btn btn-primary" href="#/">홈으로</a></div>';
    } else {
      var m = byId(job.machineId);
      if (!m) {
        state.myJob = null;
        body = '<div class="empty">예약 정보를 찾지 못했습니다.</div>';
      } else if (m.status === "run") {
        body = '<section class="panel"><h2>' + esc(m.name) + "</h2>" +
          '<p class="clock">' + clockSpan(m.endAt) + "</p>" +
          "<p>" + esc(m.course || "") + " · 알림 " + (job.offsetSec ? "+" + (job.offsetSec / 60) + "분" : "정시") + "</p>" +
          "<p>끝나면 알림함에 알려 드리고, 찾아가지 않으면 10분 뒤 회수 알림이 한 번 더 옵니다. 빨래를 찾았다고 해도 세탁기 표시와 같아야 끝납니다.</p>" +
          collectActions() +
          '<button class="btn btn-ghost" type="button" data-action="abandon-job">알림만 끄기</button></section>';
      } else {
        var early = "";
        if (!job.alertFired) {
          var alertAt = m.endAt + job.offsetSec;
          early = "<p>알림은 " + remainSpan(alertAt, formatMin(alertAt - state.simNow)) + " 뒤에 옵니다. 그 전에 찾으러 가도 됩니다.</p>";
        } else if (job.pickupFired) {
          early = "<p>회수 알림까지 보낸 상태입니다. 다른 사람에게는 이름 없이 회수 대기로만 보입니다.</p>";
        } else {
          early = "<p>종료 알림을 보냈습니다. 찾아가지 않으면 회수 알림이 한 번 더 옵니다.</p>";
        }
        body = '<section class="panel"><h2>빨래를 찾을 시간이에요</h2>' +
          "<p>" + esc(m.name) + " 세탁이 끝났는지 세탁기 표시와 맞춰 봅니다.</p>" + early +
          collectActions() +
          '<button class="btn btn-text" type="button" data-action="abandon-job">알림만 끄기</button></section>';
      }
    }
    return shell(header("내 세탁", state.building + "동 지하", false), body, tabs("me"), dialog());
  }

  function renderAlerts() {
    state.notifications.forEach(function (n) { n.read = true; });
    persist();
    var body;
    if (!state.notifications.length) {
      body = '<div class="empty">아직 알림이 없어요. 홈에서 끝나는 기기를 예약하면 여기에 쌓입니다.</div>';
    } else {
      body = state.notifications.map(function (n) {
        var inner = "<strong>" + esc(n.title) + "</strong><p>" + esc(n.body) + '</p><span>' + esc(formatAgo(n.createdAt)) + "</span>";
        if (n.machineId) return '<a class="alert" href="#/m/' + n.machineId + '">' + inner + "</a>";
        return '<article class="alert">' + inner + "</article>";
      }).join("") + '<button class="btn btn-ghost" type="button" data-action="clear-alerts">알림 기록 지우기</button>';
    }
    return shell(header("알림", "앱 안 알림함", false), body, tabs("alerts"), dialog());
  }

  function renderSettings() {
    var perm = !window.Notification ? "이 브라우저는 시스템 알림을 지원하지 않습니다." :
      Notification.permission === "granted" ? "휴대폰 알림이 켜져 있습니다." :
      Notification.permission === "denied" ? "휴대폰 알림이 차단되어 있습니다. 앱 안 알림함은 계속 씁니다." :
      "휴대폰 알림은 아직 요청하지 않았습니다.";
    var buildings = ["A", "B", "C"].map(function (id) {
      return chip("building", id, id + "동", state.building === id);
    }).join("");
    var scenarios = Object.keys(SCENARIOS).map(function (id) {
      var on = state.scenario === id;
      return '<button class="chip" type="button" data-action="scenario" data-id="' + id + '" aria-pressed="' + on + '">' +
        esc(SCENARIOS[id].name) + (on ? " · 다시" : "") + "</button>";
    }).join("");
    var speeds = SPEEDS.map(function (s) {
      return '<button class="chip" type="button" data-action="speed" data-id="' + s.id + '" aria-pressed="' +
        (state.speed === s.id) + '">' + s.label + " " + s.desc + "</button>";
    }).join("");
    var body = '<section class="panel"><h2>내 세탁실</h2><p>즐겨 찾는 동입니다. A동은 남은 시간이 조금 짧고, C동은 조금 깁니다.</p><div class="chips">' + buildings + "</div></section>" +
      '<section class="panel"><h2>상황</h2><p>센서가 없으므로 발표와 확인용 상황을 고릅니다. 같은 상황을 다시 누르면 처음 시각으로 되돌아갑니다.</p><div class="chips">' + scenarios + "</div></section>" +
      '<section class="panel"><h2>시간 배속</h2><p>발표할 때는 120×가 적당합니다. 7분이 실제 3.5초입니다.</p><div class="chips">' + speeds + "</div></section>" +
      '<section class="panel"><h2>알림</h2><p>' + esc(perm) + "</p>" +
      '<button class="btn btn-primary" type="button" data-action="notify-permission">휴대폰 알림 허용</button></section>' +
      '<section class="panel"><h2>이 프로토타입</h2><p>국립목포대학교 생활관 공용 세탁실을 가정한 모바일 웹입니다. 관리자 화면, 고장 신고, 결제, 다국어, 실제 기기 연동은 범위 밖입니다.</p>' +
      '<button class="btn btn-ghost" type="button" data-action="reset">처음 화면으로 되돌리기</button></section>';
    return shell(header("설정", "", true), body, tabs(""), dialog());
  }

  function dialog() {
    if (!state.pending) return "";
    var reset = !!state.pending.reset;
    return '<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">' +
      '<h2 id="confirm-title">' + (reset ? "처음 화면으로 되돌릴까요?" : "상황을 바꿀까요?") + "</h2>" +
      "<p>" + (reset
        ? "동, 상황, 배속, 알림 기록이 처음 상태로 돌아갑니다."
        : "진행 중인 세탁과 알림 예약이 초기화됩니다.") + "</p>" +
      '<div class="actions"><button class="btn btn-primary" type="button" data-action="confirm-pending">' +
      (reset ? "처음 화면으로" : "바꾸고 초기화") + "</button>" +
      '<button class="btn btn-ghost" type="button" data-action="cancel-pending">취소</button></div></div></div>';
  }

  function render() {
    var scroller = document.querySelector(".scroll");
    var top = scroller ? scroller.scrollTop : 0;
    var current = route();
    document.title = current.name === "home" ? "지금 빈 세탁기" : "지금 빈 세탁기";
    var html;
    if (current.name === "machine") html = renderMachine(current.id);
    else if (current.name === "me") html = renderMe();
    else if (current.name === "alerts") html = renderAlerts();
    else if (current.name === "settings") html = renderSettings();
    else html = renderHome();
    app.innerHTML = html;
    var next = document.querySelector(".scroll");
    if (next) next.scrollTop = top;
  }

  function patch() {
    document.querySelectorAll("[data-now]").forEach(function (el) { el.textContent = formatNow(); });
    document.querySelectorAll("[data-remain-end]").forEach(function (el) {
      el.textContent = formatMin(Number(el.getAttribute("data-remain-end")) - state.simNow);
    });
    document.querySelectorAll("[data-clock-end]").forEach(function (el) {
      el.textContent = formatClock(Number(el.getAttribute("data-clock-end")) - state.simNow);
    });
    document.querySelectorAll("[data-bar-end]").forEach(function (el) {
      var end = Number(el.getAttribute("data-bar-end"));
      var dur = Number(el.getAttribute("data-bar-dur"));
      var remain = Math.max(0, end - state.simNow);
      el.style.width = (dur ? Math.max(0, Math.min(100, (remain / dur) * 100)) : 0) + "%";
    });
  }

  function toggleWatch(id) {
    var machine = byId(id);
    if (!machine) return;
    if (isMine(machine)) {
      toast("내 세탁 알림은 이미 예약되어 있어요.");
      return;
    }
    if (state.watch && state.watch.machineId === id) {
      state.watch = null;
      toast("알림 예약을 지웠어요.");
      persist();
      render();
      return;
    }
    if (machine.status === "free") {
      toast("이미 비어 있어요. 지금 시작하면 됩니다.");
      return;
    }
    state.watch = { machineId: id, seen: machine.status };
    toast(machine.status === "hold" ? machine.name + "이 비면 알려 드릴게요." : machine.name + "이 끝나면 알려 드릴게요.");
    persist();
    render();
  }

  function begin(id) {
    var machine = byId(id);
    if (!machine || machine.status !== "free") {
      toast("이미 다른 사람이 쓰기 시작했어요. 홈에서 다시 확인해 주세요.");
      go("#/");
      return;
    }
    if (state.myJob) {
      toast("진행 중인 세탁이 있어요. 내 세탁에서 먼저 마무리해 주세요.");
      return;
    }
    var courses = COURSES[machine.type];
    var course = courses.filter(function (c) { return c.id === state.draft.course; })[0] || courses[0];
    var offsetSec = Number(state.draft.offset) === 0 ? 0 : 300;
    var dur = course.min * 60;
    machine.status = "run";
    machine.course = course.name;
    machine.durationSec = dur;
    machine.endAt = state.simNow + dur;
    machine.holdUntil = null;
    state.myJob = {
      machineId: machine.id,
      courseName: course.name,
      offsetSec: offsetSec,
      alertFired: false,
      alertAt: null,
      pickupFired: false
    };
    if (state.watch && state.watch.machineId === machine.id) state.watch = null;
    state.postponed = false;
    pushNotif({
      title: "종료 알림을 예약했어요",
      body: machine.name + " · " + course.name + " · " + (offsetSec ? "종료 " + (offsetSec / 60) + "분 뒤에 알려 드려요." : "끝나는 시각에 알려 드려요."),
      machineId: machine.id,
      kind: "booked"
    });
    toast("종료 알림을 예약하고 시작했어요.");
    persist();
    go("#/me");
  }

  function machineStateLine(machine) {
    if (!machine) return "연결된 세탁기 없음";
    if (machine.status === "run") return "사용 중 · " + formatMin(machine.endAt - state.simNow) + " 남음";
    if (machine.status === "hold") return "종료됨 · 안에 빨래 있음";
    if (machine.status === "free") return "비어 있음";
    return "상태 없음";
  }

  function assessPickup() {
    var job = state.myJob;
    var machine = job && byId(job.machineId);
    var issues = [];
    if (!job || !machine) {
      issues.push("내 예약과 연결된 세탁기가 없습니다.");
      return { ok: false, issues: issues, machine: machine, job: job };
    }
    if (job.machineId !== machine.id) issues.push("예약한 기기와 세탁기 번호가 다릅니다.");
    if (machine.status === "run" || (machine.endAt != null && state.simNow < machine.endAt)) {
      issues.push(machine.name + "은 아직 돌아가는 중입니다. 표시창에 남은 시간이 있어 회수로 볼 수 없어요.");
    } else if (machine.status === "free") {
      issues.push(machine.name + " 표시창은 이미 비어 있습니다. 안에 빨래가 없다고 나옵니다.");
    } else if (machine.status !== "hold") {
      issues.push(machine.name + " 상태를 회수로 확인할 수 없습니다.");
    } else if (!isMine(machine)) {
      issues.push("이 빨래는 내 예약과 연결되어 있지 않습니다.");
    }
    if (machine.status === "hold" && job.courseName && machine.course && job.courseName !== machine.course) {
      issues.push("예약한 코스(" + job.courseName + ")와 세탁기 코스(" + machine.course + ")가 다릅니다.");
    }
    return { ok: issues.length === 0, issues: issues, machine: machine, job: job };
  }

  function collectActions() {
    if (!state.pickupCheck) {
      return '<button class="btn btn-primary" type="button" data-action="collect">빨래를 찾았어요</button>';
    }
    var result = assessPickup();
    var machine = result.machine;
    var job = result.job;
    var compare = "";
    if (job && machine) {
      compare = '<div class="compare">' +
        '<div><span class="k">내 기록</span><strong>' + esc(machine.name) + "에서 꺼냄</strong><span class=\"sub\">" +
        esc(job.courseName || "코스 기록 없음") + "</span></div>" +
        '<div><span class="k">세탁기 표시</span><strong>' + esc(machineStateLine(machine)) + "</strong><span class=\"sub\">" +
        esc(machine.course || "표시된 코스 없음") + "</span></div></div>";
    }
    var verdict = result.ok
      ? '<p class="verdict ok">세탁기 표시와 같습니다. 끝난 기기에 예약한 빨래가 남아 있습니다.</p>'
      : '<p class="verdict bad">세탁기 표시와 달라서 회수로 끝내지 않습니다.</p><ul class="issues">' +
        result.issues.map(function (text) { return "<li>" + esc(text) + "</li>"; }).join("") + "</ul>";
    var action = result.ok
      ? '<button class="btn btn-primary" type="button" data-action="confirm-pickup">맞춰 보고 회수 확정</button>'
      : '<button class="btn btn-primary" type="button" data-action="close-pickup">돌아가기</button>';
    return '<section class="panel"><h2>세탁기와 맞춰 보기</h2>' +
      "<p>빨래를 찾았다는 말과 세탁기 표시가 같은지 확인합니다. 다르면 여기서 끝내지 않습니다.</p>" +
      compare + verdict + action + "</section>";
  }

  function collect() {
    if (!state.myJob) {
      toast("진행 중인 세탁이 없어요.");
      return;
    }
    state.pickupCheck = true;
    var result = assessPickup();
    toast(result.ok ? "세탁기 표시와 같습니다. 회수를 확정하면 끝나요." : "세탁기 표시와 달라서 회수로 처리하지 않았어요.");
    render();
  }

  function confirmPickup() {
    var result = assessPickup();
    if (!result.ok || !result.machine) {
      state.pickupCheck = true;
      toast("세탁기 표시와 아직 맞지 않아요. 회수는 끝나지 않았습니다.");
      render();
      return;
    }
    var machine = result.machine;
    machine.status = "free";
    machine.course = null;
    machine.endAt = null;
    machine.holdUntil = null;
    machine.durationSec = 0;
    state.myJob = null;
    state.pickupCheck = false;
    pushNotif({
      title: "회수를 확인했어요",
      body: machine.name + " 표시가 빈 기기로 바뀌었습니다. 내 기록과 세탁기 상태가 같았습니다.",
      machineId: machine.id,
      kind: "picked"
    });
    toast(machine.name + " 표시와 맞아서 회수를 끝냈어요.");
    persist();
    render();
  }

  function abandonJob() {
    var job = state.myJob;
    var machine = job && byId(job.machineId);
    state.myJob = null;
    state.pickupCheck = false;
    if (machine && machine.status === "hold" && machine.holdUntil == null) {
      machine.holdUntil = state.simNow + (machine.npcHoldSec || 180);
    }
    toast("알림만 껐어요. 세탁기 표시는 그대로 둡니다.");
    persist();
    render();
  }

  function onClick(event) {
    var btn = event.target.closest("[data-action]");
    if (!btn || !app.contains(btn)) return;
    var action = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");
    if (action === "filter") {
      state.filter = id;
      persist();
      render();
    } else if (action === "watch") {
      toggleWatch(id);
    } else if (action === "postpone") {
      state.postponed = true;
      toast("오늘은 세탁을 미뤘어요. 홈에서 언제든 다시 볼 수 있어요.");
      persist();
      render();
    } else if (action === "resume") {
      state.postponed = false;
      persist();
      render();
    } else if (action === "dismiss-help") {
      state.seenHelp = true;
      persist();
      render();
    } else if (action === "course") {
      state.draft.course = id;
      persist();
      render();
    } else if (action === "offset") {
      state.draft.offset = Number(id);
      persist();
      render();
    } else if (action === "begin") {
      begin(id);
    } else if (action === "collect") {
      collect();
    } else if (action === "confirm-pickup") {
      confirmPickup();
    } else if (action === "close-pickup") {
      state.pickupCheck = false;
      render();
    } else if (action === "abandon-job") {
      abandonJob();
    } else if (action === "clear-alerts") {
      state.notifications = [];
      persist();
      render();
    } else if (action === "building" || action === "scenario") {
      var partial = action === "building" ? { building: id } : { scenario: id };
      requestReseed(partial);
    } else if (action === "speed") {
      state.speed = Number(id);
      toast(state.speed + "배속으로 바꿨어요.");
      persist();
      render();
    } else if (action === "notify-permission") {
      if (!window.Notification) {
        toast("이 브라우저는 알림을 지원하지 않아요. 앱 안 알림은 그대로 보여요.");
        return;
      }
      Notification.requestPermission().then(function (result) {
        toast(result === "granted" ? "휴대폰 알림을 켰어요." : "휴대폰 알림은 꺼져 있어요. 앱 안 알림함은 계속 씁니다.");
        render();
      });
    } else if (action === "reset") {
      state.pending = { reset: true };
      render();
    } else if (action === "confirm-pending") {
      var pending = state.pending;
      state.pending = null;
      if (pending && pending.reset) {
        state.building = "B";
        state.scenario = "rush";
        state.speed = 1;
        state.seenHelp = false;
        state.draft = { course: "std", offset: 300 };
        state.filter = "all";
        state.notifSeq = 1;
        state.simNow = 0;
        reseed({ silent: true });
        toast("처음 화면으로 되돌렸어요.");
        go("#/");
      } else {
        reseed(pending || {});
        render();
      }
    } else if (action === "cancel-pending") {
      state.pending = null;
      render();
    }
  }

  function tick() {
    var now = Date.now();
    var dt = (now - lastReal) / 1000;
    lastReal = now;
    if (dt < 0) dt = 0;
    if (dt > 30) dt = 30;
    state.simNow += dt * state.speed;
    var here = route();
    var before = here.name === "home" ? decisionKind(summarize(focusType())) : "";
    var changedIds = applyTransitions();
    var alerted = checkWatch() || checkMyJob();
    var after = here.name === "home" ? decisionKind(summarize(focusType())) : "";
    var visible = false;
    if (here.name === "home") visible = changedIds.length > 0 || before !== after;
    else if (here.name === "me" && state.myJob) visible = changedIds.indexOf(state.myJob.machineId) >= 0;
    else if (here.name === "machine") visible = changedIds.indexOf(here.id) >= 0;
    if (alerted || visible) {
      persist();
      render();
    } else {
      patch();
      if (changedIds.length || now - lastPersist > 2000) persist();
    }
  }

  app.addEventListener("click", onClick);
  window.addEventListener("hashchange", render);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && state.pending) {
      state.pending = null;
      render();
    }
  });

  load();
  lastReal = Date.now();
  render();
  setInterval(tick, 250);
})();
