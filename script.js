"use strict";

/* =========================================
   ÚTILHUB V8
   Herramientas + almacenamiento + respaldo
========================================= */

const $ = (id) => document.getElementById(id);

function toast(message) {
  const box = $("toast");
  box.textContent = message;
  box.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    box.classList.remove("show");
  }, 2600);
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast("No se pudo guardar la información.");
  }
}

function load(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function money(value) {
  return "S/ " + Number(value).toFixed(2);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================
   TEMA
========================================= */

const savedTheme = localStorage.getItem("utilhub-theme");

if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
}

$("themeBtn").addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;

  if (current === "light") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("utilhub-theme", "dark");
    $("themeBtn").textContent = "☀️";
  } else {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("utilhub-theme", "light");
    $("themeBtn").textContent = "🌙";
  }
});

if (savedTheme === "light") {
  $("themeBtn").textContent = "🌙";
}

/* =========================================
   MENÚ
========================================= */

$("menuBtn").addEventListener("click", () => {
  $("nav").classList.toggle("open");
});

document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", () => {
    $("nav").classList.remove("open");
  });
});

/* =========================================
   CONEXIÓN
========================================= */

function updateConnection() {
  if (navigator.onLine) {
    $("connectionDot").textContent = "🟢";
    $("connectionText").textContent = "Conectado";
  } else {
    $("connectionDot").textContent = "🔴";
    $("connectionText").textContent = "Sin conexión";
  }
}

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
updateConnection();

/* =========================================
   BUSCADOR GENERAL
========================================= */

const cards = [...document.querySelectorAll(".tool-card")];

