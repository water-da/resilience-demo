// ========= 基础配置：代表性指标（演示版）=========
const INDICATORS = [
  // 自然环境
  { key: "rain_annual", name: "年降水量（mm）", dim: "自然环境", dir: "neg" },
  { key: "storm_days", name: "暴雨日数（天/年）", dim: "自然环境", dir: "neg" },
  { key: "imperv", name: "不透水率（%）", dim: "自然环境", dir: "neg" },
  // 社会经济
  { key: "gdp_pc", name: "人均GDP（万元）", dim: "社会经济", dir: "pos" },
  { key: "emg_fund", name: "财政应急储备（亿元）", dim: "社会经济", dir: "pos" },
  { key: "industry_div", name: "产业多样性（0-1）", dim: "社会经济", dir: "pos" },
  // 基础设施
  { key: "drain_density", name: "排水管网密度（km/km²）", dim: "基础设施", dir: "pos" },
  { key: "pump_cap", name: "泵站能力（相对值）", dim: "基础设施", dir: "pos" },
  { key: "sponge_cov", name: "海绵设施覆盖率（%）", dim: "基础设施", dir: "pos" },
  // 信息化
  { key: "warn_freq", name: "预警发布频次（次/年）", dim: "信息化", dir: "pos" },
  { key: "rs_freq", name: "监测/遥感频次（次/年）", dim: "信息化", dir: "pos" },
  { key: "platform", name: "应急平台完备性（1-5）", dim: "信息化", dir: "pos" },
];

