window.currentDataLevel = 'mid'; 
window.addEventListener('DOMContentLoaded', initMap);

let mapChart = null;
let mapData = null;


// ========= 基础配置：代表性指标（28项完整版）=========
const INDICATORS = [
  // --- 自然环境 ---
  { key: "i1", name: "年降水量 (mm)", dim: "自然环境", dir: "neg" },
  { key: "i2", name: "暴雨日数 (天/年)", dim: "自然环境", dir: "neg" },
  { key: "i3", name: "极端降雨强度 (mm/h)", dim: "自然环境", dir: "neg" },
  { key: "i4", name: "河网密度 (km/km²)", dim: "自然环境", dir: "pos" },
  { key: "i5", name: "水位流速 (m/s)", dim: "自然环境", dir: "neg" },
  { key: "i6", name: "易涝点分布密度 (个/km²)", dim: "自然环境", dir: "neg" },
  { key: "i7", name: "DEM地形高程 (m)", dim: "自然环境", dir: "pos" },
  { key: "i8", name: "下垫面不透水率 (%)", dim: "自然环境", dir: "neg" },
  { key: "i9", name: "森林与湿地覆盖率 (%)", dim: "自然环境", dir: "pos" },

  // --- 经济建设 ---
  { key: "i10", name: "人均GDP (万元)", dim: "经济建设", dir: "pos" },
  { key: "i11", name: "产业结构多样性 (0-1)", dim: "经济建设", dir: "pos" },
  { key: "i12", name: "财政应急储备金 (亿元)", dim: "经济建设", dir: "pos" },
  { key: "i13", name: "固定资产投资增长率 (%)", dim: "经济建设", dir: "pos" },
  { key: "i14", name: "保险渗透率 (%)", dim: "经济建设", dir: "pos" },
  { key: "i15", name: "人均可支配收入 (万元)", dim: "经济建设", dir: "pos" },

  // --- 基础设施 ---
  { key: "i16", name: "排水管网密度 (km/km²)", dim: "基础设施", dir: "pos" },
  { key: "i17", name: "雨水泵站能力 (万m³/d)", dim: "基础设施", dir: "pos" },
  { key: "i18", name: "海绵城市设施覆盖率 (%)", dim: "基础设施", dir: "pos" },
  { key: "i19", name: "应急避难场所数量 (个)", dim: "基础设施", dir: "pos" },
  { key: "i20", name: "物资储备库密度 (个/km²)", dim: "基础设施", dir: "pos" },
  { key: "i21", name: "交通路网密度 (km/km²)", dim: "基础设施", dir: "pos" },
  { key: "i22", name: "关键设施抗灾设防等级", dim: "基础设施", dir: "pos" },

  // --- 信息化水平 ---
  { key: "i23", name: "预警信息发布频次 (次/年)", dim: "信息化水平", dir: "pos" },
  { key: "i24", name: "遥感监测密度 (次/月)", dim: "信息化水平", dir: "pos" },
  { key: "i25", name: "公众风险意识指数 (1-10)", dim: "信息化水平", dir: "pos" },
  { key: "i26", name: "社交媒体关注度 (指数)", dim: "信息化水平", dir: "pos" },
  { key: "i27", name: "应急指挥平台完备性 (1-5)", dim: "信息化水平", dir: "pos" },
  { key: "i28", name: "数据共享程度 (%)", dim: "信息化水平", dir: "pos" }
];

const OBJECTS = ["对象A", "对象B", "对象C"];
// 注意：这里的维度名称必须和上面指标里的 dim 一致
const DIMS = ["自然环境", "经济建设", "基础设施", "信息化水平"]; 


// ========= Landing / Main 视图切换 =========
const landingView = document.getElementById("landingView");
const mainView = document.getElementById("mainView");
const roleCards = document.querySelectorAll(".role-card");

// ========= Main DOM =========
const roleSelect = document.getElementById("roleSelect");
const roleLabel = document.getElementById("roleLabel");
const cityInput = document.getElementById("cityInput");
const dateInput = document.getElementById("dateInput");

const indicatorTbody = document.getElementById("indicatorTbody");
const btnFillHigh = document.getElementById("btnFillHigh");
const btnFillMid = document.getElementById("btnFillMid");
const btnFillLow = document.getElementById("btnFillLow");
const btnReset = document.getElementById("btnReset");

const btnCompute = document.getElementById("btnCompute");
const btnPrint = document.getElementById("btnPrint");
const statusEl = document.getElementById("status");

const reportBody = document.getElementById("reportBody");

// ========= 状态（用localStorage记住身份，刷新不丢）=========
const STORAGE_KEY_ROLE = "demo_role";

// 图表实例（避免重复叠加）
let chartS = null;
let chartRadar = null;
let chartGaps = null;

function setRole(role) {
  roleSelect.value = role;
  syncRole();
  try { localStorage.setItem(STORAGE_KEY_ROLE, role); } catch {}
}

function getRole() {
  try {
    const v = localStorage.getItem(STORAGE_KEY_ROLE);
    return v || "gov";
  } catch {
    return "gov";
  }
}