$("globalSearch").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase().trim();

  cards.forEach(card => {
    const text = (
      card.textContent +
      " " +
      card.dataset.keywords
    ).toLowerCase();

    card.classList.toggle(
      "hidden",
      query !== "" && !text.includes(query)
    );
  });

  if (query) {
    $("herramientas").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

/* =========================================
   CATEGORÍAS
========================================= */

document.querySelectorAll(".category").forEach(button => {
  button.addEventListener("click", () => {

    document.querySelectorAll(".category")
      .forEach(b => b.classList.remove("active"));

    button.classList.add("active");

    const filter = button.dataset.filter;

    cards.forEach(card => {
      card.classList.toggle(
        "hidden",
        filter !== "all" && card.dataset.category !== filter
      );
    });

    $("globalSearch").value = "";
  });
});

/* =========================================
   CALCULADORA SEGURA
========================================= */

function calculateSafe(expression) {

  const clean = expression.replace(/\s+/g, "");

  if (!clean || clean.length > 100) {
    throw new Error("Expresión inválida");
  }

  const tokens = clean.match(
    /(?:\d+(?:\.\d*)?|\.\d+|[()+\-*/%])/g
  );

  if (!tokens || tokens.join("") !== clean) {
    throw new Error("Caracteres no permitidos");
  }

  let position = 0;

  function peek() {
    return tokens[position];
  }

  function expressionParser() {
    let value = term();

    while (peek() === "+" || peek() === "-") {
      const op = tokens[position++];

      const right = term();

      value = op === "+"
        ? value + right
        : value - right;
    }

    return value;
  }

  function term() {
    let value = unary();

    while (peek() === "*" || peek() === "/") {

      const op = tokens[position++];
      const right = unary();

      if (op === "/" && right === 0) {
        throw new Error("No se puede dividir entre cero");
      }

      value = op === "*"
        ? value * right
        : value / right;
    }

    return value;
  }

  function unary() {

    if (peek() === "+") {
      position++;
      return unary();
    }

    if (peek() === "-") {
      position++;
      return -unary();
    }

    return primary();
  }

  function primary() {

    let value;

    if (peek() === "(") {

      position++;

      value = expressionParser();

      if (peek() !== ")") {
        throw new Error("Falta cerrar paréntesis");
      }

      position++;

    } else {

      const token = peek();

      if (!token || !/^\d*\.?\d+$/.test(token)) {
        throw new Error("Número inválido");
      }

      position++;
      value = Number(token);
    }

    while (peek() === "%") {
      position++;
      value /= 100;
    }

    return value;
  }

  const result = expressionParser();

  if (position !== tokens.length) {
    throw new Error("Expresión incompleta");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Resultado inválido");
  }

  return result;
}

$("calcBtn").addEventListener("click", () => {

  try {
    const result = calculateSafe($("calcInput").value);

    $("calcResult").textContent =
      "Resultado: " + result;

  } catch (error) {
    $("calcResult").textContent =
      "Error: " + error.message;
  }
});

$("calcClear").addEventListener("click", () => {
  $("calcInput").value = "";
  $("calcResult").textContent = "Resultado: —";
});

/* =========================================
   PORCENTAJE
========================================= */

$("percentBtn").addEventListener("click", () => {

  const number = Number($("percentNumber").value);
  const percent = Number($("percentValue").value);

  if (!Number.isFinite(number) || !Number.isFinite(percent)) {
    $("percentResult").textContent = "Introduce valores válidos.";
    return;
  }

  $("percentResult").textContent =
    "Resultado: " + (number * percent / 100).toFixed(2);
});

/* =========================================
   DESCUENTO
========================================= */

$("discountBtn").addEventListener("click", () => {

  const price = Number($("discountPrice").value);
  const percent = Number($("discountPercent").value);

  if (price < 0 || percent < 0) {
    $("discountResult").textContent = "Valores inválidos.";
    return;
  }

  const discount = price * percent / 100;
  const finalPrice = price - discount;

  $("discountResult").innerHTML =
    `Descuento: <b>${money(discount)}</b><br>
     Precio final: <b>${money(finalPrice)}</b>`;
});

/* =========================================
   REGLA DE 3
========================================= */

$("ruleBtn").addEventListener("click", () => {

  const a = Number($("r3a").value);
  const b = Number($("r3b").value);
  const c = Number($("r3c").value);

  if (!a || !Number.isFinite(b) || !Number.isFinite(c)) {
    $("ruleResult").textContent = "Introduce valores válidos.";
    return;
  }

  const x = (b * c) / a;

  $("ruleResult").textContent =
    "X = " + x.toFixed(4);
});

/* =========================================
   CONVERSOR DE UNIDADES
========================================= */

const units = {

  length: {
    m: 1,
    km: 1000,
    cm: .01,
    mm: .001,
    mi: 1609.344,
    yd: .9144,
    ft: .3048,
    in: .0254
  },

  weight: {
    kg: 1,
    g: .001,
    mg: .000001,
    lb: .45359237,
    oz: .0283495
  },

  volume: {
    l: 1,
    ml: .001,
    m3: 1000,
    gal: 3.78541,
    cup: .236588
  },

  data: {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4
  }

};

const unitNames = {
  length: {
    m: "Metros",
    km: "Kilómetros",
    cm: "Centímetros",
    mm: "Milímetros",
    mi: "Millas",
    yd: "Yardas",
    ft: "Pies",
    in: "Pulgadas"
  },

  weight: {
    kg: "Kilogramos",
    g: "Gramos",
    mg: "Miligramos",
    lb: "Libras",
    oz: "Onzas"
  },

  volume: {
    l: "Litros",
    ml: "Mililitros",
    m3: "Metros cúbicos",
    gal: "Galones",
    cup: "Tazas"
  },

  data: {
    B: "Bytes",
    KB: "KB",
    MB: "MB",
    GB: "GB",
    TB: "TB"
  }
};

function fillUnits() {

  const type = $("convertType").value;

  $("convertFrom").innerHTML = "";
  $("convertTo").innerHTML = "";

  Object.keys(units[type]).forEach(unit => {

    const text = unitNames[type][unit];

    $("convertFrom").add(
      new Option(text, unit)
    );

    $("convertTo").add(
      new Option(text, unit)
    );
  });
}

$("convertType").addEventListener("change", fillUnits);

fillUnits();

$("convertBtn").addEventListener("click", () => {

  const value = Number($("convertValue").value);
  const type = $("convertType").value;
  const from = $("convertFrom").value;
  const to = $("convertTo").value;

  if (!Number.isFinite(value)) {
    $("convertResult").textContent = "Introduce una cantidad.";
    return;
  }

  const base = value * units[type][from];
  const result = base / units[type][to];

  $("convertResult").textContent =
    `Resultado: ${result.toLocaleString("es-PE")}`;
});

/* =========================================
   TEMPERATURA
========================================= */

$("tempBtn").addEventListener("click", () => {

  const value = Number($("tempValue").value);
  const from = $("tempFrom").value;
  const to = $("tempTo").value;

  if (!Number.isFinite(value)) {
    $("tempResult").textContent = "Introduce una temperatura.";
    return;
  }

  let celsius;

  if (from === "C") celsius = value;
  if (from === "F") celsius = (value - 32) * 5 / 9;
  if (from === "K") celsius = value - 273.15;

  let result;

  if (to === "C") result = celsius;
  if (to === "F") result = celsius * 9 / 5 + 32;
  if (to === "K") result = celsius + 273.15;

  $("tempResult").textContent =
    "Resultado: " + result.toFixed(2) + "°";
});

/* =========================================
   EDAD
========================================= */

$("ageBtn").addEventListener("click", () => {

  const value = $("birthDate").value;

  if (!value) {
    $("ageResult").textContent = "Selecciona tu fecha.";
    return;
  }

  const [year, month, day] = value.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();

  if (birth > today) {
    $("ageResult").textContent = "La fecha no puede ser futura.";
    return;
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    days += new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    ).getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  $("ageResult").textContent =
    `${years} años, ${months} meses y ${days} días.`;
});

/* =========================================
   DIFERENCIA DE FECHAS
========================================= */

function localDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

$("dateBtn").addEventListener("click", () => {

  if (!$("date1").value || !$("date2").value) {
    $("dateResult").textContent = "Selecciona ambas fechas.";
    return;
  }

  const a = localDate($("date1").value);
  const b = localDate($("date2").value);

  const days = Math.round(
    Math.abs(b - a) / 86400000
  );

  $("dateResult").textContent =
    `${days} días (${(days / 7).toFixed(1)} semanas aproximadamente).`;
});

/* =========================================
   PROPINA
========================================= */

$("tipBtn").addEventListener("click", () => {

  const total = Number($("tipTotal").value);
  const percent = Number($("tipPercent").value);

  if (!Number.isFinite(total) || !Number.isFinite(percent)) {
    $("tipResult").textContent = "Introduce valores válidos.";
    return;
  }

  const tip = total * percent / 100;
  const final = total + tip;

  $("tipResult").innerHTML =
    `Propina: <b>${money(tip)}</b><br>
     Total: <b>${money(final)}</b>`;
});

/* =========================================
   DIVIDIR CUENTA
========================================= */

$("splitBtn").addEventListener("click", () => {

  const total = Number($("splitTotal").value);
  const people = Number($("splitPeople").value);

  if (total < 0 || people <= 0) {
    $("splitResult").textContent = "Valores inválidos.";
    return;
  }

  $("splitResult").textContent =
    "Cada persona: " + money(total / people);
});

/* =========================================
   MONEDAS
========================================= */

$("currencyBtn").addEventListener("click", async () => {

  const amount = Number($("currencyAmount").value);
  const from = $("currencyFrom").value;
  const to = $("currencyTo").value;

  if (!Number.isFinite(amount)) {
    $("currencyResult").textContent = "Introduce un monto.";
    return;
  }

  if (from === to) {
    $("currencyResult").textContent =
      `${amount} ${to}`;
    return;
  }

  $("currencyResult").textContent = "Consultando tasa...";

  try {

    const url =
      `https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error();
    }

    const data = await response.json();
    const result = data.rates[to];

    $("currencyResult").textContent =
      `${amount} ${from} ≈ ${result.toFixed(2)} ${to}`;

    localStorage.setItem(
      "utilhub-last-currency",
      JSON.stringify({
        amount,
        from,
        to,
        result,
        date: new Date().toISOString()
      })
    );

  } catch {

    const saved = load("utilhub-last-currency", null);

    if (saved &&
        saved.from === from &&
        saved.to === to) {

      $("currencyResult").textContent =
        `Último resultado guardado: ${saved.result.toFixed(2)} ${to}.`;

    } else {

      $("currencyResult").textContent =
        "No se pudo obtener la tasa. Comprueba tu conexión.";

    }
  }
});

/* =========================================
   PRESUPUESTO
========================================= */

let budget = load("utilhub-budget", []);

function renderBudget() {

  let income = 0;
  let expense = 0;

  budget.forEach(item => {
    if (item.type === "income") income += item.amount;
    else expense += item.amount;
  });

  $("incomeTotal").textContent = money(income);
  $("expenseTotal").textContent = money(expense);
  $("balanceTotal").textContent = money(income - expense);

  $("budgetList").innerHTML = budget.length
    ? budget.slice().reverse().map(item => `
      <div class="list-item">
        <div class="list-content">
          <b>${item.type === "income" ? "➕" : "➖"} ${money(item.amount)}</b>
          <br>
          <small>${escapeHTML(item.note || "Sin descripción")}</small>
        </div>
        <button class="delete-btn budget-delete" data-id="${item.id}">✕</button>
      </div>
    `).join("")
    : `<div class="result">Todavía no hay movimientos.</div>`;

  save("utilhub-budget", budget);
}

$("budgetAdd").addEventListener("click", () => {

  const amount = Number($("budgetAmount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    toast("Introduce un monto válido.");
    return;
  }

  budget.push({
    id: id(),
    type: $("budgetType").value,
    amount,
    note: $("budgetNote").value.trim(),
    date: new Date().toISOString()
  });

  $("budgetAmount").value = "";
  $("budgetNote").value = "";

  renderBudget();
  toast("Movimiento agregado.");
});

$("budgetList").addEventListener("click", event => {

  const button = event.target.closest(".budget-delete");

  if (!button) return;

  budget = budget.filter(
    item => item.id !== button.dataset.id
  );

  renderBudget();
});

renderBudget();

/* =========================================
   TEMPORIZADOR
========================================= */

let timerInterval = null;
let timerRemaining = 300;
let timerRunning = false;
let timerEnd = 0;

function formatTime(ms, hundredths = false) {

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (!hundredths) {
    return [
      String(h).padStart(2, "0"),
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0")
    ].join(":");
  }

  const cs = Math.floor((ms % 1000) / 10);

  return [
    String(Math.floor(ms / 3600000)).padStart(2, "0"),
    String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0"),
    String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")
  ].join(":") + "." + String(cs).padStart(2, "0");
}

function updateTimerDisplay() {
  $("timerDisplay").textContent =
    formatTime(timerRemaining * 1000);
}

$("timerStart").addEventListener("click", () => {

  if (timerRunning) return;

  if (timerRemaining <= 0) {

    const h = Number($("timerH").value) || 0;
    const m = Number($("timerM").value) || 0;
    const s = Number($("timerS").value) || 0;

    timerRemaining = h * 3600 + m * 60 + s;
  }

  if (timerRemaining <= 0) {
    toast("Configura un tiempo primero.");
    return;
  }

  timerRunning = true;
  timerEnd = Date.now() + timerRemaining * 1000;

  timerInterval = setInterval(() => {

    timerRemaining = Math.max(
      0,
      Math.ceil((timerEnd - Date.now()) / 1000)
    );

    updateTimerDisplay();

    if (timerRemaining <= 0) {

      clearInterval(timerInterval);
      timerRunning = false;

      toast("⏰ ¡Tiempo terminado!");
    }

  }, 100);

});

$("timerPause").addEventListener("click", () => {

  if (!timerRunning) return;

  timerRemaining = Math.max(
    0,
    Math.ceil((timerEnd - Date.now()) / 1000)
  );

  clearInterval(timerInterval);
  timerRunning = false;

  updateTimerDisplay();
});

$("timerReset").addEventListener("click", () => {

  clearInterval(timerInterval);
  timerRunning = false;

  const h = Number($("timerH").value) || 0;
  const m = Number($("timerM").value) || 0;
  const s = Number($("timerS").value) || 0;

  timerRemaining = h * 3600 + m * 60 + s;

  updateTimerDisplay();
});

updateTimerDisplay();

/* =========================================
   CRONÓMETRO
========================================= */

let stopwatchRunning = false;
let stopwatchStart = 0;
let stopwatchElapsed = 0;
let stopwatchInterval = null;

function updateStopwatch() {

  let elapsed = stopwatchElapsed;

  if (stopwatchRunning) {
    elapsed += Date.now() - stopwatchStart;
  }

  $("stopwatchDisplay").textContent =
    formatTime(elapsed, true);
}

$("stopStart").addEventListener("click", () => {

  if (stopwatchRunning) return;

  stopwatchRunning = true;
  stopwatchStart = Date.now();

  stopwatchInterval = setInterval(
    updateStopwatch,
    40
  );
});

$("stopPause").addEventListener("click", () => {

  if (!stopwatchRunning) return;

  stopwatchElapsed += Date.now() - stopwatchStart;
  stopwatchRunning = false;

  clearInterval(stopwatchInterval);
  updateStopwatch();
});

$("stopReset").addEventListener("click", () => {

  stopwatchRunning = false;
  clearInterval(stopwatchInterval);

  stopwatchElapsed = 0;
  stopwatchStart = 0;

  $("laps").innerHTML = "";
  updateStopwatch();
});

$("lapBtn").addEventListener("click", () => {

  if (!stopwatchRunning) return;

  const time = $("stopwatchDisplay").textContent;

  const lap = document.createElement("div");
  lap.className = "lap";
  lap.textContent = time;

  $("laps").prepend(lap);
});

updateStopwatch();

/* =========================================
   NOTAS
========================================= */

let notes = load("utilhub-notes", []);

function renderNotes() {

  $("notesList").innerHTML = notes.length
    ? notes.slice().reverse().map(note => `
      <div class="list-item">
        <div class="list-content">
          <b>${escapeHTML(note.title || "Sin título")}</b>
          <br>
          <small>${escapeHTML(note.text)}</small>
        </div>
        <button class="delete-btn note-delete" data-id="${note.id}">✕</button>
      </div>
    `).join("")
    : `<div class="result">No hay notas guardadas.</div>`;
}

$("saveNote").addEventListener("click", () => {

  const text = $("noteText").value.trim();

  if (!text) {
    toast("Escribe algo primero.");
    return;
  }

  notes.push({
    id: id(),
    title: $("noteTitle").value.trim(),
    text,
    date: new Date().toISOString()
  });

  save("utilhub-notes", notes);

  $("noteTitle").value = "";
  $("noteText").value = "";

  renderNotes();
  toast("Nota guardada.");
});

$("notesList").addEventListener("click", event => {

  const button = event.target.closest(".note-delete");

  if (!button) return;

  notes = notes.filter(
    note => note.id !== button.dataset.id
  );

  save("utilhub-notes", notes);
  renderNotes();
});

renderNotes();

/* =========================================
   TAREAS
========================================= */

let tasks = load("utilhub-tasks", []);

function renderTasks() {

  $("tasksList").innerHTML = tasks.length
    ? tasks.map(task => `
      <div class="list-item ${task.done ? "done" : ""}">
        <div class="list-content">
          <input type="checkbox"
            class="task-check"
            data-id="${task.id}"
            ${task.done ? "checked" : ""}>
          ${escapeHTML(task.text)}
        </div>
        <button class="delete-btn task-delete" data-id="${task.id}">✕</button>
      </div>
    `).join("")
    : `<div class="result">No tienes tareas.</div>`;

  save("utilhub-tasks", tasks);
}

$("addTask").addEventListener("click", () => {

  const text = $("taskInput").value.trim();

  if (!text) return;

  tasks.push({
    id: id(),
    text,
    done: false
  });

  $("taskInput").value = "";

  renderTasks();
});

$("taskInput").addEventListener("keydown", event => {

  if (event.key === "Enter") {
    $("addTask").click();
  }
});

$("tasksList").addEventListener("click", event => {

  const check = event.target.closest(".task-check");
  const del = event.target.closest(".task-delete");

  if (check) {

    const task = tasks.find(
      item => item.id === check.dataset.id
    );

    if (task) task.done = check.checked;

    renderTasks();
  }

  if (del) {

    tasks = tasks.filter(
      item => item.id !== del.dataset.id
    );

    renderTasks();
  }
});

renderTasks();

/* =========================================
   LISTA DE COMPRAS
========================================= */

let shopping = load("utilhub-shopping", []);

function renderShopping() {

  $("shoppingList").innerHTML = shopping.length
    ? shopping.map(item => `
      <div class="list-item ${item.done ? "done" : ""}">
        <div class="list-content">
          <input type="checkbox"
            class="shop-check"
            data-id="${item.id}"
            ${item.done ? "checked" : ""}>
          ${escapeHTML(item.text)}
          <small> × ${item.qty}</small>
        </div>
        <button class="delete-btn shop-delete" data-id="${item.id}">✕</button>
      </div>
    `).join("")
    : `<div class="result">La lista está vacía.</div>`;

  save("utilhub-shopping", shopping);
}

$("addShopping").addEventListener("click", () => {

  const text = $("shoppingInput").value.trim();
  const qty = Math.max(1, Number($("shoppingQty").value) || 1);

  if (!text) return;

  shopping.push({
    id: id(),
    text,
    qty,
    done: false
  });

  $("shoppingInput").value = "";
  $("shoppingQty").value = 1;

  renderShopping();
});

$("shoppingList").addEventListener("click", event => {

  const check = event.target.closest(".shop-check");
  const del = event.target.closest(".shop-delete");

  if (check) {

    const item = shopping.find(
      x => x.id === check.dataset.id
    );

    if (item) item.done = check.checked;

    renderShopping();
  }

  if (del) {

    shopping = shopping.filter(
      x => x.id !== del.dataset.id
    );

    renderShopping();
  }
});

renderShopping();

/* =========================================
   CONTRASEÑAS
========================================= */

$("generatePassword").addEventListener("click", () => {

  let length = Number($("passwordLength").value);

  length = Math.max(8, Math.min(64, length));

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ" +
    "abcdefghijkmnopqrstuvwxyz" +
    "23456789!@#$%&*+-_";

  const array = new Uint32Array(length);

  crypto.getRandomValues(array);

  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  $("passwordOutput").value = password;
});

$("copyPassword").addEventListener("click", async () => {

  const password = $("passwordOutput").value;

  if (!password) {
    toast("Genera una contraseña primero.");
    return;
  }

  await copyText(password);
});

/* =========================================
   QR
========================================= */

$("qrBtn").addEventListener("click", () => {

  const text = $("qrText").value.trim();
  const size = $("qrSize").value;

  if (!text) {
    toast("Escribe algo para generar el QR.");
    return;
  }

  const url =
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;

  $("qrResult").innerHTML = `
    <img
      src="${url}"
      alt="Código QR generado"
      loading="lazy"
    >
  `;

  toast("QR generado.");
});

/* =========================================
   ALEATORIO
========================================= */

$("randomBtn").addEventListener("click", () => {

  let min = Number($("randomMin").value);
  let max = Number($("randomMax").value);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    toast("Introduce los límites.");
    return;
  }

  if (min > max) {
    [min, max] = [max, min];
  }

  const result =
    Math.floor(Math.random() * (max - min + 1)) + min;

  $("randomResult").textContent = result;
});

/* =========================================
   DADOS
========================================= */

$("diceBtn").addEventListener("click", () => {

  const count = Number($("diceCount").value);
  const results = [];

  for (let i = 0; i < count; i++) {
    results.push(
      Math.floor(Math.random() * 6) + 1
    );
  }

  $("diceResult").textContent =
    results.map(n => "🎲 " + n).join("   ");
});

/* =========================================
   DICCIONARIO
========================================= */

$("dictionaryBtn").addEventListener("click", async () => {

  const word = $("dictionaryWord").value.trim();
  const lang = $("dictionaryLang").value;

  if (!word) {
    toast("Escribe una palabra.");
    return;
  }

  $("dictionaryResult").textContent =
    "Buscando...";

  try {

    const url =
      `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error();
    }

    const data = await response.json();

    const entry = data[0];

    const meanings = entry.meanings || [];

    const definitions = meanings
      .slice(0, 3)
      .map(item => {

        const definition =
          item.definitions?.[0]?.definition || "";

        return `<p><b>${escapeHTML(item.partOfSpeech || "")}</b>: ${escapeHTML(definition)}</p>`;
      })
      .join("");

    $("dictionaryResult").innerHTML =
      `<b>${escapeHTML(entry.word)}</b>${definitions}`;

  } catch {

    $("dictionaryResult").textContent =
      "No se encontró la palabra o no hay conexión.";
  }
});

