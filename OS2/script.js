let processes = [];
let memorySize = 100;
let nextFitIndex = 0;
const alpha = 0.6, beta = 0.4;

function formatDuration(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms < 1) return `${Math.max(1, Math.round(ms * 1000))} µs`;
  return `${ms.toFixed(2)} ms`;
}

const numInput = document.getElementById("numProcesses");
const processForm = document.getElementById("processForm");
const processInputs = document.getElementById("processInputs");
const algoResults = document.getElementById("algorithmResults");
const algorithmSelect = document.getElementById("algorithmSelect");
const memoryInput = document.getElementById("memoryLimit");

document.getElementById("generateBtn").addEventListener("click", () => {
  const num = parseInt(String(numInput.value), 10);
  processInputs.innerHTML = "";
  for (let i = 1; i <= num; i++) {
    processInputs.innerHTML += `
      <div class="process-field">
        <span>Process ${i}</span>
        <label>Size (KB): <input type="number" min="1" id="size${i}" required></label>
        <label class="lifetime hidden" id="lifeLabel${i}">Time: <input type="number" min="1" id="time${i}"></label>
      </div>`;
  }
  processForm.classList.remove("hidden");
  toggleLifetimeVisibility();
});

function toggleLifetimeVisibility() {
  const isHybrid = algorithmSelect && algorithmSelect.value === "hybrid";
  const num = parseInt(String(numInput.value), 10);
  for (let i = 1; i <= num; i++) {
    const label = document.getElementById(`lifeLabel${i}`);
    if (label) {
      if (isHybrid) label.classList.remove("hidden");
      else label.classList.add("hidden");
    }
  }
}

if (algorithmSelect) {
  algorithmSelect.addEventListener("change", toggleLifetimeVisibility);
}

processForm.addEventListener("submit", (e) => {
  e.preventDefault();
  processes = [];
  const num = parseInt(String(numInput.value), 10);
  for (let i = 1; i <= num; i++) {
    const sizeInput = document.getElementById(`size${i}`);
    const timeInput = document.getElementById(`time${i}`);
    const size = parseInt(String(sizeInput && sizeInput.value), 10);
    let lifetime;
    if (algorithmSelect && algorithmSelect.value === "hybrid") {
      if (!timeInput || !timeInput.value) {
        alert("Please enter Time for all processes when using the Hybrid algorithm.");
        return;
      }
      lifetime = parseInt(String(timeInput.value), 10);
    } else {
      lifetime = timeInput && timeInput.value ? parseInt(String(timeInput.value), 10) : Math.floor(Math.random() * 10) + 2;
    }
    processes.push({ id: i, size, lifetime });
  }
  algoResults.classList.remove("hidden");
  runSelectedAlgorithm();
});

function showOnlyCard(id) {
  const cards = ["bestFit", "worstFit", "nextFit", "hybrid"];
  cards.forEach(cardId => {
    const card = document.getElementById(cardId);
    if (card) card.style.display = cardId === id ? "block" : "none";
  });
}

function runSelectedAlgorithm() {
  if (memoryInput && memoryInput.value) {
    const m = parseInt(String(memoryInput.value), 10);
    memorySize = isNaN(m) || m <= 0 ? 100 : m;
  }
  nextFitIndex = 0;
  const selected = algorithmSelect ? algorithmSelect.value : "bestFit";
  showOnlyCard(selected);
  switch (selected) {
    case "bestFit":
      runAlgorithm("bestFit", bestFit);
      break;
    case "worstFit":
      runAlgorithm("worstFit", worstFit);
      break;
    case "nextFit":
      runAlgorithm("nextFit", nextFit);
      break;
    case "hybrid":
      runAlgorithm("hybrid", hybridAlgorithm);
      break;
  }
}

function runAlgorithm(id, algoFunc) {
  const container = document.querySelector(`#${id} .taskContainer`);
  const statsBox = document.querySelector(`#${id} .stats`);
  const vizBox = document.querySelector(`#${id} .viz`);
  if (!container || !statsBox) return;
  container.innerHTML = "";
  statsBox.innerHTML = "";
  if (vizBox) vizBox.innerHTML = "";

  const { logs, totalTime, totalMemoryUsed, allocations } = algoFunc([...processes]);
  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = log;
    container.appendChild(div);
  });

  statsBox.innerHTML = `
    <div><strong>Total Time:</strong> ${formatDuration(totalTime)}</div>
    <div><strong>Memory Used:</strong> ${totalMemoryUsed.toFixed(2)} KB</div>
  `;

  if (vizBox && allocations && allocations.length) {
    renderVisualization(vizBox, allocations);
    const orderList = allocations.map(a => `P${a.processId}`).join(" → ");
    const orderDiv = document.createElement("div");
    orderDiv.innerHTML = `<strong>Allocation Order:</strong> ${orderList}`;
    statsBox.appendChild(orderDiv);
  }
}