function showLanding() {
  landingView.classList.remove("hidden");
  mainView.classList.add("hidden");
}

function showMain() {
  landingView.classList.add("hidden");
  mainView.classList.remove("hidden");
}

// ========= 初始化 =========
function init() {
  roleCards.forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      setRole(role);
      showMain();
    });
  });

  const today = new Date();
  dateInput.value = today.toISOString().slice(0, 10);

  renderIndicatorTable();

  roleSelect.addEventListener("change", () => setRole(roleSelect.value));

  btnFillHigh.addEventListener("click", () => fillExample("high"));
  btnFillMid.addEventListener("click", () => fillExample("mid"));
  btnFillLow.addEventListener("click", () => fillExample("low"));
  btnReset.addEventListener("click", clearInputs);

  btnCompute.addEventListener("click", onCompute);
  btnPrint.addEventListener("click", () => window.print());

  setRole(getRole());
  showLanding();
}

function syncRole() {
  const v = roleSelect.value;
  roleLabel.textContent =
    v === "gov" ? "政府部门" :
    v === "ins" ? "保险机构" : "基础设施运营方";
}

// ========= 表格渲染 =========
function renderIndicatorTable() {
  indicatorTbody.innerHTML = "";
  INDICATORS.forEach((ind) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.innerHTML = `<div style="font-weight:700">${escapeHtml(ind.name)}</div>
                        <div style="color:#9fb2d1;font-size:12px;margin-top:4px;">${escapeHtml(ind.dim)}</div>`;
    tr.appendChild(tdName);

    const tdDir = document.createElement("td");
    tdDir.innerHTML = ind.dir === "pos"
      ? `<span class="dir"><span class="badge-pos">正向</span><span style="color:#9fb2d1;font-size:12px;">越大越好</span></span>`
      : `<span class="dir"><span class="badge-neg">负向</span><span style="color:#9fb2d1;font-size:12px;">越大越差</span></span>`;
    tr.appendChild(tdDir);

    OBJECTS.forEach((_, objIdx) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.className = "cell-input";
      input.type = "number";
      input.step = "any";
      input.placeholder = "输入数值";
      input.dataset.key = ind.key;
      input.dataset.obj = String(objIdx);
      td.appendChild(input);
      tr.appendChild(td);
    });

    indicatorTbody.appendChild(tr);
  });
}

// ========= 交互 =========
function clearInputs() {
  document.querySelectorAll(".cell-input").forEach(inp => inp.value = "");
  statusEl.textContent = "已清空，未计算";
  destroyCharts();
  reportBody.innerHTML = `<div class="empty">点击“生成报告”后，这里会出现可导出的报告内容。</div>`;
}

function destroyCharts(){
  [chartS, chartRadar, chartGaps].forEach(ch => {
    try { if (ch) ch.destroy(); } catch {}
  });
  chartS = chartRadar = chartGaps = null;
}

// ========= 示例数据 =========
// ========= 示例数据 =========
// ========= 示例数据（引入错位竞争，避免出现绝对的 1.0 和 0.0） =========
function fillExample(level) {
    window.currentDataLevel = level; 
  const presets = {
    high: { 
      // A 总体最好，但年降水量偏大，森林覆盖率不如 B
      A: [580, 6, 40, 15, 1.2, 0.5, 45, 30, 38, 18, 0.85, 45, 8.5, 6.5, 8.0, 12, 150, 45, 120, 3.5, 8.5, 5, 50, 10, 9.0, 850, 5, 95],
      // B 总体中等，但森林覆盖率和财政储备金是三者中最好的
      B: [520, 5, 45, 13, 1.5, 0.8, 48, 35, 45, 16, 0.80, 55, 7.5, 5.5, 7.0, 10, 130, 40, 100, 3.0, 7.5, 4, 40, 8, 8.5, 750, 4, 85],
      // C 总体最差，但极端降雨强度最小，且地形高程最高
      C: [600, 7, 35, 11, 1.8, 1.2, 55, 40, 35, 14, 0.75, 40, 6.5, 4.5, 6.0, 8, 110, 35, 80, 2.5, 6.5, 4, 30, 6, 8.0, 650, 4, 75],
    },
    mid: { 
      A: [680, 9, 60, 9, 2.2, 1.8, 35, 50, 28, 11, 0.65, 25, 4.5, 3.8, 5.5, 6, 85, 25, 65, 1.8, 5.5, 3, 25, 4, 6.5, 450, 3, 65],
      B: [750, 8, 65, 10, 2.5, 2.0, 38, 55, 30, 10, 0.60, 28, 4.0, 3.5, 5.0, 5, 80, 20, 60, 1.5, 5.0, 3, 20, 3, 6.0, 400, 3, 60],
      C: [700, 11, 55, 7, 2.8, 2.5, 30, 60, 22, 9, 0.55, 20, 3.5, 3.2, 4.5, 4, 75, 15, 55, 1.2, 4.5, 2, 15, 2, 5.5, 350, 2, 55],
    },
    low: { 
      A: [950, 15, 85, 5, 3.5, 4.0, 15, 70, 12, 6, 0.40, 8, 2.0, 1.5, 3.0, 3, 40, 8, 30, 0.8, 3.0, 2, 10, 1, 4.0, 200, 2, 35],
      B: [1100, 14, 90, 6, 3.8, 4.5, 18, 75, 15, 5, 0.35, 10, 1.5, 1.2, 2.5, 2, 30, 5, 20, 0.5, 2.5, 1, 8, 1, 3.5, 150, 1, 25],
      C: [1050, 17, 80, 3, 4.2, 5.0, 10, 80, 8, 4, 0.30, 5, 1.0, 1.0, 2.0, 1, 20, 3, 10, 0.3, 2.0, 1, 5, 0, 3.0, 100, 1, 15],
    }
  };

  const p = presets[level];
  const cols = [p.A, p.B, p.C];

  INDICATORS.forEach((ind, r) => {
    cols.forEach((arr, objIdx) => {
      const inp = document.querySelector(`.cell-input[data-key="${ind.key}"][data-obj="${objIdx}"]`);
      if(inp) inp.value = arr[r];
    });
  });

  statusEl.textContent = `已填充示例数据（${level === "high" ? "高" : level === "mid" ? "中" : "低"}韧性），未计算`;
}