/* =========================================
   CONTADOR DE TEXTO
========================================= */

$("textCounter").addEventListener("input", () => {

  const text = $("textCounter").value;

  const words = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  const chars = text.length;

  const lines = text
    ? text.split("\n").length
    : 0;

  $("wordCount").textContent = words;
  $("charCount").textContent = chars;
  $("lineCount").textContent = lines;
});

/* =========================================
   CONVERSOR DE TEXTO
========================================= */

$("upperBtn").addEventListener("click", () => {
  $("caseText").value =
    $("caseText").value.toUpperCase();
});

$("lowerBtn").addEventListener("click", () => {
  $("caseText").value =
    $("caseText").value.toLowerCase();
});

$("titleBtn").addEventListener("click", () => {

  $("caseText").value =
    $("caseText").value
      .toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase());
});

/* =========================================
   COLORES
========================================= */

let currentColor = "#000000";

function randomColor() {

  const chars = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    color += chars[
      Math.floor(Math.random() * 16)
    ];
  }

  return color;
}

$("colorBtn").addEventListener("click", () => {

  currentColor = randomColor();

  $("colorPreview").style.background = currentColor;
  $("colorCode").textContent = currentColor;
});

$("copyColor").addEventListener("click", async () => {

  await copyText(currentColor);
});

