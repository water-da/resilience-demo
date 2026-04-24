/**
 * 主程序入口
 */
const App = {
    currentLevel: 'mid',

    init() {
        this.bindEvents();
        UIRenderer.renderTable(document.getElementById("indicatorTbody"));
        // 初始化日期等...
    },

    bindEvents() {
        document.getElementById("btnCompute").addEventListener("click", () => this.run());
        document.getElementById("btnFillHigh").addEventListener("click", () => this.fill('high'));
        // 绑定 roleSelect, reset 等事件...
    },

    readMatrix() {
        const m = OBJECTS.length, n = INDICATORS.length;
        const X = Array.from({ length: m }, () => Array(n).fill(null));
        INDICATORS.forEach((ind, j) => {
            for (let i = 0; i < m; i++) {
                const inp = document.querySelector(`.cell-input[data-key="${ind.key}"][data-obj="${i}"]`);
                X[i][j] = Number(inp.value);
            }
        });
        return X;
    },

    async run() {
        try {
            const X = this.readMatrix();
            const Xn = MathEngine.normalizeMinMax(X);
            const { e, d, w } = MathEngine.entropyWeights(Xn);
            const results = MathEngine.topsis(Xn, w);
            
            // 处理报告文案生成...
            // 调用 UIRenderer.renderCharts(...)
            console.log("计算完成", results);
        } catch (err) {
            alert(err.message);
        }
    }
};

App.init();