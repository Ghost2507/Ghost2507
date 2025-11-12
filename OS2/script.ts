let processes = [];
let memorySize = 100;
let nextFitIndex = 0;
const alpha = 0.6, beta = 0.4;

const numInput = document.getElementById("numProcesses");
const processForm = document.getElementById("processForm");
const processInputs = document.getElementById("processInputs");
const algoResults = document.getElementById("algorithmResults");

// Generate dynamic input fields
document.getElementById("generateBtn").addEventListener("click", () => {
  const num = parseInt(numInput.value);
  processInputs.innerHTML = "";
  for (let i = 1; i <= num; i++) {
    processInputs.innerHTML += `
      <div class="process-field">
        <span>Process ${i}</span>
        <label>Size (KB): <input type="number" min="1" id="size${i}" required></label>
        <label class="lifetime hidden" id="lifeLabel${i}">Time: <input type="number" min="1" id="time${i}" ></label>
      </div>`;
  }
  processForm.classList.remove("hidden");
});

// Handle form submit
processForm.addEventListener("submit", (e) => {
  e.preventDefault();
  processes = [];
  const num = parseInt(numInput.value);
  for (let i = 1; i <= num; i++) {
    const size = parseInt(document.getElementById(size${i}).value);
    const lifetimeInput = document.getElementById(time${i});
    const lifetime = lifetimeInput?.value ? parseInt(lifetimeInput.value) : Math.floor(Math.random() * 10) + 2;
    processes.push({ id: i, size, lifetime });
  }
  algoResults.classList.remove("hidden");
  runAllAlgorithms();
});

// Ask lifetime for Hybrid specifically
document.getElementById("hybrid").addEventListener("click", () => {
  for (let i = 1; i <= processes.length; i++) {
    document.getElementById(lifeLabel${i}).classList.remove("hidden");
  }
});

// Run all
function runAllAlgorithms() {
  runAlgorithm("bestFit", bestFit);
  runAlgorithm("worstFit", worstFit);
  runAlgorithm("nextFit", nextFit);
  runAlgorithm("hybrid", hybridAlgorithm);
}

function runAlgorithm(id, algoFunc) {
  const container = document.querySelector(#${id} .taskContainer);
  const statsBox = document.querySelector(#${id} .stats);
  container.innerHTML = "";
  statsBox.innerHTML = "";

  const { logs, totalTime, totalMemoryUsed } = algoFunc([...processes]);
  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = log;
    container.appendChild(div);
  });

  statsBox.innerHTML = `
    <div><strong>Total Time:</strong> ${totalTime.toFixed(2)} units</div>
    <div><strong>Memory Used:</strong> ${totalMemoryUsed.toFixed(2)} KB</div>
  `;
}

/---------------- Algorithms ----------------/

function bestFit(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [];
  let totalTime = 0, used = 0;

  for (let p of procList) {
    const start = performance.now();
    freeBlocks.sort((a, b) => a.size - b.size);
    let block = freeBlocks.find(b => b.size >= p.size);
    if (block) {
      block.start += p.size;
      block.size -= p.size;
      used += p.size;
      const timeTaken = (performance.now() - start) / 10;
      totalTime += timeTaken;
      logs.push(Allocated <b>P${p.id}</b> of ${p.size}KB in smallest available block (Best Fit) — time ${timeTaken.toFixed(2)}.);
    } else logs.push(<b>P${p.id}</b> not allocated — insufficient memory.);
  }
  return { logs, totalTime, totalMemoryUsed: used };
}

function worstFit(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [], totalTime = 0, used = 0;

  for (let p of procList) {
    const start = performance.now();
    freeBlocks.sort((a, b) => b.size - a.size);
    let block = freeBlocks.find(b => b.size >= p.size);
    if (block) {
      block.start += p.size;
      block.size -= p.size;
      used += p.size;
      const timeTaken = (performance.now() - start) / 10;
      totalTime += timeTaken;
      logs.push(Allocated <b>P${p.id}</b> of ${p.size}KB in largest available block (Worst Fit) — time ${timeTaken.toFixed(2)}.);
    } else logs.push(<b>P${p.id}</b> not allocated.);
  }
  return { logs, totalTime, totalMemoryUsed: used };
}

function nextFit(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [], totalTime = 0, used = 0;

  for (let p of procList) {
    const start = performance.now();
    let allocated = false;
    for (let i = 0; i < freeBlocks.length; i++) {
      const index = (nextFitIndex + i) % freeBlocks.length;
      const block = freeBlocks[index];
      if (block.size >= p.size) {
        block.start += p.size;
        block.size -= p.size;
        used += p.size;
        nextFitIndex = index;
        allocated = true;
        const timeTaken = (performance.now() - start) / 10;
        totalTime += timeTaken;
        logs.push(Allocated <b>P${p.id}</b> of ${p.size}KB (Next Fit, continued search) — time ${timeTaken.toFixed(2)}.);
        break;
      }
    }
    if (!allocated) logs.push(<b>P${p.id}</b> not allocated.);
  }
  return { logs, totalTime, totalMemoryUsed: used };
}

function hybridAlgorithm(procList) {
  let freeBlocks = [{ start: 0, size: memorySize }];
  let logs = [], totalTime = 0, used = 0;

  for (let p of procList) {
    p.score = alpha * (1 / p.size) + beta * (1 / p.lifetime);
  }

  procList.sort((a, b) => b.score - a.score);

  for (let p of procList) {
    const start = performance.now();
    freeBlocks.sort((a, b) => a.size - b.size);
    let block = freeBlocks.find(b => b.size >= p.size);
    if (block) {
      block.start += p.size;
      block.size -= p.size;
      used += p.size;
      const timeTaken = (performance.now() - start) / 10;
      totalTime += timeTaken;
      logs.push(Allocated <b>P${p.id}</b> (${p.size}KB, t=${p.lifetime}) with score=${p.score.toFixed(3)} — time ${timeTaken.toFixed(2)}.);
    } else logs.push(<b>P${p.id}</b> could not be allocated.);
  }
  return