/* =========================================
   URL
========================================= */

$("encodeBtn").addEventListener("click", () => {

  try {
    $("urlText").value =
      encodeURIComponent($("urlText").value);
  } catch {
    toast("No se pudo codificar.");
  }
});

$("decodeBtn").addEventListener("click", () => {

  try {
    $("urlText").value =
      decodeURIComponent($("urlText").value);
  } catch {
    toast("El texto no es válido.");
  }
});

/* =========================================
   ORGANIZADOR DE ESTUDIO
========================================= */

let studies = load("utilhub-study", []);

function renderStudy() {

  $("studyList").innerHTML = studies.length
    ? studies.slice().reverse().map(item => `
      <div class="list-item">
        <div class="list-content">
          <b>${escapeHTML(item.subject)}</b>
          <br>
          <span>${escapeHTML(item.topic)}</span>
          <br>
          <small>${escapeHTML(item.date || "Sin fecha")}</small>
          ${item.notes
            ? `<br><small>${escapeHTML(item.notes)}</small>`
            : ""}
        </div>
        <button class="delete-btn study-delete" data-id="${item.id}">✕</button>
      </div>
    `).join("")
    : `<div class="result">No hay actividades registradas.</div>`;

  save("utilhub-study", studies);
}

$("addStudy").addEventListener("click", () => {

  const subject = $("studySubject").value.trim();
  const topic = $("studyTopic").value.trim();

  if (!subject || !topic) {
    toast("Completa el curso y el tema.");
    return;
  }

  studies.push({
    id: id(),
    subject,
    topic,
    date: $("studyDate").value,
    notes: $("studyNotes").value.trim()
  });

  $("studySubject").value = "";
  $("studyTopic").value = "";
  $("studyDate").value = "";
  $("studyNotes").value = "";

  renderStudy();
  toast("Actividad agregada.");
});

