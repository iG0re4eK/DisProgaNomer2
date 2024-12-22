// Сохраняем ссылки на элементы в переменные
const varsBox = document.getElementById("varsBox");
const restrBox = document.getElementById("restrBox");
const tableContainer = document.getElementById("table-container");

function updateVariables() {
  const varsCount = parseInt(varsBox.value);

  const modeSelect = document.getElementById("mode"); // Ссылка на <select>
  const currentMode = modeSelect.value; // Сохраняем текущее значение

  // Сохраняем текущие значения целевой функции
  const functionInputs = Array.from(
    document.querySelectorAll(".simplex-function input")
  ).map((input) => parseFloat(input.value));

  // Обновление целевой функции
  const functionBlock = document.querySelector(".simplex-function");
  functionBlock.innerHTML = generateFunctionInputs(varsCount);

  // Восстанавливаем сохранённые значения в полях целевой функции
  Array.from(functionBlock.querySelectorAll("input")).forEach(
    (input, index) => {
      if (index < functionInputs.length) {
        input.value = functionInputs[index];
      }
    }
  );

  // Обновление условий неотрицательности
  document.getElementById("rest-vars").innerHTML =
    generateVariableConditions(varsCount);

  // Сохраняем текущие значения ограничений

  // Обновление ограничений
  updateRestrictions();

  // Восстанавливаем значение селектора mode
  document.getElementById("mode").value = currentMode;
}

function updateRestrictions() {
  const restrCount = parseInt(restrBox.value);
  const varsCount = parseInt(varsBox.value);
  const restrictionsBlock = document.getElementById("restrictions");

  const restrictions = Array.from(
    document.querySelectorAll(".restriction-div")
  ).map((row) =>
    Array.from(row.querySelectorAll("input")).map(
      (input) => parseFloat(input.value) || ""
    )
  );

  const conditions = Array.from(
    document.querySelectorAll(".restriction-div select")
  ).map((select) => select.value);

  // Очищаем блок ограничений
  restrictionsBlock.innerHTML = "";

  // Генерация новых строк ограничений
  restrictionsBlock.innerHTML = generateRestrictionInputs(
    restrCount,
    varsCount
  );

  // Восстанавливаем сохранённые значения в полях ограничений
  const updatedRestrictions = document.querySelectorAll(".restriction-div");
  updatedRestrictions.forEach((row, i) => {
    const inputs = row.querySelectorAll("input");
    const selects = row.querySelectorAll("select");

    if (i < restrictions.length) {
      inputs.forEach((input, j) => {
        if (j < restrictions[i].length) {
          input.value = restrictions[i][j];
        }
      });

      if (i < conditions.length) {
        selects[0].value = conditions[i];
      }
    }
  });
}

// Генерация HTML для целевой функции
function generateFunctionInputs(varsCount) {
  let html = "";
  for (let i = 0; i < varsCount; i++) {
    html += `<input id="var${i}" type="number" style="width: 45px" placeholder="0" inputmode="decimal" autocomplete="off" />`;
    html +=
      i < varsCount - 1
        ? `<span> x<sub>${i + 1}</sub> + </span>`
        : `<span> x<sub>${i + 1}</sub> </span>`;
  }
  return (
    html +
    ' → <select id="mode"><option>min</option><option>max</option></select>'
  );
}

// Генерация HTML для строк ограничений
function generateRestrictionInputs(restrCount, varsCount) {
  let html = "";
  for (let i = 0; i < restrCount; i++) {
    html += `<div id="rest-${i}-box" class="restriction-div">`;
    for (let j = 0; j < varsCount; j++) {
      html += `<input id="rest-${i}-${j}" type="number" style="width: 45px" placeholder="0" inputmode="decimal" autocomplete="off" />`;
      html +=
        j < varsCount - 1
          ? `<span> x<sub>${j + 1}</sub> + </span>`
          : `<span> x<sub>${j + 1}</sub></span>`;
    }
    html += ` <select id="cond-${i}"><option value="≤">≤</option><option value="=">=</option><option value="≥">≥</option></select>`;
    html += ` <input id="rest-${i}-value" type="number" style="width: 45px" placeholder="0" inputmode="decimal" autocomplete="off" /></div>`;
  }
  return html;
}

// Генерация условий неотрицательности переменных
function generateVariableConditions(varsCount) {
  let conditions = "";
  for (let i = 1; i <= varsCount; i++) {
    conditions += `x<sub>${i}</sub>, `;
  }
  return conditions.slice(0, -2) + " ≥ 0";
}

// Чтение данных из формы
function getInputData() {
  const variablesCount = parseInt(document.getElementById("varsBox").value);
  const restrictionsCount = parseInt(document.getElementById("restrBox").value);

  // Чтение целевой функции
  const objectiveFunction = [];
  for (let i = 0; i < variablesCount; i++) {
    objectiveFunction.push(
      parseFloat(document.getElementById(`var${i}`).value) || 0
    );
  }
  const optimizationType = document.getElementById("mode").value;

  // Чтение ограничений
  const restrictions = [];
  for (let i = 0; i < restrictionsCount; i++) {
    const coeffs = [];
    for (let j = 0; j < variablesCount; j++) {
      coeffs.push(
        parseFloat(document.getElementById(`rest-${i}-${j}`).value) || 0
      );
    }
    const condition = document.getElementById(`cond-${i}`).value;
    const value =
      parseFloat(document.getElementById(`rest-${i}-value`).value) || 0;

    restrictions.push({ coeffs, condition, value });
  }

  return { variablesCount, objectiveFunction, optimizationType, restrictions };
}