const OBJECTS = ["对象A", "对象B", "对象C"];

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
  // 绑定 landing 身份选择
  roleCards.forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      setRole(role);
      showMain();
    });
  });

  // 主页面：日期默认今天
  const today = new Date();
  dateInput.value = today.toISOString().slice(0, 10);

  // 渲染指标表
  renderIndicatorTable();

  // 右上角身份切换
  roleSelect.addEventListener("change", () => setRole(roleSelect.value));

  // 按钮事件
  btnFillHigh.addEventListener("click", () => fillExample("high"));
  btnFillMid.addEventListener("click", () => fillExample("mid"));
  btnFillLow.addEventListener("click", () => fillExample("low"));
  btnReset.addEventListener("click", clearInputs);

  btnCompute.addEventListener("click", onCompute);
  btnPrint.addEventListener("click", () => window.print());

  // 初次进入：先显示 landing（更符合你说的流程）
  // 但同时把上次角色预选好
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
    tdName.innerHTML = `<div style="font-weight:700">${ind.name}</div><div style="color:#9fb2d1;font-size:12px;margin-top:4px;">${ind.dim}</div>`;
    tr.appendChild(tdName);

    const tdDir = document.createElement("td");
    tdDir.innerHTML = ind.dir === "pos"
      ? `<span class="dir"><span class="badge-pos">正向</span><span style="color:#9fb2d1;font-size:12px;">越大越好</span></span>`
      : `<span class="dir"><span class="badge-neg">负向</span><span style="color:#9fb2d1;font-size:12px;">越大越差</span></span>`;
    tr.appendChild(tdDir);

    OBJECTS.forEach((objName, objIdx) => {
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
  reportBody.innerHTML = `<div class="empty">点击“生成报告”后，这里会出现可导出的报告内容。</div>`;
}

// ========= 示例数据 =========
function fillExample(level) {
  const presets = {
    high: {
      A: [520, 6, 45, 18, 120, 0.78, 9.2, 1.2, 38, 45, 60, 4.6],
      B: [560, 8, 52, 16, 90,  0.70, 7.8, 1.0, 30, 35, 50, 4.2],
      C: [610, 10, 60, 12, 60, 0.60, 6.2, 0.8, 22, 28, 40, 3.8],
    },
    mid: {
      A: [600, 10, 60, 12, 70, 0.60, 6.5, 0.85, 22, 25, 35, 3.6],
      B: [680, 13, 68, 10, 45, 0.52, 5.3, 0.70, 15, 18, 25, 3.0],
      C: [740, 16, 75, 8,  30, 0.45, 4.6, 0.60, 10, 12, 18, 2.6],
    },
    low: {
      A: [720, 15, 78, 8,  28, 0.42, 4.3, 0.55, 10, 10, 14, 2.4],
      B: [780, 18, 84, 7,  18, 0.35, 3.6, 0.45, 6,  7,  9,  2.0],
      C: [860, 22, 90, 5,  10, 0.28, 2.8, 0.35, 3,  4,  6,  1.6],
    }
  };

  const p = presets[level];
  const cols = [p.A, p.B, p.C];

  INDICATORS.forEach((ind, r) => {
    cols.forEach((arr, objIdx) => {
      const inp = document.querySelector(`.cell-input[data-key="${ind.key}"][data-obj="${objIdx}"]`);
      inp.value = arr[r];
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
      if (denom === 0) {
        Xn[i][j] = 0;
        continue;
      }
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

  for (let j = 0; j < n; j++) {
    const col = P.map(row => row[j]);
    if (INDICATORS[j].dir === "pos") {
      pPlus[j] = max(col);
      pMinus[j] = min(col);
    } else {
      pPlus[j] = min(col);
      pMinus[j] = max(col);
    }
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

// ========= 短板Top3 =========
function topGaps(P, pPlus, i, topN=3) {
  const gaps = INDICATORS.map((ind, j) => {
    const delta = Math.abs(P[i][j] - pPlus[j]);
    return { j, name: ind.name, dim: ind.dim, delta };
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

// ========= 生成报告 =========
function onCompute() {
  try {
    const X = readMatrix();
    const Xn = normalizeMinMax(X);
    const { e, d, w } = entropyWeights(Xn);
    const { P, pPlus, pMinus, Lplus, Lminus, S } = topsis(Xn, w);

    const roleText = roleLabel.textContent;
    const city = cityInput.value.trim() || "（未填写）";
    const date = dateInput.value;

    const bestIdx = S.map((v, idx) => ({v, idx})).sort((a,b)=>b.v-a.v)[0].idx;
    const worstIdx = S.map((v, idx) => ({v, idx})).sort((a,b)=>a.v-b.v)[0].idx;

    const bestGrade = gradeByS(S[bestIdx]);
    const worstGrade = gradeByS(S[worstIdx]);

    const weightRows = INDICATORS.map((ind, j) => `
      <tr>
        <td>${ind.name}<div style="color:#9fb2d1;font-size:12px;margin-top:4px;">${ind.dim} · ${ind.dir === "pos" ? "正向" : "负向"}</div></td>
        <td style="text-align:right;">${e[j].toFixed(4)}</td>
        <td style="text-align:right;">${d[j].toFixed(4)}</td>
        <td style="text-align:right;font-weight:800;">${w[j].toFixed(4)}</td>
      </tr>
    `).join("");

    const idealRows = INDICATORS.slice(0, 6).map((ind, j) => `
      <tr>
        <td>${ind.name}</td>
        <td style="text-align:right;">${pPlus[j].toFixed(6)}</td>
        <td style="text-align:right;">${pMinus[j].toFixed(6)}</td>
      </tr>
    `).join("");

    const resultRows = OBJECTS.map((name, i) => {
      const g = gradeByS(S[i]);
      return `
        <tr>
          <td style="font-weight:800">${name}</td>
          <td style="text-align:right;">${Lplus[i].toFixed(6)}</td>
          <td style="text-align:right;">${Lminus[i].toFixed(6)}</td>
          <td style="text-align:right;font-weight:900;color:${g.color};">${S[i].toFixed(4)}</td>
          <td style="text-align:center;color:${g.color};font-weight:900;">${g.label}</td>
        </tr>
      `;
    }).join("");

    const gaps = topGaps(P, pPlus, worstIdx, 3);
    const gapList = gaps.map(g => `<li><b>${g.name}</b>（${g.dim}）：与正理想差距 ${g.delta.toFixed(6)}</li>`).join("");

    const advice = roleSelect.value === "gov"
      ? `<ul>
          <li>优先补齐短板指标对应领域（以“差距最大项”为治理抓手）。</li>
          <li>建立年度更新机制，提升样本时序可比性。</li>
        </ul>`
      : roleSelect.value === "ins"
      ? `<ul>
          <li>对贴近度较低对象提高核保关注等级（演示口径）。</li>
          <li>将短板项作为风险问询要点（排水能力、预警能力等）。</li>
        </ul>`
      : `<ul>
          <li>针对短板项制定巡检/改造优先级（排水、监测、关键节点冗余）。</li>
          <li>将评估结果纳入运维计划年度滚动更新。</li>
        </ul>`;

    reportBody.innerHTML = `
      <div>
        <div class="r-title">城市洪涝韧性评估报告（极简演示版）</div>
        <div class="r-meta">
          身份：<b>${roleText}</b> ｜ 城市/项目：<b>${escapeHtml(city)}</b> ｜ 日期：<b>${date}</b> ｜ 对象数：<b>${OBJECTS.length}</b> ｜ 指标数：<b>${INDICATORS.length}</b>
        </div>

        <div class="kpi">
          <div class="box">
            <div class="big" style="color:${bestGrade.color};">${OBJECTS[bestIdx]} · ${S[bestIdx].toFixed(4)}</div>
            <div class="small">最高贴近度（韧性指数）｜等级：${bestGrade.label}</div>
          </div>
          <div class="box">
            <div class="big" style="color:${worstGrade.color};">${OBJECTS[worstIdx]} · ${S[worstIdx].toFixed(4)}</div>
            <div class="small">最低贴近度（韧性指数）｜等级：${worstGrade.label}</div>
          </div>
          <div class="box">
            <div class="big">方法链路</div>
            <div class="small">极差标准化 → 熵权法（e,d,w）→ TOPSIS（P⁺/P⁻, L⁺/L⁻, S）</div>
          </div>
        </div>

        <hr class="sep"/>

        <h3 style="margin:0 0 8px 0;">A. 熵权法结果：指标权重</h3>
        <div class="hint">样本差异越大 → 信息熵越小 → 权重越大。</div>
        <table class="small-table">
          <thead>
            <tr>
              <th>指标</th>
              <th style="text-align:right;">熵值 e</th>
              <th style="text-align:right;">差异系数 d=1-e</th>
              <th style="text-align:right;">权重 w</th>
            </tr>
          </thead>
          <tbody>${weightRows}</tbody>
        </table>

        <hr class="sep"/>

        <h3 style="margin:0 0 8px 0;">B. TOPSIS：正/负理想解（摘录）</h3>
        <table class="small-table">
          <thead>
            <tr>
              <th>指标（前6项摘录）</th>
              <th style="text-align:right;">正理想 p⁺</th>
              <th style="text-align:right;">负理想 p⁻</th>
            </tr>
          </thead>
          <tbody>${idealRows}</tbody>
        </table>

        <hr class="sep"/>

        <h3 style="margin:0 0 8px 0;">C. 距离与贴近度（韧性指数）</h3>
        <table class="small-table">
          <thead>
            <tr>
              <th>对象</th>
              <th style="text-align:right;">到正理想距离 L⁺</th>
              <th style="text-align:right;">到负理想距离 L⁻</th>
              <th style="text-align:right;">贴近度 S</th>
              <th style="text-align:center;">等级</th>
            </tr>
          </thead>
          <tbody>${resultRows}</tbody>
        </table>

        <hr class="sep"/>

        <h3 style="margin:0 0 8px 0;">D. 作用解释：最低韧性对象的关键短板（Top3）</h3>
        <div class="hint">以“加权规范化值与正理想解的差距”判定短板（差距越大，越拖后腿）。</div>
        <div style="margin-top:8px;">
          <b>${OBJECTS[worstIdx]}</b> 的主要短板为：
          <ol style="margin:8px 0 0 20px;">${gapList}</ol>
        </div>

        <hr class="sep"/>

        <h3 style="margin:0 0 8px 0;">E. 建议（按身份）</h3>
        ${advice}

        <hr class="sep"/>
        <div class="hint">
          免责声明：本报告用于演示“熵权法 + TOPSIS”评价链路。结果受样本规模、指标口径与输入质量影响。
        </div>
      </div>
    `;

    statusEl.textContent = `已计算：生成报告成功（${new Date().toLocaleTimeString()}）`;
  } catch (err) {
    statusEl.textContent = `计算失败：${err.message}`;
    reportBody.innerHTML = `<div class="empty" style="border-color: rgba(255,107,107,.5);">计算失败：${escapeHtml(err.message)}</div>`;
  }
}

init();