$("studyList").addEventListener("click", event => {

  const button = event.target.closest(".study-delete");

  if (!button) return;

  studies = studies.filter(
    item => item.id !== button.dataset.id
  );

  renderStudy();
});

renderStudy();

/* =========================================
   COPIAR TEXTO
========================================= */

async function copyText(text) {

  try {

    await navigator.clipboard.writeText(text);

    toast("Copiado.");

  } catch {

    const area = document.createElement("textarea");

    area.value = text;
    document.body.appendChild(area);

    area.select();

    document.execCommand("copy");

    area.remove();

    toast("Copiado.");
  }
}

/* =========================================
   MAPS / COMIDA / COMPRAS
========================================= */

function openURL(url) {

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

function mapsSearch(query) {

  if (!query) {
    query = "lugares";
  }

  const url =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query);

  openURL(url);
}

function googleSearch(query) {

  const url =
    "https://www.google.com/search?q=" +
    encodeURIComponent(query);

  openURL(url);
}

$("foodMaps").addEventListener("click", () => {

  const query =
    $("foodSearch").value.trim() ||
    $("foodType").value ||
    "restaurantes";

  mapsSearch(query);
});

$("foodOrder").addEventListener("click", () => {

  const query =
    $("foodSearch").value.trim() ||
    $("foodType").value ||
    "comida";

  googleSearch(
    query + " pedir comida"
  );
});