// Построение начальной симплекс-таблицы
function buildSimplexTable(data) {
  const { variablesCount, objectiveFunction, optimizationType, restrictions } =
    data;

  const table = [];

  // Добавляем строки ограничений
  restrictions.forEach((restriction) => {
    const row = [...restriction.coeffs, 0];
    row.push(restriction.value);
    table.push(row);
  });

  // Добавляем строку целевой функции
  const objectiveRow = objectiveFunction.map((coeff) =>
    optimizationType === "max" ? -coeff : coeff
  );
  objectiveRow.push(0); // Для столбца свободных членов
  objectiveRow.push(0); // Для целевой функции
  table.push(objectiveRow);

  return table;
}

// Решение симплекс-методом
function solveSimplex() {
  const data = getInputData();
  let table = buildSimplexTable(data);
  let iterations = 0;

  tableContainer.innerHTML = "";

  while (!isOptimal(table)) {
    iterations++;
    if (iterations > 1000) {
      alert("Решение не найдено: превышено число итераций.");
      return;
    }

    const pivot = selectPivot(table);
    if (!pivot) {
      alert("Решение невозможно: нет подходящего элемента.");
      return;
    }

    table = performPivot(table, pivot);
  }

  displayResult(table, data);
}

// Проверка на оптимальность
function isOptimal(table) {
  const lastRow = table[table.length - 1];
  return lastRow.slice(0, lastRow.length - 2).every((value) => value >= 0);
}

// Выбор опорного элемента
function selectPivot(table) {
  const lastRow = table[table.length - 1];
  const pivotColumn = lastRow
    .slice(0, lastRow.length - 2)
    .findIndex((value) => value < 0);
  if (pivotColumn === -1) return null;

  let pivotRow = -1;
  let minRatio = Infinity;

  for (let i = 0; i < table.length - 1; i++) {
    const ratio = table[i][table[i].length - 1] / table[i][pivotColumn];
    if (ratio > 0 && ratio < minRatio) {
      minRatio = ratio;
      pivotRow = i;
    }
  }

  return pivotRow === -1 ? null : { row: pivotRow, column: pivotColumn };
}

// Выполнение шага симплекс-метода
function performPivot(table, pivot) {
  const { row, column } = pivot;
  const pivotValue = table[row][column];

  // Делим строку на опорный элемент
  table[row] = table[row].map((value) => value / pivotValue);

  // Преобразуем остальные строки
  for (let i = 0; i < table.length; i++) {
    if (i !== row) {
      const factor = table[i][column];
      table[i] = table[i].map(
        (value, index) => value - factor * table[row][index]
      );
    }
  }

  return table;
}

// Отображение результата
function displayResult(table, data) {
  const result = {};
  const lastRow = table[table.length - 1];
  result.optimalValue = Math.round(lastRow[lastRow.length - 1]);

  const variables = new Array(table[0].length - 2).fill(0);

  for (let i = 0; i < table.length - 1; i++) {
    const basicVarIndex = table[i].findIndex((value) => value === 1);
    if (basicVarIndex >= 0 && basicVarIndex < variables.length) {
      variables[basicVarIndex] = Math.round(table[i][table[i].length - 1]);
    }
  }

  result.variables = variables;

  // Формирование ответа
  const variableValues = result.variables
    .map((val, idx) => `x<sub>${idx + 1}</sub> = ${val}`)
    .join(", ");
  const objectiveFunction = data.objectiveFunction
    .map((coeff, idx) => `${coeff}·${result.variables[idx]}`)
    .join(" + ");
  const calculation = `${objectiveFunction} = ${result.optimalValue}`;

  tableContainer.innerHTML += `Текущий план X: [ ${result.variables.join(
    ", "
  )} ]<br>Целевая функция F: ${calculation}<br>Проверяем план на оптимальность: отрицательные дельты отсутствуют, следовательно план оптимален.<br>Ответ: ${variableValues}, F = ${
    result.optimalValue
  }`;
}

function generateTable(varsCount, restrCount) {
  let html = ``;
  html += `<div class="simplex-table">`;
  html += `<table class="table" >`;

  // Первая строка (заголовки)
  html += `<tr>`;
  html += `<th>C</th>`; // Первая ячейка заголовка
  for (let i = 0; i <= varsCount; i++) {
    html += `<td>0</td>`; // Заголовки переменных x1, x2, ...
  }

  html += `</tr>`;

  // Первая строка (заголовки)
  html += `<tr>`;
  html += `<th>базис</th>`; // Первая ячейка заголовка
  for (let i = 1; i <= varsCount; i++) {
    html += `<th>x${i}</th>`; // Заголовки переменных x1, x2, ...
  }
  html += `<th>b</th>`; // Последняя колонка b
  html += `</tr>`;

  // Основные строки таблицы (с базисами и значениями)
  for (let i = 1; i <= restrCount; i++) {
    html += `<tr>`;
    html += `<th>x${varsCount + i}</th>`; // Базис (x3, x4, ...)
    for (let j = 0; j <= varsCount; j++) {
      html += `<td>0</td>`; // Значения 0 для каждой ячейки
    }
    html += `</tr>`;
  }

  html += `</table>`;
  html += `</div>`;
  return html;
}