// ========= 读取矩阵 =========
function readMatrix() {
  const m = OBJECTS.length;
  const n = INDICATORS.length;
  const X = Array.from({ length: m }, () => Array(n).fill(null));

  INDICATORS.forEach((ind, j) => {
    for (let i = 0; i < m; i++) {
      const inp = document.querySelector(`.cell-input[data-key="${ind.key}"][data-obj="${i}"]`);
      const v = inp.value.trim();
      if (v === "") return;
      X[i][j] = Number(v);
    }
  });

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (X[i][j] === null || Number.isNaN(X[i][j])) {
        throw new Error(`数据未填完整：${OBJECTS[i]} 的「${INDICATORS[j].name}」缺失`);
      }
    }
  }
  return X;
}

// ========= 数学工具 =========
function min(arr){ return Math.min(...arr); }
function max(arr){ return Math.max(...arr); }
function sum(arr){ return arr.reduce((a,b)=>a+b,0); }
function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
function safeLn(x){
  const eps = 1e-12;
  return Math.log(Math.max(x, eps));
}

// ========= 极差标准化 =========
function normalizeMinMax(X) {
  const m = X.length;
  const n = X[0].length;
  const Xn = Array.from({ length: m }, () => Array(n).fill(0));

  for (let j = 0; j < n; j++) {
    const col = X.map(row => row[j]);
    const colMin = min(col);
    const colMax = max(col);
    const denom = colMax - colMin;

    for (let i = 0; i < m; i++) {
      if (denom === 0) { Xn[i][j] = 0; continue; }

      const x = X[i][j];
      Xn[i][j] = (INDICATORS[j].dir === "pos")
        ? (x - colMin) / denom
        : (colMax - x) / denom;

      Xn[i][j] = clamp(Xn[i][j], 0, 1);
    }
  }
  return Xn;
}

// ========= 熵权法 =========
function entropyWeights(Xn) {
  const m = Xn.length;
  const n = Xn[0].length;
  const k = 1 / Math.log(m);

  const Y = Array.from({ length: m }, () => Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    const colSum = sum(Xn.map(row => row[j]));
    for (let i = 0; i < m; i++) {
      Y[i][j] = colSum === 0 ? 0 : (Xn[i][j] / colSum);
    }
  }

  const e = Array(n).fill(0);
  const d = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < m; i++) {
      const y = Y[i][j];
      s += y * safeLn(y);
    }
    e[j] = clamp(-k * s, 0, 1);
    d[j] = 1 - e[j];
  }

  const dSum = sum(d);
  const w = dSum === 0 ? Array(n).fill(1 / n) : d.map(v => v / dSum);
  return { Y, e, d, w };
}

// ========= TOPSIS =========
function topsis(Xn, w) {
  const m = Xn.length;
  const n = Xn[0].length;

  const P = Array.from({ length: m }, () => Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      P[i][j] = w[j] * Xn[i][j];
    }
  }

  const pPlus = Array(n).fill(0);
  const pMinus = Array(n).fill(0);

  // 注意：这里 Xn 已按方向做过“越大越好”的同向化，所以正理想=最大、负理想=最小
  for (let j = 0; j < n; j++) {
    const col = P.map(row => row[j]);
    pPlus[j] = max(col);
    pMinus[j] = min(col);
  }

  const Lplus = Array(m).fill(0);
  const Lminus = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let sp = 0, sm = 0;
    for (let j = 0; j < n; j++) {
      sp += (P[i][j] - pPlus[j]) ** 2;
      sm += (P[i][j] - pMinus[j]) ** 2;
    }
    Lplus[i] = Math.sqrt(sp);
    Lminus[i] = Math.sqrt(sm);
  }

  const S = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    const denom = Lplus[i] + Lminus[i];
    S[i] = denom === 0 ? 0 : (Lminus[i] / denom);
  }

  return { P, pPlus, pMinus, Lplus, Lminus, S };
}