$("foodNear").addEventListener("click", () => {

  findNearby(
    $("foodSearch").value.trim() ||
    $("foodType").value ||
    "restaurantes"
  );
});

$("shopSearchBtn").addEventListener("click", () => {

  const query =
    $("shopSearch").value.trim();

  if (!query) {
    toast("Escribe un producto.");
    return;
  }

  googleSearch(query);
});

$("shopMapsBtn").addEventListener("click", () => {

  const query =
    $("shopSearch").value.trim() ||
    "tiendas";

  mapsSearch(query);
});

$("shopNearBtn").addEventListener("click", () => {

  findNearby(
    $("shopSearch").value.trim() ||
    "tiendas"
  );
});

/* =========================================
   UBICACIÓN
========================================= */

let currentPosition = null;

function findNearby(query) {

  if (!navigator.geolocation) {

    $("locationStatus").textContent =
      "Este navegador no permite ubicación.";

    return;
  }

  $("locationStatus").textContent =
    "Solicitando ubicación...";

  navigator.geolocation.getCurrentPosition(

    position => {

      currentPosition = position;

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      $("locationStatus").textContent =
        "Ubicación obtenida. Abriendo búsqueda cercana...";

      const url =
        `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lon},14z`;

      openURL(url);
    },

    error => {

      let message =
        "No se pudo obtener tu ubicación.";

      if (error.code === 1) {
        message =
          "Permiso de ubicación rechazado. Puedes buscar manualmente.";
      }

      $("locationStatus").textContent = message;

      mapsSearch(query);
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

document.querySelectorAll(".local-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const place = button.dataset.place;

      findNearby(place);
    });

  });

