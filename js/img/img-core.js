/* FOTOPEA · núcleo del editor de imágenes: documento, capas, máscaras, selección, historial, composición */
(function () {
  'use strict';
  const I = window.IMGC = {};
  const cv = (w, h) => FP.canvas(w, h);
  const ctx2 = (c) => c.getContext('2d', { willReadFrequently: false });
  I.cloneCanvas = (c) => { if (!c) return c; const n = cv(c.width, c.height); n.getContext('2d').drawImage(c, 0, 0); return n; };
  I.BLENDS = [['source-over', 'Normal'], ['multiply', 'Multiplicar'], ['screen', 'Trama'], ['overlay', 'Superponer'], ['darken', 'Oscurecer'], ['lighten', 'Aclarar'], ['color-dodge', 'Sobreexponer color'], ['color-burn', 'Subexponer color'], ['hard-light', 'Luz fuerte'], ['soft-light', 'Luz suave'], ['difference', 'Diferencia'], ['exclusion', 'Exclusión'], ['hue', 'Tono'], ['saturation', 'Saturación'], ['color', 'Color'], ['luminosity', 'Luminosidad']];

  /* ---------- documento ---------- */
  I.newDoc = function (w, h, name, fill) {
    const d = { w, h, name: name || 'Sin título', layers: [], activeId: null, sel: null, dpi: 72, ver: 1 };
    const bg = I.newLayer(d, fill === 'transparent' ? 'Capa 1' : 'Fondo');
    if (fill && fill !== 'transparent') { const x = ctx2(bg.canvas); x.fillStyle = fill; x.fillRect(0, 0, w, h); }
    d.layers.push(bg); d.activeId = bg.id; return d;
  };
  I.newLayer = function (d, name, canvas, x, y) {
    return { id: FP.uid(), type: 'raster', name: name || 'Capa', visible: true, locked: false, opacity: 1, blend: 'source-over', x: x || 0, y: y || 0, canvas: canvas || cv(d.w, d.h), mask: null, maskOn: true, fx: null, ver: 1 };
  };
  I.walk = function (list, fn, parent) { for (const l of list) { if (fn(l, parent, list) === false) return false; if (l.children && I.walk(l.children, fn, l) === false) return false; } };
  I.find = function (d, id) { let r = null; I.walk(d.layers, (l, p, list) => { if (l.id === id) { r = { l, parent: p, list }; return false; } }); return r; };
  I.active = (d) => { const f = d && I.find(d, d.activeId); return f ? f.l : null; };
  I.flat = (d) => { const a = []; I.walk(d.layers, l => { a.push(l); }); return a; };

  /* ---------- historial (copia en escritura) ---------- */
  const cloneTree = (list) => list.map(l => { const c = Object.assign({}, l); if (l.text) c.text = Object.assign({}, l.text); if (l.fx) c.fx = JSON.parse(JSON.stringify(l.fx)); if (l.adj) c.adj = JSON.parse(JSON.stringify(l.adj)); if (l.children) c.children = cloneTree(l.children); return c; });
  I.snapshot = (d) => ({ w: d.w, h: d.h, activeId: d.activeId, sel: d.sel, dpi: d.dpi, tree: cloneTree(d.layers) });
  I.restore = (d, s) => { d.w = s.w; d.h = s.h; d.activeId = s.activeId; d.sel = s.sel; d.dpi = s.dpi; d.layers = cloneTree(s.tree); d.ver++; I.selChanged(d); };
  I.history = { undo: [], redo: [], max: 60 };
  I.resetHistory = () => { I.history.undo = []; I.history.redo = []; };
  /** Registra un paso. layers: capas cuyos píxeles se modificarán (se clonan) */
  I.edit = function (d, label, layers, opts) {
    opts = opts || {};
    I.history.undo.push({ label, s: I.snapshot(d), t: Date.now() }); I.history.redo = [];
    while (I.history.undo.length > I.history.max) I.history.undo.shift();
    (layers || []).forEach(l => { if (!l) return; if (opts.mask) { if (l.mask) l.mask = I.cloneCanvas(l.mask); } else if (l.canvas && l.type !== 'group') l.canvas = I.cloneCanvas(l.canvas); l.ver = (l.ver || 0) + 1; });
    d.ver++; if (I.onChange) I.onChange(label);
  };
  I.undo = (d) => { const h = I.history.undo.pop(); if (!h) return null; I.history.redo.push({ label: h.label, s: I.snapshot(d) }); I.restore(d, h.s); return h.label; };
  I.redo = (d) => { const h = I.history.redo.pop(); if (!h) return null; I.history.undo.push({ label: h.label, s: I.snapshot(d) }); I.restore(d, h.s); return h.label; };

  /* ---------- máscaras ---------- */
  /** Convierte máscara en escala de grises a canal alfa (cache por versión) */
  I.maskAlpha = function (l) {
    const m = l.mask; if (!m) return null;
    if (m._alpha && m._alphaVer === m._ver) return m._alpha;
    const a = m._alpha && m._alpha.width === m.width && m._alpha.height === m.height ? m._alpha : cv(m.width, m.height);
    const src = m.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, m.width, m.height); const d = src.data;
    for (let i = 0; i < d.length; i += 4) { d[i + 3] = d[i]; d[i] = d[i + 1] = d[i + 2] = 0; }
    a.getContext('2d').putImageData(src, 0, 0); m._alpha = a; m._alphaVer = m._ver; return a;
  };
  I.touchMask = (l) => { if (l.mask) l.mask._ver = (l.mask._ver || 0) + 1; };
  I.addMask = function (d, l, fromSel, hideAll) {
    const m = cv(l.canvas.width, l.canvas.height); const x = m.getContext('2d');
    x.fillStyle = hideAll ? '#000' : '#fff'; x.fillRect(0, 0, m.width, m.height);
    if (fromSel && d.sel) { x.fillStyle = '#000'; x.fillRect(0, 0, m.width, m.height); const t = cv(m.width, m.height); const tx = t.getContext('2d'); tx.drawImage(d.sel, -l.x, -l.y); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#fff'; tx.fillRect(0, 0, t.width, t.height); x.drawImage(t, 0, 0); }
    m._ver = 1; l.mask = m; l.maskOn = true;
  };

  /* ---------- efectos de capa ---------- */
  function dilate(alphaCanvas, r) { // trazo exterior: dilatación aproximada con desplazamientos
    const c = cv(alphaCanvas.width + 2 * r, alphaCanvas.height + 2 * r); const x = c.getContext('2d');
    const steps = Math.max(8, Math.min(48, Math.round(r * 2)));
    for (let i = 0; i < steps; i++) { const a = i / steps * Math.PI * 2; x.drawImage(alphaCanvas, r + Math.cos(a) * r, r + Math.sin(a) * r); }
    for (let rr = r - 1; rr > 0; rr -= Math.max(1, r / 3)) for (let i = 0; i < steps; i++) { const a = i / steps * Math.PI * 2; x.drawImage(alphaCanvas, r + Math.cos(a) * rr, r + Math.sin(a) * rr); }
    return c;
  }
  function fxCanvas(l, src) {
    const fx = l.fx; const key = l.ver + ':' + JSON.stringify(fx) + ':' + src.width + 'x' + src.height;
    if (l._fxKey === key && l._fxC) return l._fxC;
    let pad = 0; if (fx.shadow && fx.shadow.on) pad = Math.max(pad, fx.shadow.blur * 2 + Math.hypot(fx.shadow.dx, fx.shadow.dy)); if (fx.glow && fx.glow.on) pad = Math.max(pad, fx.glow.size * 2); if (fx.stroke && fx.stroke.on) pad = Math.max(pad, fx.stroke.width + 2);
    pad = Math.ceil(pad);
    const c = cv(src.width + 2 * pad, src.height + 2 * pad); const x = c.getContext('2d');
    if (fx.shadow && fx.shadow.on) { const s = fx.shadow; x.save(); x.shadowColor = hexA(s.color, s.opacity); x.shadowBlur = s.blur; x.shadowOffsetX = s.dx + 10000; x.shadowOffsetY = s.dy; x.drawImage(src, pad - 10000, pad); x.restore(); }
    if (fx.glow && fx.glow.on) { const g = fx.glow; x.save(); x.shadowColor = hexA(g.color, g.opacity); x.shadowBlur = g.size; x.shadowOffsetX = 10000; for (let i = 0; i < 2; i++) x.drawImage(src, pad - 10000, pad); x.restore(); }
    if (fx.stroke && fx.stroke.on) { const s = fx.stroke; const w = Math.max(1, Math.round(s.width)); const dl = dilate(src, w); const t = cv(dl.width, dl.height); const tx = t.getContext('2d'); tx.drawImage(dl, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = s.color; tx.fillRect(0, 0, t.width, t.height); x.globalAlpha = s.opacity; x.drawImage(t, pad - w, pad - w); x.globalAlpha = 1; }
    x.drawImage(src, pad, pad);
    if (fx.overlay && fx.overlay.on) { const t = cv(src.width, src.height); const tx = t.getContext('2d'); tx.drawImage(src, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = fx.overlay.color; tx.fillRect(0, 0, t.width, t.height); x.globalAlpha = fx.overlay.opacity; x.drawImage(t, pad, pad); x.globalAlpha = 1; }
    c._pad = pad; l._fxKey = key; l._fxC = c; return c;
  }
  const hexA = (hex, a) => { const n = parseInt((hex || '#000000').slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a == null ? 1 : a})`; };
  I.hasFx = (l) => l.fx && ['shadow', 'glow', 'stroke', 'overlay'].some(k => l.fx[k] && l.fx[k].on);

  /* ---------- composición ---------- */
  let tmpA = null, tmpB = null;
  const tmp = (w, h, which) => { let t = which ? tmpB : tmpA; if (!t || t.width !== w || t.height !== h) { t = cv(w, h); if (which) tmpB = t; else tmpA = t; } const x = t.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h); return t; };
  /** Fuente visible de una capa (con máscara aplicada). overrides: {canvas} para previsualizaciones en vivo */
  I.layerSource = function (l, ov) {
    let src = (ov && ov.canvas) || l.canvas;
    if (l.mask && l.maskOn) { const t = cv(src.width, src.height); const x = t.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(I.maskAlpha(l), 0, 0); src = t; }
    if (I.hasFx(l)) { const f = fxCanvas(l, src); return { c: f, dx: -f._pad, dy: -f._pad }; }
    return { c: src, dx: 0, dy: 0 };
  };
  /** Compone una lista de capas en un contexto (w×h) */
  I.compose = function (d, list, x, opts) {
    opts = opts || {};
    for (const l of list) {
      if (!l.visible) continue;
      if (opts.stopAt && l.id === opts.stopAt) return true;
      if (l.type === 'group') {
        const g = cv(d.w, d.h); const stop = I.compose(d, l.children, g.getContext('2d'), opts);
        let src = g; if (l.mask && l.maskOn) { const gx = g.getContext('2d'); gx.globalCompositeOperation = 'destination-in'; gx.drawImage(I.maskAlpha(l), l.x, l.y); }
        x.globalAlpha = l.opacity; x.globalCompositeOperation = l.blend; x.drawImage(src, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        if (stop) return true; continue;
      }
      if (l.type === 'adjust') {
        const c = x.canvas; const id = x.getImageData(0, 0, c.width, c.height);
        const out = window.IMGF.applyAdjust(id, l.adj); const t = cv(c.width, c.height); t.getContext('2d').putImageData(out, 0, 0);
        if (l.mask && l.maskOn) { const tx = t.getContext('2d'); tx.globalCompositeOperation = 'destination-in'; tx.drawImage(I.maskAlpha(l), l.x, l.y); }
        x.globalAlpha = l.opacity; x.globalCompositeOperation = 'source-over'; x.drawImage(t, 0, 0); x.globalAlpha = 1; continue;
      }
      const ov = opts.override && opts.override.id === l.id ? opts.override : null;
      if (ov && ov.draw) { ov.draw(x, l); continue; }
      const s = I.layerSource(l, ov);
      x.globalAlpha = l.opacity; x.globalCompositeOperation = l.blend;
      x.drawImage(s.c, l.x + s.dx, l.y + s.dy);
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
    return false;
  };
  I.composite = function (d, target, opts) {
    const c = target && target.width === d.w && target.height === d.h ? target : cv(d.w, d.h); const x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height);
    I.compose(d, d.layers, x, opts); return c;
  };
  I.flatten = function (d, bg) { const c = I.composite(d); if (!bg) return c; const o = cv(d.w, d.h); const x = o.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, o.width, o.height); x.drawImage(c, 0, 0); return o; };
  /** Renderiza una capa individual (con máscara/efectos) a lienzo del documento */
  I.renderLayerDoc = function (d, l) { const c = cv(d.w, d.h); I.compose(d, [Object.assign({}, l, { visible: true, opacity: 1, blend: 'source-over' })], c.getContext('2d')); return c; };

  /* ---------- texto ---------- */
  I.renderText = function (l) {
    const t = l.text; const lines = String(t.text || '').split('\n'); const fs = t.size;
    const font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${fs}px ${t.font}`;
    const m = cv(1, 1).getContext('2d'); m.font = font; if ('letterSpacing' in m) m.letterSpacing = (t.spacing || 0) + 'px';
    const lh = fs * (t.lineHeight || 1.2); const widths = lines.map(s => m.measureText(s).width); const W = Math.max(1, ...widths);
    const sw = t.strokeOn ? t.strokeWidth : 0; const pad = Math.ceil(sw + fs * .25);
    const c = cv(W + 2 * pad, lh * lines.length + 2 * pad); const x = c.getContext('2d');
    x.font = font; if ('letterSpacing' in x) x.letterSpacing = (t.spacing || 0) + 'px'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
    const asc = fs * .8 + (lh - fs) / 2 + fs * .05;
    lines.forEach((s, i) => {
      const dx = t.align === 'center' ? (W - widths[i]) / 2 : t.align === 'right' ? W - widths[i] : 0; const yy = pad + i * lh + asc;
      if (sw) { x.strokeStyle = t.strokeColor; x.lineWidth = sw * 2; x.strokeText(s, pad + dx, yy); }
      x.fillStyle = t.color; x.fillText(s, pad + dx, yy);
      if (t.underline) { x.fillRect(pad + dx, yy + fs * .1, widths[i], Math.max(1, fs / 15)); }
    });
    l.canvas = c; l._pad = pad; l.ver = (l.ver || 0) + 1; return c;
  };

  /* ---------- selección ---------- */
  I.selChanged = function (d) { d.selVer = (d.selVer || 0) + 1; d._selPath = null; d._selBounds = undefined; };
  I.setSel = function (d, mask) { d.sel = mask; I.selChanged(d); };
  I.selBounds = function (d) {
    if (!d.sel) return null; if (d._selBounds !== undefined) return d._selBounds;
    const w = d.w, h = d.h; const a = d.sel.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) { const row = y * w; for (let x = 0; x < w; x++) if (a[(row + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
    d._selBounds = x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; return d._selBounds;
  };
  /** Combina una forma nueva con la selección actual: mode new|add|sub|int */
  I.combineSel = function (d, shapeCanvas, mode) {
    if (mode === 'new' || !d.sel) { if (mode === 'sub') return; if (mode === 'int' && !d.sel) return I.setSel(d, shapeCanvas); return I.setSel(d, shapeCanvas); }
    const n = I.cloneCanvas(d.sel); const x = n.getContext('2d');
    x.globalCompositeOperation = mode === 'add' ? 'source-over' : mode === 'sub' ? 'destination-out' : 'destination-in'; x.drawImage(shapeCanvas, 0, 0);
    I.setSel(d, n); if (!I.selBounds(d)) I.setSel(d, null);
  };
  I.shapeMask = function (d, fn) { const c = cv(d.w, d.h); const x = c.getContext('2d'); x.fillStyle = '#000'; fn(x); return c; };
  /** Trayectoria de hormigas: segmentos de borde en coordenadas de documento */
  I.selPath = function (d) {
    if (!d.sel) return null; if (d._selPath) return d._selPath;
    const b = I.selBounds(d); if (!b) return null;
    const w = d.w; const a = d.sel.getContext('2d', { willReadFrequently: true }).getImageData(b.x, b.y, b.w, b.h).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < b.w && y < b.h && a[(y * b.w + x) * 4 + 3] >= 128;
    const p = new Path2D(); let n = 0;
    for (let y = 0; y <= b.h; y++) { let run = -1; for (let x = 0; x <= b.w; x++) { const e = x < b.w && on(x, y) !== on(x, y - 1); if (e && run < 0) run = x; if (!e && run >= 0) { p.moveTo(b.x + run, b.y + y); p.lineTo(b.x + x, b.y + y); run = -1; n++; } } }
    for (let x = 0; x <= b.w; x++) { let run = -1; for (let y = 0; y <= b.h; y++) { const e = y < b.h && on(x, y) !== on(x - 1, y); if (e && run < 0) run = y; if (!e && run >= 0) { p.moveTo(b.x + x, b.y + run); p.lineTo(b.x + x, b.y + y); run = -1; n++; } } }
    d._selPath = p; return p;
  };
  /** Relleno por inundación: devuelve máscara (Uint8Array) de píxeles similares */
  I.floodMask = function (img, w, h, sx, sy, tol, contiguous, alphaToo) {
    const d = img.data; const out = new Uint8Array(w * h); sx = Math.floor(sx); sy = Math.floor(sy); if (sx < 0 || sy < 0 || sx >= w || sy >= h) return out;
    const i0 = (sy * w + sx) * 4; const r0 = d[i0], g0 = d[i0 + 1], b0 = d[i0 + 2], a0 = d[i0 + 3]; const t = tol * tol * 4;
    const ok = (i) => { const k = i * 4; const dr = d[k] - r0, dg = d[k + 1] - g0, db = d[k + 2] - b0, da = d[k + 3] - a0; return dr * dr + dg * dg + db * db + da * da * 1.5 <= t; };
    if (!contiguous) { for (let i = 0; i < w * h; i++) if (ok(i)) out[i] = 255; return out; }
    const stack = new Int32Array(w * h); let sp = 0; stack[sp++] = sy * w + sx; out[sy * w + sx] = 255;
    while (sp) { const i = stack[--sp]; const x = i % w, y = (i / w) | 0;
      if (x > 0 && !out[i - 1] && ok(i - 1)) { out[i - 1] = 255; stack[sp++] = i - 1; }
      if (x < w - 1 && !out[i + 1] && ok(i + 1)) { out[i + 1] = 255; stack[sp++] = i + 1; }
      if (y > 0 && !out[i - w] && ok(i - w)) { out[i - w] = 255; stack[sp++] = i - w; }
      if (y < h - 1 && !out[i + w] && ok(i + w)) { out[i + w] = 255; stack[sp++] = i + w; } }
    return out;
  };
  I.maskToCanvas = function (m, w, h, aa) {
    const c = cv(w, h); const x = c.getContext('2d'); const id = x.createImageData(w, h); const d = id.data;
    for (let i = 0; i < m.length; i++) d[i * 4 + 3] = m[i];
    x.putImageData(id, 0, 0); return c;
  };
  I.alphaArray = (c) => { const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data; const a = new Uint8Array(c.width * c.height); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3]; return a; };
  /** Filtro máx/mín separable (dilatar/erosionar) */
  I.morph = function (a, w, h, r, max) {
    const tmpA = new Uint8Array(a.length), out = new Uint8Array(a.length); const f = max ? Math.max : Math.min;
    const pass = (src, dst, len, n, idx) => { for (let j = 0; j < n; j++) { for (let i = 0; i < len; i++) { let v = src[idx(j, i)]; for (let k = Math.max(0, i - r); k <= Math.min(len - 1, i + r); k++) v = f(v, src[idx(j, k)]); dst[idx(j, i)] = v; } } };
    if (r > 6) { // aproximación rápida por pasos
      let cur = a; for (let s = 0; s < r; s += 3) { const step = Math.min(3, r - s); const o = I.morph(cur, w, h, step, max); cur = o; } return cur;
    }
    pass(a, tmpA, w, h, (j, i) => j * w + i); pass(tmpA, out, h, w, (j, i) => i * w + j); return out;
  };
  I.blurAlpha = function (c, r) { const id = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height); window.IMGF.stackBlur(id, Math.round(r), true); const n = cv(c.width, c.height); n.getContext('2d').putImageData(id, 0, 0); return n; };

  /* ---------- utilidades de capa ---------- */
  /** Garantiza que el lienzo de la capa cubra el documento (para pintar fuera de sus límites) */
  I.ensureCovers = function (d, l) {
    if (l.type !== 'raster') return;
    const x0 = Math.min(0, l.x), y0 = Math.min(0, l.y), x1 = Math.max(d.w, l.x + l.canvas.width), y1 = Math.max(d.h, l.y + l.canvas.height);
    if (x0 === l.x && y0 === l.y && x1 - x0 === l.canvas.width && y1 - y0 === l.canvas.height) return;
    if ((x1 - x0) * (y1 - y0) > FP.LIMITS.maxPixels / 2) return;
    const c = cv(x1 - x0, y1 - y0); c.getContext('2d').drawImage(l.canvas, l.x - x0, l.y - y0);
    if (l.mask) { const m = cv(c.width, c.height); const mx = m.getContext('2d'); mx.fillStyle = '#fff'; mx.fillRect(0, 0, m.width, m.height); mx.drawImage(l.mask, l.x - x0, l.y - y0); m._ver = (l.mask._ver || 0) + 1; l.mask = m; }
    l.canvas = c; l.x = x0; l.y = y0;
  };
  /** Selección en coordenadas locales de la capa */
  I.selLocal = function (d, l) { if (!d.sel) return null; const c = cv(l.canvas.width, l.canvas.height); c.getContext('2d').drawImage(d.sel, -l.x, -l.y); return c; };
  /** Aplica una función de píxeles a la capa respetando la selección */
  I.applyPixels = function (d, l, fn, label, onMask) {
    const target = onMask ? l.mask : l.canvas;
    I.edit(d, label, [l], { mask: onMask });
    const t = onMask ? l.mask : l.canvas; const x = t.getContext('2d', { willReadFrequently: true });
    const src = x.getImageData(0, 0, t.width, t.height); const res = fn(src) || src;
    const sl = I.selLocal(d, l);
    if (!sl) { x.putImageData(res, 0, 0); }
    else { const f = cv(t.width, t.height); const fx = f.getContext('2d'); fx.putImageData(res, 0, 0); fx.globalCompositeOperation = 'destination-in'; fx.drawImage(sl, 0, 0); x.globalCompositeOperation = 'destination-out'; x.drawImage(sl, 0, 0); x.globalCompositeOperation = 'source-over'; x.drawImage(f, 0, 0); }
    if (onMask) I.touchMask(l); l.ver++; d.ver++;
  };
  I.trimBounds = function (c) {
    const w = c.width, h = c.height; const a = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  };
  /** Reescalado de calidad (reducción por pasos) */
  I.resample = function (src, w, h, smooth) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h)); let cur = src, cw = src.width, ch = src.height;
    if (smooth === false) { const o = cv(w, h); const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, w, h); return o; }
    while (cw / 2 >= w && ch / 2 >= h) { cw = Math.round(cw / 2); ch = Math.round(ch / 2); const t = cv(cw, ch); const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, cw, ch); cur = t; }
    const o = cv(w, h); const x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, w, h); return o;
  };

  /* ---------- transformación proyectiva ---------- */
  /** Homografía que lleva el rectángulo (0,0,w,h) a quad [[x,y]×4] (tl,tr,br,bl) */
  I.homography = function (w, h, q) {
    const src = [[0, 0], [w, 0], [w, h], [0, h]]; const A = [], B = [];
    for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = q[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
    const n = 8; for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];[B[c], B[p]] = [B[p], B[c]]; for (let r = 0; r < n; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; } }
    const hm = B.map((b, i) => b / A[i][i]); return (x, y) => { const z = hm[6] * x + hm[7] * y + 1; return [(hm[0] * x + hm[1] * y + hm[2]) / z, (hm[3] * x + hm[4] * y + hm[5]) / z]; };
  };
  /** Homografía general entre 4 puntos origen y 4 destino */
  I.homog4 = function (src, dst) {
    const A = [], B = [];
    for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
    const n = 8; for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];[B[c], B[p]] = [B[p], B[c]]; for (let r = 0; r < n; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; } }
    return B.map((b, i) => b / A[i][i]);
  };
  /** Deformación proyectiva exacta por píxel (sin costuras). Devuelve lienzo W×H con origen en (x0,y0) */
  I.warpPixels = function (src, q, x0, y0, W, H) {
    const sw = src.width, sh = src.height; const m = I.homog4(q, [[0, 0], [sw, 0], [sw, sh], [0, sh]]);
    const sd = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, sw, sh).data;
    const out = cv(W, H); const ox = out.getContext('2d'); const id = ox.createImageData(W, H); const d = id.data;
    for (let y = 0; y < H; y++) { const py = y + y0 + .5; for (let x = 0; x < W; x++) { const px = x + x0 + .5; const z = m[6] * px + m[7] * py + 1; let u = (m[0] * px + m[1] * py + m[2]) / z - .5, v = (m[3] * px + m[4] * py + m[5]) / z - .5;
      if (u < -1 || v < -1 || u > sw || v > sh) continue; const x1 = Math.floor(u), y1 = Math.floor(v), fx = u - x1, fy = v - y1; const o = (y * W + x) * 4;
      for (let c = 0; c < 4; c++) { const g = (xx, yy) => (xx < 0 || yy < 0 || xx >= sw || yy >= sh) ? 0 : sd[(yy * sw + xx) * 4 + c]; const a = g(x1, y1) * (1 - fx) + g(x1 + 1, y1) * fx, b = g(x1, y1 + 1) * (1 - fx) + g(x1 + 1, y1 + 1) * fx; d[o + c] = a * (1 - fy) + b * fy; }
      // premultiplicación aproximada para bordes: si alfa interpolado, evitar halos oscuros
      if (d[o + 3] > 0 && d[o + 3] < 255) { let r = 0, g2 = 0, b2 = 0, wsum = 0; [[x1, y1, (1 - fx) * (1 - fy)], [x1 + 1, y1, fx * (1 - fy)], [x1, y1 + 1, (1 - fx) * fy], [x1 + 1, y1 + 1, fx * fy]].forEach(([xx, yy, w]) => { if (xx < 0 || yy < 0 || xx >= sw || yy >= sh) return; const k = (yy * sw + xx) * 4; const aw = w * sd[k + 3]; r += sd[k] * aw; g2 += sd[k + 1] * aw; b2 += sd[k + 2] * aw; wsum += aw; }); if (wsum) { d[o] = r / wsum; d[o + 1] = g2 / wsum; d[o + 2] = b2 / wsum; } }
    } }
    ox.putImageData(id, 0, 0); return out;
  };
  I.isParallelogram = (q) => Math.abs((q[1][0] - q[0][0]) - (q[2][0] - q[3][0])) < .01 && Math.abs((q[1][1] - q[0][1]) - (q[2][1] - q[3][1])) < .01;
  /** Dibuja src deformado al quad en ctx (malla de triángulos) */
  I.drawWarp = function (x, src, q, sub) {
    const w = src.width, h = src.height; const H = I.homography(w, h, q); sub = sub || 20;
    const isPar = Math.abs((q[1][0] - q[0][0]) - (q[2][0] - q[3][0])) < .01 && Math.abs((q[1][1] - q[0][1]) - (q[2][1] - q[3][1])) < .01;
    if (isPar) { x.save(); x.setTransform(x.getTransform().multiply(new DOMMatrix([(q[1][0] - q[0][0]) / w, (q[1][1] - q[0][1]) / w, (q[3][0] - q[0][0]) / h, (q[3][1] - q[0][1]) / h, q[0][0], q[0][1]]))); x.drawImage(src, 0, 0); x.restore(); return; }
    const tri = (s0, s1, s2, d0, d1, d2) => {
      x.save(); x.beginPath();
      const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3; const ex = (p) => [p[0] + (p[0] - cx) * .02 + Math.sign(p[0] - cx) * .3, p[1] + (p[1] - cy) * .02 + Math.sign(p[1] - cy) * .3];
      const e0 = ex(d0), e1 = ex(d1), e2 = ex(d2); x.moveTo(e0[0], e0[1]); x.lineTo(e1[0], e1[1]); x.lineTo(e2[0], e2[1]); x.closePath(); x.clip();
      const den = s0[0] * (s2[1] - s1[1]) - s1[0] * s2[1] + s2[0] * s1[1] + (s1[0] - s2[0]) * s0[1]; if (Math.abs(den) < 1e-9) { x.restore(); return; }
      const a = -(s0[1] * (d2[0] - d1[0]) - s1[1] * d2[0] + s2[1] * d1[0] + (s1[1] - s2[1]) * d0[0]) / den;
      const b = (s1[1] * d2[1] + s0[1] * (d1[1] - d2[1]) - s2[1] * d1[1] + (s2[1] - s1[1]) * d0[1]) / den;
      const c = (s0[0] * (d2[0] - d1[0]) - s1[0] * d2[0] + s2[0] * d1[0] + (s1[0] - s2[0]) * d0[0]) / den;
      const dd = -(s1[0] * d2[1] + s0[0] * (d1[1] - d2[1]) - s2[0] * d1[1] + (s2[0] - s1[0]) * d0[1]) / den;
      const e = (s0[0] * (s2[1] * d1[0] - s1[1] * d2[0]) + s0[1] * (s1[0] * d2[0] - s2[0] * d1[0]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[0]) / den;
      const f = (s0[0] * (s2[1] * d1[1] - s1[1] * d2[1]) + s0[1] * (s1[0] * d2[1] - s2[0] * d1[1]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[1]) / den;
      x.transform(a, b, c, dd, e, f); x.drawImage(src, 0, 0); x.restore();
    };
    for (let j = 0; j < sub; j++) for (let i = 0; i < sub; i++) {
      const u0 = i / sub * w, u1 = (i + 1) / sub * w, v0 = j / sub * h, v1 = (j + 1) / sub * h;
      const p00 = H(u0, v0), p10 = H(u1, v0), p11 = H(u1, v1), p01 = H(u0, v1);
      tri([u0, v0], [u1, v0], [u1, v1], p00, p10, p11); tri([u0, v0], [u1, v1], [u0, v1], p00, p11, p01);
    }
  };

  /* ---------- inpainting por ejemplos (relleno según contenido) ---------- */
  I.inpaint = async function (c, maskArr, prog) {
    const w = c.width, h = c.height; const x = c.getContext('2d', { willReadFrequently: true }); const img = x.getImageData(0, 0, w, h); const d = img.data;
    const known = new Uint8Array(w * h); let todo = 0; for (let i = 0; i < w * h; i++) { known[i] = maskArr[i] > 127 ? 0 : 1; if (!known[i]) todo++; }
    if (!todo) return; const total = todo;
    let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let i = 0; i < w * h; i++) if (!known[i]) { const xx = i % w, yy = (i / w) | 0; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    const P = Math.max(3, Math.min(6, Math.round(Math.sqrt(total) / 12))); const R = Math.max(30, Math.round(Math.max(x1 - x0, y1 - y0) * 1.2));
    const sx0 = Math.max(P, x0 - R), sy0 = Math.max(P, y0 - R), sx1 = Math.min(w - P - 1, x1 + R), sy1 = Math.min(h - P - 1, y1 + R);
    // tabla integral de desconocidos para descartar parches incompletos
    const integ = () => { const I2 = new Int32Array((w + 1) * (h + 1)); for (let yy = 0; yy < h; yy++) { let s = 0; for (let xx = 0; xx < w; xx++) { s += known[yy * w + xx] ? 0 : 1; I2[(yy + 1) * (w + 1) + xx + 1] = I2[yy * (w + 1) + xx + 1] + s; } } return I2; };
    const unk0 = integ(); const fullKnown = (cx, cy) => { const a = cx - P, b = cy - P, e = cx + P + 1, f = cy + P + 1; return unk0[f * (w + 1) + e] - unk0[b * (w + 1) + e] - unk0[f * (w + 1) + a] + unk0[b * (w + 1) + a] === 0; };
    const cands = []; const stride = Math.max(1, Math.round(Math.sqrt((sx1 - sx0) * (sy1 - sy0) / 6000)));
    for (let yy = sy0; yy <= sy1; yy += stride) for (let xx = sx0; xx <= sx1; xx += stride) if (fullKnown(xx, yy)) cands.push(yy * w + xx);
    if (!cands.length) { // sin parches: difusión
      for (let it = 0; it < 300; it++) for (let i = 0; i < w * h; i++) if (!known[i]) { let r = 0, g = 0, b = 0, n = 0; const xx = i % w, yy = (i / w) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, ay]) => { const X = xx + ax, Y = yy + ay; if (X < 0 || Y < 0 || X >= w || Y >= h) return; const k = (Y * w + X) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; }); if (n) { d[i * 4] = r / n; d[i * 4 + 1] = g / n; d[i * 4 + 2] = b / n; d[i * 4 + 3] = 255; } if (it === 299) known[i] = 1; }
      x.putImageData(img, 0, 0); return;
    }
    let iter = 0;
    while (todo > 0) {
      // frente: desconocidos con más vecinos conocidos
      let best = -1, bestScore = -1;
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { const i = yy * w + xx; if (known[i]) continue; let n = 0; for (let ay = -1; ay <= 1; ay++) for (let ax = -1; ax <= 1; ax++) { const X = xx + ax, Y = yy + ay; if (X >= 0 && Y >= 0 && X < w && Y < h && known[Y * w + X]) n++; } if (n > bestScore) { bestScore = n; best = i; if (n >= 6) break; } }
      if (best < 0) break; const bx = best % w, by = (best / w) | 0;
      let bc = cands[0], bs = Infinity;
      for (let k = 0; k < cands.length; k++) {
        const ci = cands[k]; const cx = ci % w, cy = (ci / w) | 0; let s = 0, n = 0;
        for (let ay = -P; ay <= P; ay++) { const Y = by + ay; if (Y < 0 || Y >= h) continue; for (let ax = -P; ax <= P; ax++) { const X = bx + ax; if (X < 0 || X >= w) continue; const ti = Y * w + X; if (!known[ti]) continue; const si = ((cy + ay) * w + cx + ax) * 4, tj = ti * 4; const dr = d[si] - d[tj], dg = d[si + 1] - d[tj + 1], db = d[si + 2] - d[tj + 2]; s += dr * dr + dg * dg + db * db; n++; } }
        if (n && s / n < bs) { bs = s / n; bc = ci; if (s === 0) break; }
      }
      const cx = bc % w, cy = (bc / w) | 0;
      for (let ay = -P; ay <= P; ay++) { const Y = by + ay; if (Y < 0 || Y >= h) continue; for (let ax = -P; ax <= P; ax++) { const X = bx + ax; if (X < 0 || X >= w) continue; const ti = Y * w + X; if (known[ti]) continue; const si = ((cy + ay) * w + cx + ax) * 4, tj = ti * 4; d[tj] = d[si]; d[tj + 1] = d[si + 1]; d[tj + 2] = d[si + 2]; d[tj + 3] = d[si + 3]; known[ti] = 1; todo--; } }
      if (++iter % 40 === 0) { if (prog) { prog.set(1 - todo / total, 'Rellenando según contenido…'); if (prog.cancelled) break; } await new Promise(r => setTimeout(r, 0)); }
    }
    x.putImageData(img, 0, 0);
  };
})();