// ========= 维度聚合（用于雷达图） =========
// 用“加权规范化矩阵 P”在维度内求和，再做0-1归一（可视化用）
// ========= 维度聚合（用于雷达图） =========
// 机制调整：计算“维度得分率”（实际得分 / 维度总权重），并加上视觉保底值避免缩成点
function dimScoresFromP(P, w){
  const m = P.length;
  const dimIdx = {};
  DIMS.forEach(d => dimIdx[d] = []);
  INDICATORS.forEach((ind, j) => dimIdx[ind.dim].push(j));

  const norm = Array.from({length:m}, () => DIMS.map(() => 0));

  DIMS.forEach((d, di) => {
    const indices = dimIdx[d];
    // 该维度的理论满分（即该维度下所有指标的权重之和）
    const dimWeightSum = sum(indices.map(j => w[j])); 

    for (let i = 0; i < m; i++){
      // 对象的实际维度得分
      const objDimScore = sum(indices.map(j => P[i][j])); 
      
      // 计算得分率 [0, 1]
      let ratio = dimWeightSum > 0 ? (objDimScore / dimWeightSum) : 0;
      
      // 【视觉优化核心】将 0~1 的得分率映射到 0.15~1.0 之间
      // 这样即使得分为 0，在雷达图上也会有 15% 的半径，不会缩成一个看不见的点
      norm[i][di] = ratio * 0.85 + 0.15; 
    }
  });

  return { norm };
}


// ========= 短板Top3 =========
function topGaps(P, pPlus, i, topN=3) {
  const gaps = INDICATORS.map((ind, j) => {
    const delta = Math.abs(P[i][j] - pPlus[j]);
    return { j, key: ind.key, name: ind.name, dim: ind.dim, dir: ind.dir, delta };
  });
  gaps.sort((a,b)=>b.delta - a.delta);
  return gaps.slice(0, topN);
}

function gradeByS(s){
  if (s >= 0.66) return { label: "高", color: "#2dd4bf" };
  if (s >= 0.33) return { label: "中", color: "#ffd166" };
  return { label: "低", color: "#ff6b6b" };
}

function escapeHtml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}



function localAdviceHtml(role){
  if (role === "gov") {
    return `<ul>
      <li>优先补齐短板指标对应领域（以“差距最大项”为治理抓手）。</li>
      <li>建立年度更新机制，提升样本时序可比性。</li>
      <li>将“工程能力 + 管理机制 + 信息化闭环”一起纳入绩效考核。</li>
    </ul>`;
  }
  if (role === "ins") {
    return `<ul>
      <li>对贴近度较低对象提高核保关注等级（演示口径）。</li>
      <li>将短板项作为风险问询要点（排水能力、预警能力等）。</li>
      <li>建议将韧性结果与历史损失、暴露度数据联动校准。</li>
    </ul>`;
  }
  return `<ul>
    <li>针对短板项制定巡检/改造优先级（排水、监测、关键节点冗余）。</li>
    <li>将评估结果纳入运维计划年度滚动更新。</li>
    <li>把“发现-派单-处置-反馈-复盘”做成闭环指标。</li>
  </ul>`;
}

// ========= 图表渲染 =========
function renderCharts({S, bestIdx, worstIdx, dimNorm, gaps, gradeColors}){
  const ctxS = document.getElementById("chartS");
  const ctxRadar = document.getElementById("chartRadar");
  const ctxGaps = document.getElementById("chartGaps");

  destroyCharts();

  // 1) 贴近度柱状图
  chartS = new Chart(ctxS, {
    type: "bar",
    data: {
      labels: OBJECTS,
      datasets: [{
        label: "贴近度 S（韧性指数）",
        data: S.map(v => Number(v.toFixed(4))),
        backgroundColor: OBJECTS.map((_, i) =>
          i === bestIdx ? "rgba(45,212,191,.75)" :
          i === worstIdx ? "rgba(255,107,107,.70)" :
          "rgba(87,166,255,.65)"
        ),
        borderColor: "rgba(255,255,255,.10)",
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: (c) => ` S = ${c.raw}`
        }}
      },
      scales: {
        x: { ticks: { color: "rgba(232,240,255,.75)" }, grid: { color: "rgba(255,255,255,.06)" } },
        y: { min: 0, max: 1, ticks: { color: "rgba(232,240,255,.75)" }, grid: { color: "rgba(255,255,255,.06)" } }
      }
    }
  });

  // 2) 维度雷达图（基于P的维度聚合归一）
  chartRadar = new Chart(ctxRadar, {
    type: "radar",
    data: {
      labels: DIMS,
      datasets: OBJECTS.map((name, i) => ({
        label: name,
        data: dimNorm[i].map(v => Number(v.toFixed(4))),
        borderColor: i === bestIdx ? "rgba(45,212,191,.9)" : i === worstIdx ? "rgba(255,107,107,.9)" : "rgba(87,166,255,.85)",
        backgroundColor: i === bestIdx ? "rgba(45,212,191,.15)" : i === worstIdx ? "rgba(255,107,107,.12)" : "rgba(87,166,255,.10)",
        pointRadius: 2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "rgba(232,240,255,.78)" } } },
      scales: {
        r: {
          min: 0,
          max: 1,
          ticks: { display: false },
          grid: { color: "rgba(255,255,255,.08)" },
          angleLines: { color: "rgba(255,255,255,.08)" },
          pointLabels: { color: "rgba(232,240,255,.78)", font: { size: 12 } }
        }
      }
    }
  });

  // 3) 短板差距图（最低对象 Top3）
  chartGaps = new Chart(ctxGaps, {
    type: "bar",
    data: {
      labels: gaps.map(g => g.name),
      datasets: [{
        label: "与正理想差距（越大越拖后腿）",
        data: gaps.map(g => Number(g.delta.toFixed(6))),
        backgroundColor: "rgba(255,209,102,.65)",
        borderColor: "rgba(255,255,255,.10)",
        borderWidth: 1,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` 差距 = ${c.raw}` } }
      },
      scales: {
        x: { ticks: { color: "rgba(232,240,255,.75)" }, grid: { color: "rgba(255,255,255,.06)" } },
        y: { ticks: { color: "rgba(232,240,255,.75)" }, grid: { color: "rgba(255,255,255,.06)" } }
      }
    }
  });
}