$("localNear").addEventListener("click", () => {

  const query =
    $("localSearch").value.trim() ||
    "servicios";

  findNearby(query);
});

/* =========================================
   EXPORTAR DATOS
========================================= */

$("exportData").addEventListener("click", () => {

  const data = {

    version: "ÚtilHub V8",

    notes: load("utilhub-notes", []),
    tasks: load("utilhub-tasks", []),
    shopping: load("utilhub-shopping", []),
    budget: load("utilhub-budget", []),
    study: load("utilhub-study", []),

    theme:
      localStorage.getItem("utilhub-theme") || "dark",

    exportedAt:
      new Date().toISOString()
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download =
    "utilhub-v8-respaldo.json";

  link.click();

  URL.revokeObjectURL(url);

  toast("Respaldo descargado.");
});

/* =========================================
   IMPORTAR DATOS
========================================= */

$("importData").addEventListener("click", () => {
  $("importFile").click();
});

$("importFile").addEventListener("change", event => {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {

    try {

      const data = JSON.parse(reader.result);

      if (Array.isArray(data.notes)) {
        save("utilhub-notes", data.notes);
      }

      if (Array.isArray(data.tasks)) {
        save("utilhub-tasks", data.tasks);
      }

      if (Array.isArray(data.shopping)) {
        save("utilhub-shopping", data.shopping);
      }

      if (Array.isArray(data.budget)) {
        save("utilhub-budget", data.budget);
      }

      if (Array.isArray(data.study)) {
        save("utilhub-study", data.study);
      }

      if (data.theme === "light") {
        localStorage.setItem(
          "utilhub-theme",
          "light"
        );
      }

      toast("Datos importados. Recargando...");

      setTimeout(() => {
        location.reload();
      }, 800);

    } catch {

      toast("El archivo no es un respaldo válido.");
    }
  };

  reader.readAsText(file);
});

/* =========================================
   ELIMINAR DATOS
========================================= */

$("clearData").addEventListener("click", () => {

  const confirmation = confirm(
    "¿Seguro que quieres eliminar todos los datos guardados por ÚtilHub?"
  );

  if (!confirmation) return;

  const keys = [
    "utilhub-notes",
    "utilhub-tasks",
    "utilhub-shopping",
    "utilhub-budget",
    "utilhub-study",
    "utilhub-last-currency",
    "utilhub-theme"
  ];

  keys.forEach(key => {
    localStorage.removeItem(key);
  });

  toast("Datos eliminados. Recargando...");

  setTimeout(() => {
    location.reload();
  }, 700);
});

/* =========================================
   ATAJOS DE TECLADO
========================================= */

document.addEventListener("keydown", event => {

  if (
    event.ctrlKey &&
    event.key.toLowerCase() === "k"
  ) {

    event.preventDefault();

    $("globalSearch").focus();
  }
});

/* =========================================
   INICIO
========================================= */

console.log("ÚtilHub V8 iniciado correctamente.");
