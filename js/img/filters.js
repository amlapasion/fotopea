/* FOTOPEA · ajustes y filtros (funciones de píxeles) */
(function () {
  'use strict';
  const F = window.IMGF = {};
  const cl = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
  const lum = (r, g, b) => .299 * r + .587 * g + .114 * b;
  const copy = (id) => new ImageData(new Uint8ClampedArray(id.data), id.width, id.height);
  const lutApply = (id, lr, lg, lb) => { const d = id.data; lg = lg || lr; lb = lb || lr; for (let i = 0; i < d.length; i += 4) { d[i] = lr[d[i]]; d[i + 1] = lg[d[i + 1]]; d[i + 2] = lb[d[i + 2]]; } return id; };
  const mkLut = (fn) => { const l = new Uint8ClampedArray(256); for (let i = 0; i < 256; i++) l[i] = cl(Math.round(fn(i))); return l; };

  /* ---------- desenfoque (3 pasadas de caja ≈ gaussiano), premultiplicado ---------- */
  function boxPass(src, dst, w, h, r, ch, horiz) {
    const iarr = 1 / (r + r + 1);
    if (horiz) for (let y = 0; y < h; y++) { const row = y * w; for (let c = 0; c < ch; c++) { let ti = row, li = row, ri = row + r; const fv = src[row * ch + c], lv = src[(row + w - 1) * ch + c]; let val = (r + 1) * fv; for (let j = 0; j < r; j++) val += src[(row + Math.min(j, w - 1)) * ch + c]; for (let j = 0; j <= r; j++) { val += (ri < row + w ? src[ri * ch + c] : lv) - fv; dst[ti * ch + c] = val * iarr; ri++; ti++; } for (let j = r + 1; j < w - r; j++) { val += src[ri * ch + c] - src[li * ch + c]; dst[ti * ch + c] = val * iarr; ri++; li++; ti++; } for (let j = Math.max(w - r, r + 1); j < w; j++) { val += lv - src[li * ch + c]; dst[ti * ch + c] = val * iarr; li++; ti++; } } }
    else for (let x = 0; x < w; x++) { for (let c = 0; c < ch; c++) { let ti = x, li = x, ri = x + r * w; const fv = src[x * ch + c], lv = src[(x + w * (h - 1)) * ch + c]; let val = (r + 1) * fv; for (let j = 0; j < r; j++) val += src[(x + Math.min(j, h - 1) * w) * ch + c]; for (let j = 0; j <= r; j++) { val += (ri < w * h ? src[ri * ch + c] : lv) - fv; dst[ti * ch + c] = val * iarr; ri += w; ti += w; } for (let j = r + 1; j < h - r; j++) { val += src[ri * ch + c] - src[li * ch + c]; dst[ti * ch + c] = val * iarr; li += w; ri += w; ti += w; } for (let j = Math.max(h - r, r + 1); j < h; j++) { val += lv - src[li * ch + c]; dst[ti * ch + c] = val * iarr; li += w; ti += w; } } }
  }
  function boxesForGauss(sigma, n) { const wIdeal = Math.sqrt((12 * sigma * sigma / n) + 1); let wl = Math.floor(wIdeal); if (wl % 2 === 0) wl--; const wu = wl + 2; const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4); const m = Math.round(mIdeal); const sizes = []; for (let i = 0; i < n; i++) sizes.push(i < m ? wl : wu); return sizes; }
  /** Desenfoque gaussiano aproximado. alphaOnly: solo canal alfa */
  F.stackBlur = F.gauss = function (id, radius, alphaOnly) {
    if (radius < 1) return id; const w = id.width, h = id.height, d = id.data; const ch = alphaOnly ? 1 : 4;
    const a = new Float32Array(w * h * ch), b = new Float32Array(w * h * ch);
    if (alphaOnly) for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
    else for (let i = 0; i < w * h; i++) { const al = d[i * 4 + 3] / 255; a[i * 4] = d[i * 4] * al; a[i * 4 + 1] = d[i * 4 + 1] * al; a[i * 4 + 2] = d[i * 4 + 2] * al; a[i * 4 + 3] = d[i * 4 + 3]; }
    const boxes = boxesForGauss(radius / 2, 3);
    for (const bx of boxes) { const r = (bx - 1) / 2; if (r < 1) continue; boxPass(a, b, w, h, Math.min(r, w - 1), ch, true); boxPass(b, a, w, h, Math.min(r, h - 1), ch, false); }
    if (alphaOnly) for (let i = 0; i < w * h; i++) d[i * 4 + 3] = a[i];
    else for (let i = 0; i < w * h; i++) { const al = a[i * 4 + 3]; if (al > .5) { const k = 255 / al; d[i * 4] = a[i * 4] * k; d[i * 4 + 1] = a[i * 4 + 1] * k; d[i * 4 + 2] = a[i * 4 + 2] * k; } d[i * 4 + 3] = al; }
    return id;
  };

  /* ---------- color ---------- */
  function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const dd = mx - mn; s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6; } return [h, s, l]; }
  function hue2rgb(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
  function hsl2rgb(h, s, l) { if (!s) return [l * 255, l * 255, l * 255]; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255]; }
  F.hexToRgb = (hex) => { const n = parseInt((hex || '#000').replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

  /* ---------- ajustes ---------- */
  F.adjust = {
    brightnessContrast(id, p) { const b = p.brightness * 1.5, c = p.contrast; const f = (259 * (c * 1.275 + 255)) / (255 * (259 - c * 1.275)); return lutApply(id, mkLut(v => f * (v + b - 128) + 128)); },
    exposure(id, p) { const m = Math.pow(2, p.exposure), off = p.offset * 2.55, g = 1 / Math.max(.1, p.gamma); return lutApply(id, mkLut(v => 255 * Math.pow(cl(v * m + off) / 255, g))); },
    levels(id, p) { const lo = p.inBlack, hi = Math.max(lo + 1, p.inWhite), g = 1 / Math.max(.05, p.gamma); return lutApply(id, mkLut(v => { const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo))); return p.outBlack + Math.pow(t, g) * (p.outWhite - p.outBlack); })); },
    curves(id, p) { const L = F.curveLut(p.points || [[0, 0], [255, 255]]); const R = p.r ? F.curveLut(p.r) : null, G = p.g ? F.curveLut(p.g) : null, B = p.b ? F.curveLut(p.b) : null; const d = id.data; for (let i = 0; i < d.length; i += 4) { d[i] = L[R ? R[d[i]] : d[i]]; d[i + 1] = L[G ? G[d[i + 1]] : d[i + 1]]; d[i + 2] = L[B ? B[d[i + 2]] : d[i + 2]]; } return id; },
    hueSat(id, p) {
      const d = id.data; const hs = p.hue / 360, ss = p.saturation / 100, ls = p.lightness / 100;
      for (let i = 0; i < d.length; i += 4) {
        let [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        if (p.colorize) { h = (p.hue < 0 ? p.hue + 360 : p.hue) / 360; s = Math.max(0, Math.min(1, .25 + ss * .75)); } else { h = (h + hs + 1) % 1; s = ss > 0 ? s + (1 - s) * ss * s : s * (1 + ss); }
        l = ls > 0 ? l + (1 - l) * ls : l * (1 + ls); const c = hsl2rgb(h, Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, l))); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
      } return id;
    },
    vibrance(id, p) { const d = id.data; const v = p.vibrance / 100, sat = p.saturation / 100; for (let i = 0; i < d.length; i += 4) { let r = d[i], g = d[i + 1], b = d[i + 2]; const mx = Math.max(r, g, b), avg = (r + g + b) / 3; const amt = (1 - Math.abs(mx - avg) * 2 / 255) * v; const l = lum(r, g, b); const f = 1 + amt + sat; d[i] = cl(l + (r - l) * f); d[i + 1] = cl(l + (g - l) * f); d[i + 2] = cl(l + (b - l) * f); } return id; },
    temperature(id, p) { const t = p.temperature / 100, ti = p.tint / 100; const d = id.data; for (let i = 0; i < d.length; i += 4) { d[i] = cl(d[i] + t * 40 + ti * 15); d[i + 1] = cl(d[i + 1] - ti * 30); d[i + 2] = cl(d[i + 2] - t * 40 + ti * 15); } return id; },
    colorBalance(id, p) {
      const d = id.data; const S = [p.sCR, p.sMG, p.sYB], M = [p.mCR, p.mMG, p.mYB], H = [p.hCR, p.hMG, p.hYB];
      for (let i = 0; i < d.length; i += 4) { const l = lum(d[i], d[i + 1], d[i + 2]) / 255; const ws = Math.max(0, 1 - l * 3), wh = Math.max(0, l * 3 - 2), wm = 1 - ws - wh; for (let c = 0; c < 3; c++) d[i + c] = cl(d[i + c] + (S[c] * ws + M[c] * wm + H[c] * wh) * .8); }
      return id;
    },
    shadowsHighlights(id, p) {
      const w = id.width, h = id.height, d = id.data; const L = new ImageData(w, h); const ld = L.data;
      for (let i = 0; i < d.length; i += 4) { ld[i + 3] = lum(d[i], d[i + 1], d[i + 2]); }
      F.gauss(L, Math.max(4, Math.round(Math.min(w, h) / 60)), true);
      const sh = p.shadows / 100, hi = p.highlights / 100;
      for (let i = 0; i < d.length; i += 4) { const m = ld[i + 3] / 255; const ws = Math.pow(1 - m, 2), wh = Math.pow(m, 2); const k = 1 + sh * ws * 1.2 - hi * wh * .6; const add = sh * ws * 25 - hi * wh * 30; for (let c = 0; c < 3; c++) d[i + c] = cl(d[i + c] * k + add); }
      return id;
    },
    blackWhite(id, p) { const d = id.data; const t = (p.r + p.g + p.b) || 1; for (let i = 0; i < d.length; i += 4) { const v = (d[i] * p.r + d[i + 1] * p.g + d[i + 2] * p.b) / t; d[i] = d[i + 1] = d[i + 2] = cl(v); } return id; },
    sepia(id, p) { const d = id.data; const a = (p.amount != null ? p.amount : 100) / 100; for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; d[i] = cl(r * (1 - a) + a * (r * .393 + g * .769 + b * .189)); d[i + 1] = cl(g * (1 - a) + a * (r * .349 + g * .686 + b * .168)); d[i + 2] = cl(b * (1 - a) + a * (r * .272 + g * .534 + b * .131)); } return id; },
    invert(id) { return lutApply(id, mkLut(v => 255 - v)); },
    posterize(id, p) { const n = Math.max(2, p.levels | 0); return lutApply(id, mkLut(v => Math.round(Math.round(v / 255 * (n - 1)) * 255 / (n - 1)))); },
    threshold(id, p) { const d = id.data; for (let i = 0; i < d.length; i += 4) { const v = lum(d[i], d[i + 1], d[i + 2]) >= p.level ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; } return id; },
    opacity(id, p) { const d = id.data; const k = p.opacity / 100; for (let i = 3; i < d.length; i += 4) d[i] = d[i] * k; return id; },
    colorToAlpha(id, p) { const [r0, g0, b0] = F.hexToRgb(p.color); const t = p.tolerance * 4.4; const d = id.data; for (let i = 0; i < d.length; i += 4) { const dd = Math.sqrt((d[i] - r0) ** 2 + (d[i + 1] - g0) ** 2 + (d[i + 2] - b0) ** 2); if (dd <= t) d[i + 3] = 0; else if (dd <= t * 1.5) d[i + 3] = d[i + 3] * (dd - t) / (t * .5); } return id; },
    autoWhiteBalance(id) { const d = id.data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 16) { if (d[i + 3] < 10) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } if (!n) return id; r /= n; g /= n; b /= n; const avg = (r + g + b) / 3; return lutApply(id, mkLut(v => v * avg / r), mkLut(v => v * avg / g), mkLut(v => v * avg / b)); },
    autoLevels(id) { const d = id.data; const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]; let n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 10) continue; hist[0][d[i]]++; hist[1][d[i + 1]]++; hist[2][d[i + 2]]++; n++; } const cut = n * .005; const luts = hist.map(hh => { let lo = 0, hi = 255, s = 0; while (lo < 255 && (s += hh[lo]) < cut) lo++; s = 0; while (hi > 0 && (s += hh[hi]) < cut) hi--; if (hi <= lo) return mkLut(v => v); return mkLut(v => (v - lo) * 255 / (hi - lo)); }); return lutApply(id, luts[0], luts[1], luts[2]); },
  };
  F.ADJ_DEFS = {
    brightnessContrast: { name: 'Brillo / Contraste', params: [['brightness', 'Brillo', -100, 100, 0], ['contrast', 'Contraste', -100, 100, 0]] },
    exposure: { name: 'Exposición', params: [['exposure', 'Exposición (EV)', -3, 3, 0, .05], ['offset', 'Desplazamiento', -50, 50, 0], ['gamma', 'Gamma', .2, 3, 1, .01]] },
    levels: { name: 'Niveles', params: [['inBlack', 'Entrada: negro', 0, 254, 0], ['gamma', 'Gamma (medios tonos)', .1, 4, 1, .01], ['inWhite', 'Entrada: blanco', 1, 255, 255], ['outBlack', 'Salida: negro', 0, 255, 0], ['outWhite', 'Salida: blanco', 0, 255, 255]] },
    curves: { name: 'Curvas', custom: 'curves', params: [] },
    hueSat: { name: 'Tono / Saturación', params: [['hue', 'Tono', -180, 180, 0], ['saturation', 'Saturación', -100, 100, 0], ['lightness', 'Luminosidad', -100, 100, 0], ['colorize', 'Colorear', 'bool', 0, false]] },
    vibrance: { name: 'Intensidad (vibrance)', params: [['vibrance', 'Intensidad', -100, 100, 0], ['saturation', 'Saturación', -100, 100, 0]] },
    temperature: { name: 'Temperatura / Balance de blancos', params: [['temperature', 'Temperatura', -100, 100, 0], ['tint', 'Matiz (verde ↔ magenta)', -100, 100, 0]] },
    colorBalance: { name: 'Equilibrio de color', params: [['sCR', 'Sombras: cian ↔ rojo', -100, 100, 0], ['sMG', 'Sombras: magenta ↔ verde', -100, 100, 0], ['sYB', 'Sombras: amarillo ↔ azul', -100, 100, 0], ['mCR', 'Medios: cian ↔ rojo', -100, 100, 0], ['mMG', 'Medios: magenta ↔ verde', -100, 100, 0], ['mYB', 'Medios: amarillo ↔ azul', -100, 100, 0], ['hCR', 'Luces: cian ↔ rojo', -100, 100, 0], ['hMG', 'Luces: magenta ↔ verde', -100, 100, 0], ['hYB', 'Luces: amarillo ↔ azul', -100, 100, 0]] },
    shadowsHighlights: { name: 'Sombras / Iluminaciones', params: [['shadows', 'Aclarar sombras', 0, 100, 35], ['highlights', 'Recuperar iluminaciones', 0, 100, 0]] },
    blackWhite: { name: 'Blanco y negro', params: [['r', 'Rojos', 0, 200, 30], ['g', 'Verdes', 0, 200, 59], ['b', 'Azules', 0, 200, 11]] },
    sepia: { name: 'Sepia', params: [['amount', 'Intensidad', 0, 100, 100]] },
    invert: { name: 'Invertir', params: [] },
    posterize: { name: 'Posterizar', params: [['levels', 'Niveles', 2, 32, 4]] },
    threshold: { name: 'Umbral', params: [['level', 'Nivel', 1, 255, 128]] },
    opacity: { name: 'Transparencia', params: [['opacity', 'Opacidad de los píxeles', 0, 100, 50]] },
    colorToAlpha: { name: 'Color a transparencia', params: [['color', 'Color', 'color', 0, '#ffffff'], ['tolerance', 'Tolerancia', 0, 100, 15]] },
  };
  F.defaults = (kind) => { const o = {}; (F.ADJ_DEFS[kind].params || []).forEach(p => o[p[0]] = p[4]); if (kind === 'curves') o.points = [[0, 0], [255, 255]]; return o; };
  F.applyAdjust = function (id, adj) { const fn = F.adjust[adj.kind]; if (!fn) return id; return fn(id, adj.params || {}) || id; };
  /** LUT de curva por spline monótona */
  F.curveLut = function (pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0]); const n = pts.length; const lut = new Uint8ClampedArray(256);
    if (n < 2) { for (let i = 0; i < 256; i++) lut[i] = i; return lut; }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const dx = [], m = [], sl = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i] || 1e-6; sl[i] = (ys[i + 1] - ys[i]) / dx[i]; }
    m[0] = sl[0]; m[n - 1] = sl[n - 2]; for (let i = 1; i < n - 1; i++) m[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
    for (let i = 0; i < n - 1; i++) { if (sl[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / sl[i], b = m[i + 1] / sl[i]; const s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * sl[i]; m[i + 1] = t * b * sl[i]; } }
    for (let x = 0; x < 256; x++) { if (x <= xs[0]) { lut[x] = ys[0]; continue; } if (x >= xs[n - 1]) { lut[x] = ys[n - 1]; continue; } let i = 0; while (x > xs[i + 1]) i++; const hh = dx[i], t = (x - xs[i]) / hh, t2 = t * t, t3 = t2 * t; lut[x] = cl((2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * hh * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * hh * m[i + 1]); }
    return lut;
  };

  /* ---------- filtros ---------- */
  const toCanvas = (id) => { const c = FP.canvas(id.width, id.height); c.getContext('2d').putImageData(id, 0, 0); return c; };
  const fromCanvas = (c) => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
  function convolve(id, k, div, bias, keepAlpha) { const w = id.width, h = id.height, s = id.data; const o = new Uint8ClampedArray(s.length); const n = Math.sqrt(k.length) | 0, hn = n >> 1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let r = 0, g = 0, b = 0; for (let ky = 0; ky < n; ky++) { const yy = Math.min(h - 1, Math.max(0, y + ky - hn)); for (let kx = 0; kx < n; kx++) { const xx = Math.min(w - 1, Math.max(0, x + kx - hn)); const i = (yy * w + xx) * 4, kv = k[ky * n + kx]; r += s[i] * kv; g += s[i + 1] * kv; b += s[i + 2] * kv; } } const i = (y * w + x) * 4; o[i] = r / div + bias; o[i + 1] = g / div + bias; o[i + 2] = b / div + bias; o[i + 3] = s[i + 3]; } id.data.set(o); return id; }
  function sample(s, w, h, x, y, out, o) { x = Math.max(0, Math.min(w - 1.001, x)); y = Math.max(0, Math.min(h - 1.001, y)); const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0; const i00 = (y0 * w + x0) * 4, i10 = i00 + 4, i01 = i00 + w * 4, i11 = i01 + 4; for (let c = 0; c < 4; c++) out[o + c] = (s[i00 + c] * (1 - fx) + s[i10 + c] * fx) * (1 - fy) + (s[i01 + c] * (1 - fx) + s[i11 + c] * fx) * fy; }
  function warp(id, fn) { const w = id.width, h = id.height; const s = new Uint8ClampedArray(id.data); const d = id.data; const t = [0, 0]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (fn(x, y, t)) sample(s, w, h, t[0], t[1], d, (y * w + x) * 4); } return id; }
  F.filters = {
    gaussian: { name: 'Desenfoque gaussiano', params: [['radius', 'Radio (px)', 1, 200, 6]], fn: (id, p) => F.gauss(id, p.radius) },
    motion: { name: 'Desenfoque de movimiento', params: [['angle', 'Ángulo', -180, 180, 0], ['distance', 'Distancia (px)', 1, 300, 30]], fn: (id, p) => { const c = toCanvas(id); const o = FP.canvas(c.width, c.height); const x = o.getContext('2d'); const n = Math.min(64, Math.max(4, p.distance)); const a = p.angle * Math.PI / 180; for (let i = 0; i < n; i++) { const t = (i / (n - 1) - .5) * p.distance; x.globalAlpha = 1 / (i + 1); x.drawImage(c, Math.cos(a) * t, -Math.sin(a) * t); } return fromCanvas(o); } },
    radial: { name: 'Desenfoque radial', params: [['mode', 'Modo', ['zoom', 'spin'], 0, 'zoom'], ['amount', 'Cantidad', 1, 100, 20], ['cx', 'Centro X (%)', 0, 100, 50], ['cy', 'Centro Y (%)', 0, 100, 50]], fn: (id, p) => { const c = toCanvas(id); const o = FP.canvas(c.width, c.height); const x = o.getContext('2d'); const cx = c.width * p.cx / 100, cy = c.height * p.cy / 100; const n = 32; for (let i = 0; i < n; i++) { const t = i / (n - 1) - .5; x.save(); x.globalAlpha = 1 / (i + 1); x.translate(cx, cy); if (p.mode === 'spin') x.rotate(t * p.amount * Math.PI / 180); else { const s = 1 + t * p.amount / 250; x.scale(s, s); } x.drawImage(c, -cx, -cy); x.restore(); } return fromCanvas(o); } },
    sharpen: { name: 'Enfocar (máscara de enfoque)', params: [['amount', 'Cantidad (%)', 1, 500, 100], ['radius', 'Radio (px)', 1, 50, 2], ['threshold', 'Umbral', 0, 100, 0]], fn: (id, p) => { const b = F.gauss(copy(id), p.radius); const d = id.data, bd = b.data, k = p.amount / 100; for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) { const diff = d[i + c] - bd[i + c]; if (Math.abs(diff) >= p.threshold) d[i + c] = cl(d[i + c] + diff * k); } return id; } },
    emboss: { name: 'Relieve', params: [['strength', 'Intensidad', 1, 5, 1], ['gray', 'Gris', 'bool', 0, true]], fn: (id, p) => { const s = p.strength; convolve(id, [-2 * s, -s, 0, -s, 1, s, 0, s, 2 * s], 1, 128); if (p.gray) F.adjust.blackWhite(id, { r: 30, g: 59, b: 11 }); return id; } },
    edges: { name: 'Hallar bordes', params: [['invert', 'Fondo blanco', 'bool', 0, true]], fn: (id, p) => { const w = id.width, h = id.height, s = new Uint8ClampedArray(id.data), d = id.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const g = (xx, yy) => { xx = Math.max(0, Math.min(w - 1, xx)); yy = Math.max(0, Math.min(h - 1, yy)); const i = (yy * w + xx) * 4; return lum(s[i], s[i + 1], s[i + 2]); }; const gx = -g(x - 1, y - 1) - 2 * g(x - 1, y) - g(x - 1, y + 1) + g(x + 1, y - 1) + 2 * g(x + 1, y) + g(x + 1, y + 1); const gy = -g(x - 1, y - 1) - 2 * g(x, y - 1) - g(x + 1, y - 1) + g(x - 1, y + 1) + 2 * g(x, y + 1) + g(x + 1, y + 1); let v = cl(Math.hypot(gx, gy)); if (p.invert) v = 255 - v; const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; } return id; } },
    noise: { name: 'Añadir ruido', params: [['amount', 'Cantidad', 1, 100, 12], ['mono', 'Monocromático', 'bool', 0, true]], fn: (id, p) => { const d = id.data, a = p.amount * 2.2; for (let i = 0; i < d.length; i += 4) { const r = (Math.random() + Math.random() + Math.random() - 1.5) * a; d[i] = cl(d[i] + r); d[i + 1] = cl(d[i + 1] + (p.mono ? r : (Math.random() + Math.random() + Math.random() - 1.5) * a)); d[i + 2] = cl(d[i + 2] + (p.mono ? r : (Math.random() + Math.random() + Math.random() - 1.5) * a)); } return id; } },
    median: { name: 'Reducir ruido (mediana)', params: [['radius', 'Radio', 1, 4, 1]], fn: (id, p) => { const w = id.width, h = id.height, s = new Uint8ClampedArray(id.data), d = id.data, r = p.radius; const arr = [[], [], []]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { arr[0].length = arr[1].length = arr[2].length = 0; for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) { const i = (yy * w + xx) * 4; arr[0].push(s[i]); arr[1].push(s[i + 1]); arr[2].push(s[i + 2]); } const i = (y * w + x) * 4; for (let c = 0; c < 3; c++) { arr[c].sort((a, b) => a - b); d[i + c] = arr[c][arr[c].length >> 1]; } } return id; } },
    pixelate: { name: 'Pixelar', params: [['size', 'Tamaño de celda', 2, 200, 12]], fn: (id, p) => { const c = toCanvas(id); const s = Math.max(1, p.size); const t = FP.canvas(Math.ceil(c.width / s), Math.ceil(c.height / s)); const tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(c, 0, 0, t.width, t.height); const o = FP.canvas(c.width, c.height); const ox = o.getContext('2d'); ox.imageSmoothingEnabled = false; ox.drawImage(t, 0, 0, t.width * s, t.height * s); return fromCanvas(o); } },
    mosaic: { name: 'Mosaico', params: [['size', 'Tamaño de tesela', 4, 200, 20], ['grout', 'Junta (px)', 0, 10, 2], ['color', 'Color de junta', 'color', 0, '#333333']], fn: (id, p) => { const r = F.filters.pixelate.fn(id, { size: p.size }); const c = toCanvas(r); const x = c.getContext('2d'); x.fillStyle = p.color; if (p.grout) { for (let X = 0; X < c.width; X += p.size) x.fillRect(X, 0, p.grout, c.height); for (let Y = 0; Y < c.height; Y += p.size) x.fillRect(0, Y, c.width, p.grout); } return fromCanvas(c); } },
    vignette: { name: 'Viñeta', params: [['amount', 'Intensidad', -100, 100, 60], ['size', 'Tamaño', 0, 100, 50], ['soft', 'Suavidad', 1, 100, 60]], fn: (id, p) => { const w = id.width, h = id.height, d = id.data; const cx = w / 2, cy = h / 2, R = Math.hypot(cx, cy); const r0 = R * (.2 + .6 * p.size / 100), r1 = r0 + R * p.soft / 100; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dd = Math.hypot(x - cx, y - cy); let t = dd <= r0 ? 0 : dd >= r1 ? 1 : (dd - r0) / (r1 - r0); t = t * t * (3 - 2 * t) * p.amount / 100; const i = (y * w + x) * 4; for (let c = 0; c < 3; c++) d[i + c] = t > 0 ? cl(d[i + c] * (1 - t)) : cl(d[i + c] + (255 - d[i + c]) * -t); } return id; } },
    glow: { name: 'Resplandor difuso', params: [['radius', 'Radio', 1, 100, 15], ['amount', 'Intensidad', 0, 100, 50], ['threshold', 'Umbral de brillo', 0, 255, 150]], fn: (id, p) => { const b = copy(id); const bd = b.data; for (let i = 0; i < bd.length; i += 4) { if (lum(bd[i], bd[i + 1], bd[i + 2]) < p.threshold) { bd[i] = bd[i + 1] = bd[i + 2] = 0; } } F.gauss(b, p.radius); const d = id.data, k = p.amount / 100; for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = cl(255 - (255 - d[i + c]) * (255 - bd[i + c] * k) / 255); return id; } },
    twirl: { name: 'Remolino', params: [['angle', 'Ángulo', -720, 720, 180], ['radius', 'Radio (%)', 5, 100, 60]], fn: (id, p) => { const w = id.width, h = id.height, cx = w / 2, cy = h / 2, R = Math.min(cx, cy) * p.radius / 100, A = p.angle * Math.PI / 180; return warp(id, (x, y, t) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d >= R) return false; const a = Math.atan2(dy, dx) + A * (1 - d / R) * (1 - d / R); t[0] = cx + d * Math.cos(a); t[1] = cy + d * Math.sin(a); return true; }); } },
    spherize: { name: 'Esferizar / Pellizcar', params: [['amount', 'Cantidad', -100, 100, 50]], fn: (id, p) => { const w = id.width, h = id.height, cx = w / 2, cy = h / 2, R = Math.min(cx, cy), k = p.amount / 100; return warp(id, (x, y, t) => { const dx = (x - cx) / R, dy = (y - cy) / R, d = Math.hypot(dx, dy); if (d >= 1 || d === 0) return false; const nd = k > 0 ? Math.pow(d, 1 + k) : Math.pow(d, 1 / (1 - k)); const f = nd / d; t[0] = cx + dx * f * R; t[1] = cy + dy * f * R; return true; }); } },
    wave: { name: 'Ondas', params: [['amp', 'Amplitud (px)', 1, 100, 10], ['len', 'Longitud de onda (px)', 4, 500, 80], ['dir', 'Dirección', ['horizontal', 'vertical', 'ambas'], 0, 'ambas']], fn: (id, p) => warp(id, (x, y, t) => { t[0] = x + (p.dir !== 'vertical' ? p.amp * Math.sin(2 * Math.PI * y / p.len) : 0); t[1] = y + (p.dir !== 'horizontal' ? p.amp * Math.sin(2 * Math.PI * x / p.len) : 0); return true; }) },
    ripple: { name: 'Rizo (ondas concéntricas)', params: [['amp', 'Amplitud', 1, 50, 6], ['len', 'Longitud de onda', 4, 200, 30]], fn: (id, p) => { const cx = id.width / 2, cy = id.height / 2; return warp(id, (x, y, t) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1; const o = p.amp * Math.sin(2 * Math.PI * d / p.len); t[0] = x + dx / d * o; t[1] = y + dy / d * o; return true; }); } },
    duotone: { name: 'Duotono', params: [['dark', 'Color sombras', 'color', 0, '#1b1464'], ['light', 'Color luces', 'color', 0, '#ffb347']], fn: (id, p) => { const a = F.hexToRgb(p.dark), b = F.hexToRgb(p.light); const d = id.data; for (let i = 0; i < d.length; i += 4) { const t = lum(d[i], d[i + 1], d[i + 2]) / 255; for (let c = 0; c < 3; c++) d[i + c] = a[c] + (b[c] - a[c]) * t; } return id; } },
    vintage: { name: 'Efecto vintage', params: [['amount', 'Intensidad', 0, 100, 70]], fn: (id, p) => { const k = p.amount / 100; F.adjust.sepia(id, { amount: 45 * k }); F.adjust.curves(id, { points: [[0, 30 * k], [128, 128], [255, 255 - 25 * k]] }); return F.filters.vignette.fn(id, { amount: 45 * k, size: 55, soft: 60 }); } },
    crossProcess: { name: 'Proceso cruzado', params: [['amount', 'Intensidad', 0, 100, 70]], fn: (id, p) => { const k = p.amount / 100; return F.adjust.curves(id, { points: [[0, 0], [255, 255]], r: [[0, 0], [64, 64 - 20 * k], [192, 192 + 30 * k], [255, 255]], g: [[0, 0], [64, 64 - 10 * k], [192, 192 + 20 * k], [255, 255]], b: [[0, 30 * k], [255, 255 - 40 * k]] }); } },
    solarize: { name: 'Solarizar', params: [['level', 'Umbral', 0, 255, 128]], fn: (id, p) => lutApply(id, mkLut(v => v > p.level ? 255 - v : v)) },
    oil: { name: 'Pintura (suavizado de bordes)', params: [['radius', 'Radio', 1, 6, 3], ['levels', 'Niveles', 4, 40, 20]], fn: (id, p) => { const w = id.width, h = id.height, s = new Uint8ClampedArray(id.data), d = id.data, r = p.radius, L = p.levels; const cnt = new Int32Array(L), sr = new Int32Array(L), sg = new Int32Array(L), sb = new Int32Array(L); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { cnt.fill(0); sr.fill(0); sg.fill(0); sb.fill(0); for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) { const i = (yy * w + xx) * 4; const k = Math.min(L - 1, (lum(s[i], s[i + 1], s[i + 2]) * L / 256) | 0); cnt[k]++; sr[k] += s[i]; sg[k] += s[i + 1]; sb[k] += s[i + 2]; } let m = 0; for (let k = 1; k < L; k++) if (cnt[k] > cnt[m]) m = k; const i = (y * w + x) * 4; d[i] = sr[m] / cnt[m]; d[i + 1] = sg[m] / cnt[m]; d[i + 2] = sb[m] / cnt[m]; } return id; } },
  };
  F.FILTER_MENU = [
    ['Desenfocar', ['gaussian', 'motion', 'radial']], ['Enfocar', ['sharpen']], ['Ruido', ['noise', 'median']],
    ['Estilizar', ['emboss', 'edges', 'solarize', 'oil', 'glow']], ['Pixelar', ['pixelate', 'mosaic']], ['Distorsionar', ['twirl', 'spherize', 'wave', 'ripple']],
    ['Efectos de color', ['duotone', 'vintage', 'crossProcess']], ['Iluminación', ['vignette']],
  ];
  F.histogram = function (id) { const d = id.data; const h = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 5) continue; h[0][d[i]]++; h[1][d[i + 1]]++; h[2][d[i + 2]]++; h[3][lum(d[i], d[i + 1], d[i + 2]) | 0]++; } return h; };
})();