// ========= 生成报告 =========
async function onCompute() {
  // 在 onCompute 函数开始位置附近添加
const selectedDistrict = document.getElementById('districtSelect').value;
  try {
    statusEl.textContent = "计算中…";
    const X = readMatrix();
    const Xn = normalizeMinMax(X);
    const { e, d, w } = entropyWeights(Xn);
    const { P, pPlus, pMinus, Lplus, Lminus, S } = topsis(Xn, w);
    const { norm: dimNorm } = dimScoresFromP(P,w);

    const roleText = roleLabel.textContent;
    const role = roleSelect.value;
    const city = cityInput.value.trim() || "（未填写）";
    const date = dateInput.value;

    const bestIdx = S.map((v, idx) => ({v, idx})).sort((a,b)=>b.v-a.v)[0].idx;
    const worstIdx = S.map((v, idx) => ({v, idx})).sort((a,b)=>a.v-b.v)[0].idx;
    
    const bestCityName = OBJECTS[bestIdx]; // 获取最优城市名
    const bestGrade = gradeByS(S[bestIdx]);
    const worstGrade = gradeByS(S[worstIdx]);

    const weightRows = INDICATORS.map((ind, j) => `
      <tr>
        <td>${escapeHtml(ind.name)}
          <div style="color:#9fb2d1;font-size:12px;margin-top:4px;">${escapeHtml(ind.dim)} · ${ind.dir === "pos" ? "正向" : "负向"}</div>
        </td>
        <td style="text-align:right;">${e[j].toFixed(4)}</td>
        <td style="text-align:right;">${d[j].toFixed(4)}</td>
        <td style="text-align:right;font-weight:800;">${w[j].toFixed(4)}</td>
      </tr>
    `).join("");

    const idealRows = INDICATORS.slice(0, 6).map((ind, j) => `
      <tr>
        <td>${escapeHtml(ind.name)}</td>
        <td style="text-align:right;">${pPlus[j].toFixed(6)}</td>
      </tr>
    `).join("");

    const resultRows = OBJECTS.map((name, i) => {
      const g = gradeByS(S[i]);
      return `
        <tr>
          <td style="font-weight:800">${escapeHtml(name)}</td>
          <td style="text-align:right;">${Lplus[i].toFixed(6)}</td>
          <td style="text-align:right;">${Lminus[i].toFixed(6)}</td>
          <td style="text-align:right;font-weight:900;color:${g.color};">${S[i].toFixed(4)}</td>
          <td style="text-align:center;color:${g.color};font-weight:900;">${g.label}</td>
        </tr>
      `;
    }).join("");

        // ================= 动态生成短板与优势文案 (专家级) =================
    
    // 1. 维度专属点评词库（优势）
    const dimAdvantageMap = {
      "自然环境": "赋予了城市天然的生态韧性底座，有效削减了极端天气带来的灾害峰值。",
      "基础设施": "构筑了坚实的物理防线，极大提升了系统的排涝吞吐量与工程冗余度。",
      "经济建设": "为防灾减灾提供了充沛的资金与资源保障，确保了灾后快速恢复的弹力。",
      "社会环境": "反映了极高的社会动员与自救互救能力，有效降低了生命财产暴露风险。",
      "管理机制": "体现了前瞻性的应急规划与高效的跨部门协同效能，实现了从被动到主动的跨越。"
    };

    // 2. 维度专属点评词库（劣势）
    const dimDisadvantageMap = {
      "自然环境": "先天本底条件较为脆弱，面对极端暴雨时极易迅速转化为灾害风险。",
      "基础设施": "工程防线存在明显欠账，排涝标准与系统冗余度无法满足当前气候挑战。",
      "经济建设": "财政与资源投入相对匮乏，限制了防灾减灾硬件升级与灾后恢复的速度。",
      "社会环境": "公众防灾意识与基层动员能力薄弱，放大了灾害发生时的社会脆弱性。",
      "管理机制": "应急预案与协同联动机制尚不健全，容易导致灾害响应滞后与管理失灵。"
    };

    // 3. 计算最差对象的短板 Top3
    const gaps = topGaps(P, pPlus, worstIdx, 3);
    const worstGapList = gaps.map((g, index) => {
      const descText = dimDisadvantageMap[g.dim] || "该指标严重偏离最优水平，是导致整体韧性评级垫底的核心制约因素。";
      const prefix = ["最大短板", "次要痛点", "潜在隐患"][index];
      return `<li style="margin-bottom:8px;"><strong>${escapeHtml(g.name)}</strong>（${escapeHtml(g.dim)}）：与正理想差距 ${g.delta.toFixed(6)}。<br/><span style="color:#aaa; font-size:13px;">↳ 作为${prefix}，${descText}</span></li>`;
    }).join("");

    // 4. 计算最优对象的优势 Top3
    const bestGaps = INDICATORS.map((ind, j) => {
      return { name: ind.name, dim: ind.dim, gap: pPlus[j] - P[bestIdx][j] };
    }).sort((a, b) => a.gap - b.gap).slice(0, 3);
    
    const bestGapList = bestGaps.map((g, index) => {
      // 智能处理 0 差距的文案
      const gapText = g.gap <= 0.000001 ? "<span style='color:#4facfe;'>达到全组最优水平（领跑者）</span>" : `与正理想差距仅为 ${g.gap.toFixed(6)}`;
      const descText = dimAdvantageMap[g.dim] || "该指标表现优异，高度逼近理论最优状态，为整体系统提供了强大的抗冲击缓冲能力。";
      const prefix = ["首要优势", "核心优势", "重要支撑"][index];
      
      return `<li style="margin-bottom:8px;"><strong>${escapeHtml(g.name)}</strong>（${escapeHtml(g.dim)}）：${gapText}。<br/><span style="color:#aaa; font-size:13px;">↳ 作为${prefix}，${descText}</span></li>`;
    }).join("");


    // ================= 动态文案配置 (深度扩充版) =================
    const levelTextMap = {
      high: {
        desc: "【高韧性场景】当前评估对象整体防涝基础扎实，系统具备较强的抗冲击与快速恢复能力。未来的核心诉求已从“被动防御”转向“主动适应”，短板主要集中在向“智慧化、生态化、精细化”进阶的瓶颈环节，需通过管理创新与前沿技术赋能来突破天花板。",
        advices: `
          <li style="margin-bottom: 12px;"><strong>深化智慧水务与数字孪生建设：</strong>在现有防涝体系基础上，全面引入物联网、大数据和人工智能技术，构建城市水务“数字孪生”平台。通过在关键管网、泵站、河道节点部署高精度传感器，实现对城市水文状态的毫秒级实时监测。结合气象预报数据，利用水动力学模型进行内涝风险的动态推演，从而在极端暴雨来临前实现精准预警与自动化调度，将“被动抢险”彻底升级为“主动防御”。</li>
          <li style="margin-bottom: 12px;"><strong>打造海绵城市 2.0 生态标杆：</strong>超越传统的“渗、滞、蓄”功能，向更高维度的生态系统服务价值迈进。在现有绿化基础上，进一步提升透水铺装率和雨水调蓄池的综合利用率，将雨水资源化利用与城市景观设计深度融合。通过建设高标准的雨水花园、下凹式绿地和生态旱溪，不仅提升极端暴雨下的径流控制率，还能有效缓解城市热岛效应，改善微气候，实现生态效益与防涝效益的双赢。</li>
          <li style="margin-bottom: 12px;"><strong>完善跨部门协同与金融风险分担机制：</strong>打破部门信息壁垒，建立水务、气象、应急、交通等多部门常态化的联合演练与数据共享机制。同时，积极引入市场化风险分担手段，探索推行巨灾保险和天气衍生品。通过金融工具将极端天气带来的巨额经济损失进行有效转移与分散，减轻政府财政的灾后重建压力，从社会经济维度全面夯实城市应对未知气候风险的综合韧性底座。</li>
        `
      },
      mid: {
        desc: "【中等韧性场景】当前评估对象防涝体系已初步成型，能够应对常规降雨挑战。但在应对极端暴雨或叠加灾害时仍存在局部脆弱性，系统冗余度有待提升，处于“补短板、强弱项”的关键转型期。",
        advices: `
          <li style="margin-bottom: 12px;"><strong>靶向改造老旧管网与消除内涝积水点：</strong>针对评估中识别出的高风险区域和短板指标（如历史易涝点、低标准管网），优先安排专项资金进行“外科手术式”的提标改造。对淤积严重、管径不足的地下排水管网进行清淤扩容，彻底打通城市排水的“微循环”梗阻。同时，建立易涝点动态销号制度，实行“一区一策”的精准治理，确保在下一个汛期来临前实质性降低核心城区的积水风险。</li>
          <li style="margin-bottom: 12px;"><strong>全面提升应急响应效能与物资储备：</strong>优化现有排涝泵站的运行调度规则，确保在暴雨预警发布后能第一时间进行预抽空作业，腾出管网与河道调蓄空间。针对地下车库、下穿隧道等高危空间，增加挡水板、沙袋及移动抽水泵车等应急抢险设备的网格化储备。定期开展社区级的防汛应急演练，打通灾害预警到达基层民众的“最后一公里”，切实提升全社会的自救与互救能力。</li>
          <li style="margin-bottom: 12px;"><strong>推进“蓝绿灰”基础设施的深度融合：</strong>在城市更新和新区建设中，严格落实海绵城市建设要求，避免单纯依赖传统的灰色管网工程。将自然水体（蓝）、生态绿地（绿）与人工排水设施（灰）有机结合，通过增加植被浅沟、雨水湿地等绿色基础设施，从源头削减地表径流峰值。这不仅能有效缓解传统管网的排水压力，还能延长管网使用寿命，构建更加弹性、可持续的城市水循环系统。</li>
        `
      },
      low: {
        desc: "【低韧性场景】当前评估对象整体韧性较弱，面临极高的内涝风险。基础设施欠账较多，管理机制尚不健全，亟待从顶层设计出发，进行全面构建与系统性升级，以守住城市安全底线。",
        advices: `
          <li style="margin-bottom: 12px;"><strong>坚守城市安全底线，开展地毯式隐患排查：</strong>面对严峻的防涝形势，首要任务是“保生命、保运转”。必须立即组织力量，对全市范围内的低洼社区、老旧小区、下穿立交、地下空间等高风险区域进行地毯式隐患排查。对排查出的严重易涝点设立明显的警示标志，并制定“一点一预案”的临时度汛措施。在暴雨期间，果断采取交通管制、人员疏散等强制性手段，坚决杜绝群死群伤事件的发生。</li>
          <li style="margin-bottom: 12px;"><strong>加大财政倾斜，加快基础防涝工程建设：</strong>大幅提高防涝减灾工程在政府固定资产投资中的占比，积极争取专项债券和上级资金支持。将有限的资金集中用于解决最紧迫的硬件短板，重点推进主干排水管网的新建与扩容，以及关键节点大型排涝泵站的建设。严格按照国家最新标准重新核定并提升城市防洪排涝设计重现期，从根本上扭转基础设施薄弱的被动局面，夯实城市生存的物理底座。</li>
          <li style="margin-bottom: 12px;"><strong>从零到一建立基础预警与社会联动机制：</strong>尽快补齐管理软实力的短板，建立气象、水务、应急等部门的实时联动机制，确保灾害性天气预警信息能够迅速转化为行动指令。制定并严格落实极端天气下的“停工、停学、停运、停业”刚性预案。同时，加强公众防灾减灾宣传教育，普及内涝避险常识，严格规范洪泛区和低洼地带的土地开发利用，从源头上控制新增风险暴露，逐步构建全社会共同参与的防线。</li>
        `
      }
    };

    const currentLevelData = levelTextMap[window.currentDataLevel || 'mid'];

// 渲染主体（在原有 innerHTML 基础上微调排版）
    reportBody.innerHTML = `
      <div class="report-wrapper">
        <div class="r-title" style="display: flex; justify-content: space-between; align-items: flex-end;">
          <span>城市洪涝韧性评估报告</span>
          <span style="font-size: 12px; font-weight: normal; opacity: 0.7;">生成时间：${new Date().toLocaleString()}</span>
        </div>
        
        <div class="r-meta">
          身份：<b>${escapeHtml(roleText)}</b> ｜ 城市/项目：<b>${escapeHtml(city)}</b> ｜ 对象：<b>${OBJECTS.length}</b> ｜ 指标：<b>${INDICATORS.length}</b>
        </div>

        <div class="kpi" style="display: flex; gap: 15px; margin-bottom: 25px;">
          <div class="box" style="flex: 1; border-top: 4px solid ${bestGrade.color}; background: rgba(255,255,255,0.02);">
            <div class="small">🏆 表现最优对象</div>
            <div class="big" style="color:${bestGrade.color}; margin: 8px 0;">${escapeHtml(OBJECTS[bestIdx])}</div>
            <div class="small">贴近度指数：<b>${S[bestIdx].toFixed(4)}</b> ｜ 等级：${bestGrade.label}</div>
          </div>
          
          <div class="box" style="flex: 1; border-top: 4px solid #ff6b6b; background: rgba(255,255,255,0.02);">
            <div class="small">⚠️ 风险预警对象</div>
            <div class="big" style="color:#ff6b6b; margin: 8px 0;">${escapeHtml(OBJECTS[worstIdx])}</div>
            <div class="small">贴近度指数：<b>${S[worstIdx].toFixed(4)}</b> ｜ 等级：${worstGrade.label}</div>
          </div>

          <div class="box" style="flex: 0.8; border-top: 4px solid var(--accent); opacity: 0.9;">
            <div class="small">算法链路</div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 12px; line-height: 1.4;">
              极差标准化 <br> 熵权法 + TOPSIS
            </div>
          </div>
        </div>

        <div class="viz-grid">
          <div class="viz-card">
            <div class="viz-title">图1：贴近度 S 分布</div>
            <div class="canvas-wrap"><canvas id="chartS"></canvas></div>
          </div>
          <div class="viz-card">
            <div class="viz-title">图2：最低对象短板差距 Top3</div>
            <div class="canvas-wrap"><canvas id="chartGaps"></canvas></div>
          </div>
        </div>

        <div class="viz-grid" style="grid-template-columns: 1fr; margin-top: 15px;">
          <div class="viz-card">
            <div class="viz-title">图3：多维度结构雷达图</div>
            <div class="canvas-wrap"><canvas id="chartRadar"></canvas></div>
          </div>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: rgba(87, 166, 255, 0.05); border: 1px solid rgba(87, 166, 255, 0.15); border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; color: var(--accent);">诊断结论与改进建议</h3>
          
          <div style="font-size: 14px; line-height: 1.8; color: #ddd;">
            <p style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
               <b>场景分析：</b>${currentLevelData.desc}
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <b style="color: #4facfe;">🏆 标杆优势指标：</b>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">${bestGapList}</ul>
              </div>
              <div>
                <b style="color: #ff6b6b;">⚠️ 关键制约短板：</b>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">${worstGapList}</ul>
              </div>
            </div>

            <div class="ai-box" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2);">
              <b style="color: var(--accent);">📑 专家改进路线：</b>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">${currentLevelData.advices}</ul>
            </div>
          </div>
        </div>

        <details style="margin-top: 20px; cursor: pointer; opacity: 0.8;">
          <summary style="font-size: 13px; color: var(--muted);">查看原始权重计算详情 (熵权法结果)</summary>
          <div style="padding-top: 15px;">
            <table class="small-table">
              <thead>
                <tr><th>指标</th><th style="text-align:right;">熵值 e</th><th style="text-align:right;">差异 d</th><th style="text-align:right;">权重 w</th></tr>
              </thead>
              <tbody>${weightRows}</tbody>
            </table>
          </div>
        </details>
      </div>
    `;

    // 画图 (完全保留，不影响原来的图表生成)
    renderCharts({
      S, bestIdx, worstIdx,
      dimNorm,
      gaps,
      gradeColors: { best: bestGrade.color, worst: worstGrade.color }
    });

    // --- 修正后的地图联动代码 ---
      if (mapChart && selectedDistrict) {
        const levelScoreMap = {
            high: 2,
            mid: 1,
            low: 0
        };
        const score = levelScoreMap[window.currentDataLevel] ?? 1;


          updateMapDistrictColor(selectedDistrict, score);
      } else {
          console.warn("未选择地区或地图未加载，跳过地图染色");
      }




    statusEl.textContent = `已计算：生成报告成功（${new Date().toLocaleTimeString()}）`;
  } catch (err) {
    statusEl.textContent = `计算失败：${err.message}`;
    destroyCharts();
    reportBody.innerHTML = `<div class="empty" style="border-color: rgba(255,107,107,.5);">计算失败：${escapeHtml(err.message)}</div>`;
  }
}
async function initMap() {
    const mapDom = document.getElementById('beijingMap');
    if (!mapDom) return;

    // 容器不可见时等待
    if (mapDom.offsetWidth === 0 || mapDom.offsetHeight === 0) {
        setTimeout(initMap, 100);
        return;
    }

    // 防止重复初始化
    if (mapChart) {
        mapChart.dispose();
    }

    mapChart = echarts.init(mapDom, 'dark');

    try {
        const response = await fetch('./data/beijing.json');
       
        const bjJson = await response.json();
        echarts.registerMap('BJ', bjJson);

        const districts = [
            "东城区", "西城区", "朝阳区", "海淀区", "丰台区", "石景山区",
            "门头沟区", "房山区", "通州区", "顺义区", "昌平区", "大兴区",
            "怀柔区", "平谷区", "密云区", "延庆区"
        ];

        // 只在第一次初始化时生成随机数据
        if (!mapData) {
            mapData = districts.map(name => ({
                name,
                value: Math.floor(Math.random() * 3)
            }));
        }

        const option = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item' },
            visualMap: {
                show: true,
                min: 0,
                max: 2,
                splitNumber: 3,
                orient: 'horizontal',
                left: 'center',
                bottom: '20px',
                inRange: { color: ['#ff6b6b', '#fadb14', '#4facfe'] },
                text: ['高', '低'],
                textStyle: { color: '#aaa' }
            },
            series: [{
                name: '北京市',
                type: 'map',
                map: 'BJ',
                label: { show: true, color: '#fff', fontSize: 10 },
                data: mapData
            }]
        };

        mapChart.setOption(option);

        setTimeout(() => {
            if (mapChart) mapChart.resize();
        }, 200);

    } catch (error) {
        console.error("地图加载失败:", error);
    }
}

function updateMapDistrictColor(districtName, value) {
    if (!mapChart || !mapData || !districtName) return;

    const target = mapData.find(item => item.name === districtName);
    if (!target) {
        console.warn("未找到对应区块：", districtName);
        return;
    }

    target.value = value;

    mapChart.setOption({
        series: [{
            data: mapData
        }]
    });
}


init();
