/**
 * 界面渲染引擎
 */
const UIRenderer = {
    charts: { s: null, radar: null, gaps: null },

    escapeHtml: (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),

    renderTable(tbody) {
        tbody.innerHTML = "";
        INDICATORS.forEach((ind) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><div style="font-weight:700">${this.escapeHtml(ind.name)}</div>
                    <div style="color:#9fb2d1;font-size:12px;margin-top:4px;">${this.escapeHtml(ind.dim)}</div></td>
                <td>${ind.dir === "pos" ? '<span class="badge-pos">正向</span>' : '<span class="badge-neg">负向</span>'}</td>
                ${OBJECTS.map((_, i) => `<td><input class="cell-input" type="number" data-key="${ind.key}" data-obj="${i}" placeholder="数值"></td>`).join('')}
            `;
            tbody.appendChild(tr);
        });
    },

    destroyCharts() {
        Object.values(this.charts).forEach(ch => { if (ch) ch.destroy(); });
    },

    renderCharts(S, bestIdx, worstIdx, dimNorm, gaps) {
        this.destroyCharts();
        // 此处粘贴你原代码中 renderCharts 的 Chart.js 初始化逻辑
        // 记得将 ctx 变量指向正确的 canvas 元素
    },

    getGrade(s) {
        if (s >= 0.66) return { label: "高", color: "#2dd4bf" };
        if (s >= 0.33) return { label: "中", color: "#ffd166" };
        return { label: "低", color: "#ff6b6b" };
    }
};