function bestFit(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [];
  let totalTime = 0, used = 0;
  let allocations = [];
  let order = 1;

  for (let p of procList) {
    const start = performance.now();
    freeBlocks.sort((a, b) => a.size - b.size);
    const block = freeBlocks.find(b => b.size >= p.size);
    if (block) {
      const allocStart = block.start;
      block.start += p.size;
      block.size -= p.size;
      used += p.size;
      const timeTaken = performance.now() - start;
      totalTime += timeTaken;
      const allocOrder = order++;
      logs.push(`Allocated <b>P${p.id}</b> of ${p.size}KB in smallest available block (Best Fit) — time ${formatDuration(timeTaken)}. (Order #${allocOrder})`);
      allocations.push({ processId: p.id, start: allocStart, size: p.size, order: allocOrder });
    } else {
      logs.push(`<b>P${p.id}</b> not allocated.`);
    }
  }
  return { logs, totalTime, totalMemoryUsed: used, allocations };
}

function worstFit(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [], totalTime = 0, used = 0;
  let allocations = [];
  let order = 1;

  for (let p of procList) {
    const start = performance.now();
    freeBlocks.sort((a, b) => b.size - a.size);
    const block = freeBlocks.find(b => b.size >= p.size);
    if (block) {
      const allocStart = block.start;
      block.start += p.size;
      block.size -= p.size;
      used += p.size;
      const timeTaken = performance.now() - start;
      totalTime += timeTaken;
      const allocOrder = order++;
      logs.push(`Allocated <b>P${p.id}</b> of ${p.size}KB in largest available block (Worst Fit) — time ${formatDuration(timeTaken)}. (Order #${allocOrder})`);
      allocations.push({ processId: p.id, start: allocStart, size: p.size, order: allocOrder });
    } else {
      logs.push(`<b>P${p.id}</b> not allocated.`);
    }
  }
  return { logs, totalTime, totalMemoryUsed: used, allocations };
}

function nextFit(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [], totalTime = 0, used = 0;
  let allocations = [];
  let order = 1;

  for (let p of procList) {
    const start = performance.now();
    let allocated = false;
    for (let i = 0; i < freeBlocks.length; i++) {
      const index = (nextFitIndex + i) % freeBlocks.length;
      const block = freeBlocks[index];
      if (block.size >= p.size) {
        const allocStart = block.start;
        block.start += p.size;
        block.size -= p.size;
        used += p.size;
        nextFitIndex = index;
        allocated = true;
        const timeTaken = performance.now() - start;
        totalTime += timeTaken;
        const allocOrder = order++;
        logs.push(`Allocated <b>P${p.id}</b> of ${p.size}KB (Next Fit, continued search) — time ${formatDuration(timeTaken)}. (Order #${allocOrder})`);
        allocations.push({ processId: p.id, start: allocStart, size: p.size, order: allocOrder });
        break;
      }
    }
    if (!allocated) {
      logs.push(`<b>P${p.id}</b> not allocated.`);
    }
  }
  return { logs, totalTime, totalMemoryUsed: used, allocations };
}

function hybridAlgorithm(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [], totalTime = 0, used = 0;
  let allocations = [];
  let order = 1;

  for (let p of procList) {
    p.score = alpha * (1 / p.size) + beta * (1 / p.lifetime);
  }

  procList.sort((a, b) => b.score - a.score);

  for (let p of procList) {
    const start = performance.now();
    freeBlocks.sort((a, b) => a.size - b.size);
    const block = freeBlocks.find(b => b.size >= p.size);
    if (block) {
      const allocStart = block.start;
      block.start += p.size;
      block.size -= p.size;
      used += p.size;
      const timeTaken = performance.now() - start;
      totalTime += timeTaken;
      const allocOrder = order++;
      logs.push(`Allocated <b>P${p.id}</b> (${p.size}KB, t=${p.lifetime}) with score=${p.score.toFixed(3)} — time ${formatDuration(timeTaken)}. (Order #${allocOrder})`);
      allocations.push({ processId: p.id, start: allocStart, size: p.size, order: allocOrder });
    } else {
      logs.push(`<b>P${p.id}</b> could not be allocated.`);
    }
  }
  return { logs, totalTime, totalMemoryUsed: used, allocations };
}

function renderVisualization(vizBox, allocations) {
  const bar = document.createElement("div");
  bar.className = "memory-bar";
  bar.title = `Memory (0 - ${memorySize} KB)`;
  vizBox.appendChild(bar);

  const palette = ["#00c6a7", "#58a6ff", "#e3b341", "#ff7b72", "#a371f7", "#1f6feb", "#2ea043", "#d29922"];

  allocations.forEach((a, idx) => {
    const leftPercent = (a.start / memorySize) * 100;
    const widthPercent = (a.size / memorySize) * 100;
    const block = document.createElement("div");
    block.className = "alloc";
    block.style.left = `${leftPercent}%`;
    block.style.width = `${widthPercent}%`;
    block.style.backgroundColor = palette[idx % palette.length];
    block.innerHTML = `${a.order}`;
    block.title = `#${a.order} P${a.processId} @${a.start} size ${a.size}`;
    bar.appendChild(block);
  });
}


