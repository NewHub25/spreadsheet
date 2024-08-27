import mathjs from './mathjs.js';

const $ = (el) => document.querySelector(el);
const $table = $('table');
const $head = $('thead');
const $body = $('tbody');

const ROWS = 10;
const COLUMNS = 7;

const range = (length) => Array.from({ length }, (_, i) => i);

let STATE = range(COLUMNS).map(() =>
  range(ROWS).map(() => ({ computedValue: '', value: '' })),
);

function updateCell({ x, y, value }) {
  const newState = structuredClone(STATE);
  const cell = newState[x][y];
  cell.computedValue = computeValue(value); // -> span
  cell.value = String(value); // -> input
  STATE = newState;
  STATE.forEach((row) =>
    row.forEach((col) => {
      col.computedValue = computeValue(col.value); // -> span
    }),
  );
  renderSpreadSheet();
}

function computeValue(value) {
  if (!value.startsWith('=')) return value;
  const formula = value.slice(1);
  let computedValue;
  try {
    const simplifiedFormula = formula
      .replace(/[^0-9a-zA-Z+\-*/.()=]+/g, '')
      .replace(/[A-Z][0-9]/g, (match, offset, string) => {
        const [str, num] = [...match];
        return STATE[str.charCodeAt() - 65][num - 1].computedValue;
      });
    computedValue = mathjs.evaluate(simplifiedFormula);
  } catch (error) {
    computedValue = `!ERROR`;
    console.log(`!ERROR: ${error.message}`);
  }
  return computedValue;
}

const renderSpreadSheet = () => {
  const headerHTML = `<tr>
    <th></th>
    ${range(COLUMNS)
      .map((m) => `<th>${String.fromCharCode(m + 65)}</th>`)
      .join('')}
  <tr>`;
  $head.innerHTML = headerHTML;

  const bodyHTML = range(ROWS)
    .map((row) => {
      return `<tr>
      <td>${row + 1}</td>
      ${range(COLUMNS)
        .map((column) => {
          const { computedValue, value } = STATE[column][row];
          return `<td data-x="${column}" data-y="${row}">
          <span>${computedValue}</span>
          <input type="text" value="${value}" />
        </td>`;
        })
        .join('')}
    </tr>`;
    })
    .join('');
  $body.innerHTML = bodyHTML;
};

$body.addEventListener('dblclick', (event) => {
  const td = event.target.closest('td');
  if (!td) return;
  const { x, y } = td.dataset;
  const input = td.querySelector('input');
  const span = td.querySelector('span');

  const end = input.value.length;
  input.setSelectionRange(end, end);
  input.focus();

  const keydownHandler = (e) => (e.key === 'Enter' ? input.blur() : null);
  input.addEventListener('keydown', keydownHandler);

  input.addEventListener(
    'blur',
    () => {
      updateCell({ x, y, value: input.value });
      input.removeEventListener('keydown', keydownHandler);
    },
    { once: true },
  );
});

document.addEventListener('click', (event) => {
  event.currentTarget?.querySelectorAll('td')?.forEach((child) => {
    child.classList.remove('selected');
  });
  const td = event.target.closest('td');
  if (!td) return;
  td.classList.add('selected');
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'F2') {
    $table?.querySelector('td.selected')?.querySelector('input')?.focus();
  }
});

$body.addEventListener('copy', (event) => {
  event.preventDefault();
  const td = event.target.closest('td');
  if (!td) return;
  const { x, y } = td.dataset;
  event.clipboardData.setData('text/plain', STATE[x][y].computedValue);
});

renderSpreadSheet();
