/**
 * 算法引擎：熵权法 + TOPSIS
 */
const MathEngine = {
    min: (arr) => Math.min(...arr),
    max: (arr) => Math.max(...arr),
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
    safeLn: (x) => Math.log(Math.max(x, 1e-12)),

    normalizeMinMax(X) {
        const m = X.length, n = X[0].length;
        const Xn = Array.from({ length: m }, () => Array(n).fill(0));
        for (let j = 0; j < n; j++) {
            const col = X.map(row => row[j]);
            const colMin = this.min(col);
            const colMax = this.max(col);
            const denom = colMax - colMin || 1;
            for (let i = 0; i < m; i++) {
                Xn[i][j] = (INDICATORS[j].dir === "pos") 
                    ? (X[i][j] - colMin) / denom 
                    : (colMax - X[i][j]) / denom;
                Xn[i][j] = this.clamp(Xn[i][j], 0, 1);
            }
        }
        return Xn;
    },

    entropyWeights(Xn) {
        const m = Xn.length, n = Xn[0].length;
        const k = 1 / Math.log(m);
        const Y = Array.from({ length: m }, () => Array(n).fill(0));
        for (let j = 0; j < n; j++) {
            const colSum = this.sum(Xn.map(row => row[j])) || 1;
            for (let i = 0; i < m; i++) Y[i][j] = Xn[i][j] / colSum;
        }
        const e = Array(n).fill(0), d = Array(n).fill(0);
        for (let j = 0; j < n; j++) {
            let s = 0;
            for (let i = 0; i < m; i++) s += Y[i][j] * this.safeLn(Y[i][j]);
            e[j] = this.clamp(-k * s, 0, 1);
            d[j] = 1 - e[j];
        }
        const dSum = this.sum(d);
        const w = dSum === 0 ? Array(n).fill(1 / n) : d.map(v => v / dSum);
        return { e, d, w };
    },

    topsis(Xn, w) {
        const m = Xn.length, n = Xn[0].length;
        const P = Xn.map(row => row.map((val, j) => val * w[j]));
        const pPlus = Array(n).fill(0), pMinus = Array(n).fill(0);
        for (let j = 0; j < n; j++) {
            const col = P.map(row => row[j]);
            pPlus[j] = this.max(col);
            pMinus[j] = this.min(col);
        }
        const Lplus = Array(m).fill(0), Lminus = Array(m).fill(0), S = Array(m).fill(0);
        for (let i = 0; i < m; i++) {
            let sp = 0, sm = 0;
            for (let j = 0; j < n; j++) {
                sp += (P[i][j] - pPlus[j]) ** 2;
                sm += (P[i][j] - pMinus[j]) ** 2;
            }
            Lplus[i] = Math.sqrt(sp);
            Lminus[i] = Math.sqrt(sm);
            const denom = Lplus[i] + Lminus[i];
            S[i] = denom === 0 ? 0 : (Lminus[i] / denom);
        }
        return { P, pPlus, pMinus, Lplus, Lminus, S };
    }
};