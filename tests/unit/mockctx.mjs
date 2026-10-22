// Atrapa kontekstu 2D: nic nie rysuje, ale liczy wywołania i łapie nieskończone lub NaN w argumentach.
const NUMERIC = new Set(['moveTo', 'lineTo', 'arc', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'fillRect', 'strokeRect', 'rect', 'translate', 'scale', 'rotate', 'addColorStop_num']);
export function mockCtx() {
  const state = { calls: 0, bad: [] };
  const grad = { addColorStop() {} };
  const store = {};
  const g = new Proxy(store, {
    get(t, p) {
      if (p === '__state') return state;
      if (p in t) return t[p];
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => grad;
      return (...a) => {
        state.calls++;
        if (NUMERIC.has(p)) a.forEach((v) => { if (typeof v !== 'number' || !Number.isFinite(v)) state.bad.push(`${String(p)}(${a.join(',')})`); });
      };
    },
    set(t, p, v) { t[p] = v; return true; },
  });
  return g;
}
