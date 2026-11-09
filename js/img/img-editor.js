/* FOTOPEA · Editor de imágenes: interfaz, vista, capas y herramientas */
(function () {
  'use strict';
  const { h, icon } = FP; const I = window.IMGC; const F = window.IMGF;
  const IE = window.IMGE = { d: null, tool: 'move', fg: '#000000', bg: '#ffffff', view: { z: 1, x: 0, y: 0 }, el: {}, selMode: 'new', fonts: [], mouse: null };
  const el = IE.el;
  IE.O = {
    brush: { size: 24, hardness: .8, opacity: 1, flow: 1 }, pencil: { size: 2, opacity: 1 }, eraser: { size: 40, hardness: .6, opacity: 1, flow: 1 },
    clone: { size: 40, hardness: .5, opacity: 1, sampleAll: false }, heal: { size: 30, hardness: .5 }, spot: { size: 30 },
    blurb: { size: 40, strength: .5 }, sharpenb: { size: 40, strength: .3 }, smudge: { size: 30, strength: .6 },
    bucket: { tolerance: 32, contiguous: true, sampleAll: false, opacity: 1 }, gradient: { type: 'linear', mode: 'fgbg', opacity: 1 },
    wand: { tolerance: 32, contiguous: true, sampleAll: false }, marquee: { feather: 0, ratio: '' }, lasso: { feather: 0 }, objsel: { tolerance: 40 },
    text: { font: 'Arial', size: 48, bold: false, italic: false, underline: false, align: 'left', lineHeight: 1.2, spacing: 0, strokeOn: false, strokeColor: '#ffffff', strokeWidth: 2 },
    shape: { kind: 'rect', fill: true, stroke: false, sw: 4, radius: 16, sides: 6 }, crop: { preset: 'free' }, move: { auto: false },
  };
  IE.FONTS = ['Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Segoe UI', 'Georgia', 'Times New Roman', 'Garamond', 'Palatino Linotype', 'Courier New', 'Lucida Console', 'Impact', 'Comic Sans MS', 'Brush Script MT', 'system-ui', 'serif', 'sans-serif', 'monospace', 'cursive'];
  IE.CROP_PRESETS = [['free', 'Libre'], ['1:1', '1:1'], ['4:3', '4:3'], ['3:2', '3:2'], ['16:9', '16:9'], ['9:16', '9:16'], ['4:5', '4:5'], ['ig-post', 'Instagram publicación 1080×1080', 1080, 1080], ['ig-portrait', 'Instagram vertical 1080×1350', 1080, 1350], ['ig-story', 'Instagram/TikTok historia 1080×1920', 1080, 1920], ['yt-thumb', 'YouTube miniatura 1280×720', 1280, 720], ['x-post', 'X/Twitter imagen 1600×900', 1600, 900], ['fb-cover', 'Facebook portada 820×312', 820, 312], ['fb-post', 'Facebook publicación 1200×630', 1200, 630], ['li-banner', 'LinkedIn banner 1584×396', 1584, 396], ['wa-profile', 'Perfil (WhatsApp, etc.) 640×640', 640, 640]];

  /* ======================= Interfaz ======================= */
  const TOOLS = [
    ['move', 'move', 'Mover / transformar capa (Ctrl+T)', 'V'], ['marquee', 'marquee', 'Selección rectangular', 'M'], ['ellipse', 'ellipse', 'Selección elíptica', 'M'], ['lasso', 'lasso', 'Lazo', 'L'], ['polylasso', 'polylasso', 'Lazo poligonal', 'L'], ['wand', 'wand', 'Varita mágica', 'W'], ['objsel', 'wand2', 'Selección de objetos (rectángulo alrededor)', 'W'], ['crop', 'crop', 'Recortar (incluye formatos de redes sociales)', 'C'], ['eyedropper', 'dropper', 'Cuentagotas', 'I'], '-',
    ['spot', 'heal', 'Pincel corrector puntual / eliminar objetos', 'J'], ['heal', 'heal', 'Pincel corrector (Alt+clic: origen)', 'J'], ['clone', 'stamp', 'Tampón de clonar (Alt+clic: origen)', 'S'], ['brush', 'brush', 'Pincel', 'B'], ['pencil', 'pencil', 'Lápiz', 'B'], ['eraser', 'eraser', 'Borrador', 'E'], ['bucket', 'bucket', 'Bote de pintura', 'G'], ['gradient', 'gradient', 'Degradado', 'G'], ['blurb', 'blur', 'Desenfocar (pincel)', 'R'], ['sharpenb', 'sharpen', 'Enfocar (pincel)', 'R'], ['smudge', 'smudge', 'Dedo (difuminar)', 'R'], '-',
    ['text', 'text', 'Texto', 'T'], ['shape', 'shapes', 'Formas: rectángulo, elipse, línea, flecha, polígono, estrella', 'U'], ['hand', 'hand', 'Mano', 'H'], ['zoom', 'zoomin', 'Zoom (Alt: alejar)', 'Z'],
  ];
  function build(root) {
    root.innerHTML = ''; el.root = root;
    el.menubar = h('div', { class: 'menubar' }, h('div', { class: 'logo', 'data-tip': 'Volver al inicio', onclick: () => FP.goHome() }, h('div', { class: 'mark' }, 'F'), 'FOTOPEA'));
    FP.menubar(el.menubar, IE.menus());
    el.docname = h('div', { class: 'docname' });
    el.undoB = h('button', { class: 'ibtn', 'data-tip': 'Deshacer', 'data-key': 'Ctrl+Z', onclick: () => IE.undo() }, icon('undo'));
    el.redoB = h('button', { class: 'ibtn', 'data-tip': 'Rehacer', 'data-key': 'Ctrl+Y', onclick: () => IE.redo() }, icon('redo'));
    el.menubar.append(h('div', { class: 'sp' }), el.docname, el.undoB, el.redoB,
      h('button', { class: 'btn sm', style: { marginLeft: '6px' }, onclick: () => IE.saveProject() }, icon('save', 's'), 'Proyecto'),
      h('button', { class: 'btn sm pri', style: { marginLeft: '6px' }, onclick: () => IE.exportDialog() }, icon('download', 's'), 'Exportar'),
      h('button', { class: 'ibtn', 'data-tip': 'Tema claro/oscuro', onclick: () => { FP.toggleTheme(); IE.render(); } }, icon('sun')));
    el.optbar = h('div', { class: 'optbar' });
    el.toolbar = h('div', { class: 'toolbar' });
    TOOLS.forEach(t => { if (t === '-') return el.toolbar.appendChild(h('div', { class: 'tsep' })); el.toolbar.appendChild(h('button', { class: 'ibtn', 'data-tool': t[0], 'data-tip': t[2], 'data-key': t[3], onclick: () => IE.setTool(t[0]) }, icon(t[1]))); });
    el.fgIn = h('input', { type: 'color', style: { display: 'none' }, oninput: (e) => { IE.fg = e.target.value; drawColors(); } });
    el.bgIn = h('input', { type: 'color', style: { display: 'none' }, oninput: (e) => { IE.bg = e.target.value; drawColors(); } });
    el.fgSw = h('div', { class: 'fg', 'data-tip': 'Color frontal', onclick: () => { el.fgIn.value = IE.fg; el.fgIn.click(); } });
    el.bgSw = h('div', { class: 'bgc', 'data-tip': 'Color de fondo', onclick: () => { el.bgIn.value = IE.bg; el.bgIn.click(); } });
    el.toolbar.append(h('div', { class: 'colors' }, el.fgSw, el.bgSw, h('div', { class: 'sw', 'data-tip': 'Intercambiar (X)', onclick: swapColors }, '⇄')), el.fgIn, el.bgIn, h('button', { class: 'ibtn', style: { width: '30px', height: '22px', fontSize: '10px' }, 'data-tip': 'Colores por defecto (D)', onclick: () => { IE.fg = '#000000'; IE.bg = '#ffffff'; drawColors(); } }, 'B/N'));
    el.work = h('div', { class: 'work' }); el.stage = h('div', { class: 'stage' }); el.view = h('canvas', { class: 'view' }); el.stage.appendChild(el.view); el.work.appendChild(el.stage);
    el.right = h('div', { class: 'side' }); FP.makeResizable(el.right, 'imgright', 220, 460);
    el.status = h('div', { class: 'statusbar' });
    root.append(el.menubar, el.optbar, h('div', { class: 'edbody' }, el.toolbar, el.work, el.right), el.status);
    buildRight(); drawColors(); attachStage();
    new ResizeObserver(() => { if (IE.d) IE.render(); }).observe(el.stage);
    renderEmpty();
  }
  function renderEmpty() {
    el.stage.style.display = 'none'; let em = FP.$('.img-empty', el.work);
    if (!em) { em = h('div', { class: 'drop img-empty', style: { margin: '60px auto', maxWidth: '560px' } }, icon('image'), h('h3', null, 'Abre una imagen o crea un lienzo'), h('div', { class: 'muted' }, 'JPG, PNG, WEBP, GIF, BMP, TIFF, SVG o proyectos .fotopea'), h('div', { style: { marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' } }, h('button', { class: 'btn pri', onclick: () => IE.openDialog() }, icon('folder', 's'), 'Abrir imagen'), h('button', { class: 'btn', onclick: () => IE.newDocDialog() }, icon('plus', 's'), 'Lienzo nuevo'), h('button', { class: 'btn', onclick: () => IE.collageDialog() }, icon('collage', 's'), 'Collage'))); el.work.appendChild(em); }
    em.style.display = ''; el.optbar.innerHTML = ''; el.status.textContent = 'Sin documento'; el.docname.textContent = '';
    FP.$$('[data-tool]', el.toolbar).forEach(b => b.disabled = true); renderLayers(); renderHistory();
  }
  IE.renderEmpty = () => renderEmpty();
  function drawColors() { el.fgSw.style.background = IE.fg; el.bgSw.style.background = IE.bg; }
  function swapColors() { [IE.fg, IE.bg] = [IE.bg, IE.fg]; drawColors(); }
  IE.setFg = (c) => { IE.fg = c; drawColors(); };

  function buildRight() {
    el.right.innerHTML = '';
    // navegador/colores
    el.swatches = h('div', { class: 'swatches' }); ['#000000', '#ffffff', '#7f7f7f', '#c3c3c3', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#6d4c41', '#ff6b3d', '#ffb347', '#00acc1', '#3949ab', '#d81b60', '#c0ca33', '#00897b', '#5e35b1', '#263238'].forEach(c => el.swatches.appendChild(h('div', { style: { background: c }, 'data-tip': c + ' (Alt: fondo)', onclick: (e) => { if (e.altKey) IE.bg = c; else IE.fg = c; drawColors(); } })));
    el.hist = h('div', { class: 'pnl-b list-b hist' });
    el.histPnl = h('div', { class: 'pnl', style: { height: '170px', flex: 'none' } }, h('div', { class: 'pnl-h' }, icon('history', 's'), 'Historial'), el.hist);
    el.layers = h('div', { class: 'pnl-b layers' });
    el.lyopts = h('div', { class: 'lyopts' });
    el.lyfoot = h('div', { class: 'lyfoot' },
      h('button', { class: 'ibtn', 'data-tip': 'Estilo de capa (sombra, resplandor, trazo)', onclick: () => IE.layerStyleDialog() }, icon('fx')),
      h('button', { class: 'ibtn', 'data-tip': 'Añadir máscara de capa', onclick: () => IE.maskOp('reveal') }, icon('mask')),
      h('button', { class: 'ibtn', 'data-tip': 'Nueva capa de ajuste', onclick: (e) => { const r = e.currentTarget.getBoundingClientRect(); FP.menu({ x: r.left, y: r.top - 360 }, IE.adjLayerMenu()); } }, icon('adjust')),
      h('button', { class: 'ibtn', 'data-tip': 'Nuevo grupo', onclick: () => IE.groupLayers() }, icon('folderl')),
      h('button', { class: 'ibtn', 'data-tip': 'Nueva capa', 'data-key': 'Ctrl+Mayús+N', onclick: () => IE.newLayer() }, icon('plus')),
      h('button', { class: 'ibtn', 'data-tip': 'Duplicar capa', 'data-key': 'Ctrl+J', onclick: () => IE.duplicateLayer() }, icon('copy')),
      h('button', { class: 'ibtn', 'data-tip': 'Eliminar capa', onclick: () => IE.deleteLayer() }, icon('trash')));
    el.lyPnl = h('div', { class: 'pnl', style: { flex: 1 } }, h('div', { class: 'pnl-h' }, icon('layers', 's'), 'Capas'), el.lyopts, el.layers, el.lyfoot);
    el.right.append(h('div', { class: 'pnl', style: { flex: 'none' } }, h('div', { class: 'pnl-h' }, icon('color', 's'), 'Muestras'), el.swatches), el.histPnl, el.lyPnl);
  }

  /* ======================= Documento ======================= */
  IE.setDoc = function (d) {
    IE.d = d; I.resetHistory(); IE.cancelAll(); el.stage.style.display = ''; const em = FP.$('.img-empty', el.work); if (em) em.style.display = 'none';
    FP.$$('[data-tool]', el.toolbar).forEach(b => b.disabled = false);
    IE.fit(); IE.dirtyComp(); renderLayers(); renderHistory(); renderOpt(); el.docname.textContent = d.name; FP.dirty.img = false; updateUndo();
  };
  I.onChange = function () { FP.dirty.img = true; IE.dirtyComp(); updateUndo(); renderHistorySoon(); scheduleAutosave(); };
  function updateUndo() { if (!el.undoB) return; el.undoB.disabled = !I.history.undo.length; el.redoB.disabled = !I.history.redo.length; }
  IE.undo = () => { if (!IE.d) return; IE.commitPending(); const l = I.undo(IE.d); if (l) { FP.toast('Deshecho: ' + l); IE.after(); } };
  IE.redo = () => { if (!IE.d) return; const l = I.redo(IE.d); if (l) { FP.toast('Rehecho: ' + l); IE.after(); } };
  IE.after = () => { FP.dirty.img = true; IE.dirtyComp(); renderLayers(); renderHistory(); updateUndo(); IE.render(); };
  IE.active = () => I.active(IE.d);
  IE.confirmDiscard = async () => !IE.d || !FP.dirty.img || FP.confirm('Hay cambios sin guardar en «' + IE.d.name + '». ¿Descartarlos?', 'Cambios sin guardar', 'Descartar', true);

  /* ======================= Vista ======================= */
  let comp = null, compDirty = true, raf = 0;
  IE.dirtyComp = () => { compDirty = true; IE.render(); };
  IE.render = () => { if (!raf) raf = requestAnimationFrame(draw); };
  IE.fit = function () { const d = IE.d; if (!d) return; const sw = el.stage.clientWidth || 800, sh = el.stage.clientHeight || 600; const z = Math.min((sw - 40) / d.w, (sh - 40) / d.h); IE.view.z = Math.max(.01, Math.min(z, 4)); IE.view.x = (sw - d.w * IE.view.z) / 2; IE.view.y = (sh - d.h * IE.view.z) / 2; IE.render(); updateStatus(); };
  IE.zoomTo = function (z, cx, cy) { const v = IE.view; z = FP.clamp(z, .01, 64); if (cx == null) { cx = el.stage.clientWidth / 2; cy = el.stage.clientHeight / 2; } const dx = (cx - v.x) / v.z, dy = (cy - v.y) / v.z; v.z = z; v.x = cx - dx * z; v.y = cy - dy * z; IE.render(); updateStatus(); };
  IE.toDoc = (e) => { const r = el.stage.getBoundingClientRect(); return { x: (e.clientX - r.left - IE.view.x) / IE.view.z, y: (e.clientY - r.top - IE.view.y) / IE.view.z }; };
  let checker = null;
  function draw() {
    raf = 0; const d = IE.d; if (!d) return; const c = el.view; const dpr = Math.min(2, devicePixelRatio || 1);
    const W = el.stage.clientWidth, H = el.stage.clientHeight; if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height);
    const v = IE.view;
    if (compDirty || IE.live) { comp = I.composite(d, comp, IE.live ? { override: IE.live } : null); compDirty = !!IE.live; }
    // tablero
    if (!checker) { const p = FP.canvas(16, 16); const px = p.getContext('2d'); px.fillStyle = '#fff'; px.fillRect(0, 0, 16, 16); px.fillStyle = '#d4d6da'; px.fillRect(0, 0, 8, 8); px.fillRect(8, 8, 8, 8); checker = x.createPattern(p, 'repeat'); }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = checker; x.fillRect(Math.round(v.x), Math.round(v.y), Math.round(d.w * v.z), Math.round(d.h * v.z));
    x.setTransform(dpr * v.z, 0, 0, dpr * v.z, dpr * v.x, dpr * v.y);
    x.imageSmoothingEnabled = v.z < 2; x.imageSmoothingQuality = 'high';
    x.drawImage(comp, 0, 0);
    if (IE.maskView) { const l = IE.active(); if (l && l.mask) { x.globalAlpha = .5; const t = FP.canvas(l.mask.width, l.mask.height); const tx = t.getContext('2d'); tx.fillStyle = '#ff0000'; tx.fillRect(0, 0, t.width, t.height); tx.globalCompositeOperation = 'destination-out'; tx.drawImage(I.maskAlpha(l), 0, 0); x.drawImage(t, l.x, l.y); x.globalAlpha = 1; } }
    if (IE.overlayCanvas) x.drawImage(IE.overlayCanvas, 0, 0);
    x.lineWidth = 1 / v.z; x.strokeStyle = 'rgba(0,0,0,.35)'; x.strokeRect(0, 0, d.w, d.h);
    // selección
    const sp = I.selPath(d);
    if (sp) { x.lineWidth = 1 / v.z; x.setLineDash([4 / v.z, 4 / v.z]); x.strokeStyle = '#fff'; x.lineDashOffset = antsOff / v.z; x.stroke(sp); x.strokeStyle = '#000'; x.lineDashOffset = (antsOff + 4) / v.z; x.stroke(sp); x.setLineDash([]); }
    if (IE.tools[IE.tool] && IE.tools[IE.tool].overlay) IE.tools[IE.tool].overlay(x, v);
    if (IE.T) drawTransform(x, v);
    // cursor de pincel
    const t = IE.O[IE.tool]; if (IE.mouse && t && t.size && !['text', 'shape'].includes(IE.tool)) { x.beginPath(); x.arc(IE.mouse.x, IE.mouse.y, Math.max(.5, t.size / 2), 0, Math.PI * 2); x.lineWidth = 1 / v.z; x.strokeStyle = 'rgba(255,255,255,.9)'; x.stroke(); x.beginPath(); x.arc(IE.mouse.x, IE.mouse.y, Math.max(.5, t.size / 2) + 1 / v.z, 0, Math.PI * 2); x.strokeStyle = 'rgba(0,0,0,.7)'; x.stroke(); }
    if (IE.cloneSrc && (IE.tool === 'clone' || IE.tool === 'heal')) { const s = IE.cloneSrc; const off = IE.cloneLive; const px = off ? IE.mouse.x + off.dx : s.x, py = off ? IE.mouse.y + off.dy : s.y; x.strokeStyle = '#ff6b3d'; x.lineWidth = 1.5 / v.z; x.beginPath(); x.moveTo(px - 8 / v.z, py); x.lineTo(px + 8 / v.z, py); x.moveTo(px, py - 8 / v.z); x.lineTo(px, py + 8 / v.z); x.stroke(); }
  }
  setInterval(() => { if (IE.d && IE.d.sel && FP.current === 'img' && !document.hidden) { antsOff = (antsOff + 1) % 8; IE.render(); } }, 250);
  let antsOff = 0;

  /* ======================= Entrada en el lienzo ======================= */
  const pointers = new Map(); let spaceDown = false, pinch = null;
  function attachStage() {
    const s = el.stage;
    s.addEventListener('pointerdown', (e) => {
      if (!IE.d || e.target.tagName === 'TEXTAREA') return; e.preventDefault(); if (document.activeElement && document.activeElement !== document.body && !el.stage.contains(document.activeElement)) document.activeElement.blur(); s.setPointerCapture(e.pointerId); pointers.set(e.pointerId, e);
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: IE.view.z, cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2, vx: IE.view.x, vy: IE.view.y }; IE.cancelStroke && IE.cancelStroke(); return; }
      if (e.button === 1 || spaceDown || IE.tool === 'hand') return pan(e);
      if (e.button === 2) return;
      if (IE.textEditing) { IE.commitText(); if (IE.tool === 'text') return; }
      const p = IE.toDoc(e);
      if (IE.T) return transformDown(e, p);
      const t = IE.tools[IE.tool]; if (t && t.down) { try { t.down(e, p); } catch (err) { FP.error(err, 'Herramienta'); } }
    });
    s.addEventListener('pointermove', (e) => {
      if (!IE.d) return; if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
      if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()]; const dd = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); const r = el.stage.getBoundingClientRect(); const z = FP.clamp(pinch.z * dd / pinch.d, .01, 64); const cx = pinch.cx - r.left, cy = pinch.cy - r.top; IE.view.x = cx - (cx - pinch.vx) * z / pinch.z + ((a.clientX + b.clientX) / 2 - pinch.cx); IE.view.y = cy - (cy - pinch.vy) * z / pinch.z + ((a.clientY + b.clientY) / 2 - pinch.cy); IE.view.z = z; IE.render(); return; }
      const p = IE.toDoc(e); IE.mouse = p; updateStatus(p);
      if (IE.T) { transformHover(e, p); IE.render(); return; }
      const t = IE.tools[IE.tool]; if (t && t.hover) t.hover(e, p); IE.render();
    });
    const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; };
    s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
    s.addEventListener('pointerleave', () => { IE.mouse = null; IE.render(); });
    s.addEventListener('wheel', (e) => { if (!IE.d) return; e.preventDefault(); const r = s.getBoundingClientRect(); const k = e.deltaMode ? 30 : 1;
      if (e.ctrlKey || e.metaKey || e.altKey) return IE.zoomTo(IE.view.z * Math.pow(1.002, -e.deltaY * k), e.clientX - r.left, e.clientY - r.top);
      if (e.shiftKey) { IE.view.x -= e.deltaY * k; IE.render(); return; }
      if (Math.abs(e.deltaX) > .5) { IE.view.x -= e.deltaX * k; IE.view.y -= e.deltaY * k; IE.render(); return; }
      IE.zoomTo(IE.view.z * Math.pow(1.0015, -e.deltaY * k), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    s.addEventListener('contextmenu', (e) => { e.preventDefault(); if (IE.d) stageMenu(e); });
    s.addEventListener('dblclick', (e) => { if (IE.tool === 'move' || IE.tool === 'text') { const l = IE.active(); if (l && l.type === 'text') { IE.setTool('text'); IE.editText(l); } } });
  }
  function pan(e) { const sx = e.clientX, sy = e.clientY, vx = IE.view.x, vy = IE.view.y; el.stage.style.cursor = 'grabbing'; const mv = (ev) => { IE.view.x = vx + ev.clientX - sx; IE.view.y = vy + ev.clientY - sy; IE.render(); }; const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); setCursor(); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); }
  /** Arrastre genérico en coordenadas de documento */
  function drag(e, onMove, onUp) { const mv = (ev) => onMove(IE.toDoc(ev), ev); const up = (ev) => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); onUp && onUp(IE.toDoc(ev), ev); IE.render(); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); }
  IE.drag = drag;
  function setCursor() { const c = { hand: 'grab', move: 'move', text: 'text', zoom: 'zoom-in', eyedropper: 'crosshair' }[IE.tool] || 'crosshair'; el.stage.style.cursor = IE.O[IE.tool] && IE.O[IE.tool].size ? 'none' : c; if (IE.tool === 'crop' || IE.tool === 'marquee' || IE.tool === 'ellipse' || IE.tool === 'lasso' || IE.tool === 'polylasso' || IE.tool === 'wand' || IE.tool === 'objsel' || IE.tool === 'shape' || IE.tool === 'gradient' || IE.tool === 'bucket') el.stage.style.cursor = 'crosshair'; }
  function stageMenu(e) {
    const l = IE.active();
    FP.menu({ x: e.clientX, y: e.clientY }, [
      IE.d.sel ? { label: 'Deseleccionar', key: 'Ctrl+D', action: () => IE.selectNone() } : { label: 'Seleccionar todo', key: 'Ctrl+A', action: () => IE.selectAll() },
      IE.d.sel ? { label: 'Invertir selección', action: () => IE.selInvert() } : null,
      IE.d.sel ? { label: 'Capa vía copiar', key: 'Ctrl+J', action: () => IE.layerViaCopy() } : null,
      IE.d.sel ? { label: 'Rellenar según contenido (eliminar)', icon: 'heal', action: () => IE.contentAwareFill() } : null,
      '-', { label: 'Transformación libre', icon: 'transform', key: 'Ctrl+T', disabled: !l || l.type === 'adjust', action: () => IE.startTransform() },
      { label: 'Duplicar capa', icon: 'copy', action: () => IE.duplicateLayer() }, { label: 'Pegar', key: 'Ctrl+V', action: () => IE.paste() },
      { label: 'Estilo de capa…', icon: 'fx', action: () => IE.layerStyleDialog() }]);
  }

  /* ======================= Herramientas ======================= */
  IE.tools = {};
  IE.setTool = function (t) {
    if (!IE.d) return; if (IE.T && t !== 'move') IE.commitTransform();
    if (IE.textEditing) IE.commitText();
    if (IE.tools[IE.tool] && IE.tools[IE.tool].leave) IE.tools[IE.tool].leave();
    IE.tool = t; FP.$$('[data-tool]', el.toolbar).forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    if (IE.tools[t] && IE.tools[t].enter) IE.tools[t].enter();
    setCursor(); renderOpt(); IE.render();
  };
  IE.cancelAll = () => { IE.T = null; IE.live = null; IE.preview = null; if (IE.textEditing) IE.cancelText(); if (IE.tools.crop) IE.tools.crop.st = null; IE.poly = null; };
  IE.commitPending = () => { if (IE.T) IE.commitTransform(); if (IE.textEditing) IE.commitText(); };
  const needRaster = (l, what) => {
    if (!l) { FP.toast('No hay capa activa', 'warn'); return false; }
    if (l.locked) { FP.toast('La capa está bloqueada', 'warn'); return false; }
    if (l.type === 'group' || l.type === 'adjust') { FP.toast('Selecciona una capa de píxeles para ' + (what || 'pintar'), 'warn'); return false; }
    if (l.type === 'text') { FP.toast('Es una capa de texto: rasterízala primero (Capa › Rasterizar)', 'warn'); return false; }
    return true;
  };
  IE.needRaster = needRaster;
  const selMode = (e) => e.shiftKey && e.altKey ? 'int' : e.shiftKey ? 'add' : e.altKey ? 'sub' : IE.selMode;

  /* ---- motor de pincel ---- */
  const tipCache = {};
  function brushTip(size, hardness, color) {
    const k = size + ':' + hardness + ':' + color; if (tipCache[k]) return tipCache[k];
    const s = Math.max(1, Math.ceil(size)); const c = FP.canvas(s, s); const x = c.getContext('2d'); const r = s / 2;
    if (hardness >= .99 || s <= 2) { x.fillStyle = color; x.beginPath(); x.arc(r, r, r, 0, Math.PI * 2); x.fill(); }
    else { const g = x.createRadialGradient(r, r, 0, r, r, r); const [R, G, B] = F.hexToRgb(color); g.addColorStop(0, `rgba(${R},${G},${B},1)`); g.addColorStop(Math.max(0.01, hardness), `rgba(${R},${G},${B},1)`); g.addColorStop(1, `rgba(${R},${G},${B},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s); }
    const keys = Object.keys(tipCache); if (keys.length > 30) delete tipCache[keys[0]];
    return (tipCache[k] = c);
  }
  function pencilTip(size, color) { const s = Math.max(1, Math.round(size)); const c = FP.canvas(s, s); const x = c.getContext('2d'); x.fillStyle = color; if (s <= 2) x.fillRect(0, 0, s, s); else { const id = x.createImageData(s, s); const [R, G, B] = F.hexToRgb(color); const r = s / 2; for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) if ((xx + .5 - r) ** 2 + (yy + .5 - r) ** 2 <= r * r) { const i = (yy * s + xx) * 4; id.data[i] = R; id.data[i + 1] = G; id.data[i + 2] = B; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); } return c; }
  /** Recorre un trazo interpolando estampados */
  function strokeWalker(spacing, stamp) { let last = null, acc = 0; return (p) => { if (!last) { stamp(p.x, p.y); last = p; return; } const dx = p.x - last.x, dy = p.y - last.y, dist = Math.hypot(dx, dy); let t = spacing - acc; while (t <= dist) { stamp(last.x + dx * t / dist, last.y + dy * t / dist); t += spacing; } acc = (acc + dist) % spacing; if (dist < spacing) acc = dist + (acc - dist); last = p; }; }
  /** Pincel / lápiz / borrador / clonado sobre lienzo de trazo con previsualización en vivo */
  function paintStroke(e, p, kind) {
    const d = IE.d; const l = IE.active(); const onMask = l && l.mask && IE.editMask;
    if (!onMask && !needRaster(l)) return;
    if (onMask && l.type === 'text') return FP.toast('Rasteriza la capa de texto primero', 'warn');
    const o = IE.O[kind]; if ((kind === 'clone' || kind === 'heal') && !IE.cloneSrc) { if (e.altKey) { IE.cloneSrc = { x: p.x, y: p.y }; FP.toast('Origen fijado'); return; } return FP.toast('Alt+clic para fijar el punto de origen', 'warn'); }
    if ((kind === 'clone' || kind === 'heal') && e.altKey) { IE.cloneSrc = { x: p.x, y: p.y }; FP.toast('Origen fijado'); return; }
    if (!onMask) I.ensureCovers(d, l);
    const target = onMask ? l.mask : l.canvas; const W = target.width, H = target.height; const ox = l.x, oy = l.y;
    const stroke = FP.canvas(W, H); const sx = stroke.getContext('2d');
    const col = onMask ? (kind === 'eraser' ? '#ffffff' : gray(IE.fg)) : IE.fg;
    const isErase = kind === 'eraser' && !onMask;
    const tip = kind === 'pencil' ? pencilTip(o.size, col) : brushTip(o.size, o.hardness != null ? o.hardness : .8, isErase ? '#000000' : col);
    let snapshot = null, off = null;
    if (kind === 'clone' || kind === 'heal') { snapshot = o.sampleAll ? I.composite(d) : I.renderLayerDoc(d, l); off = { dx: IE.cloneSrc.x - p.x, dy: IE.cloneSrc.y - p.y }; IE.cloneLive = off; }
    const sz = Math.max(1, o.size); const flow = o.flow != null ? o.flow : 1;
    const tmpT = FP.canvas(Math.ceil(sz), Math.ceil(sz)); const tt = tmpT.getContext('2d');
    const stamp = (x, y) => {
      const lx = x - ox, ly = y - oy;
      if (kind === 'clone' || kind === 'heal') {
        tt.globalCompositeOperation = 'source-over'; tt.clearRect(0, 0, tmpT.width, tmpT.height);
        tt.drawImage(snapshot, x + off.dx - sz / 2, y + off.dy - sz / 2, sz, sz, 0, 0, sz, sz);
        if (kind === 'heal') healPatch(tt, snapshot, x - sz / 2, y - sz / 2, x + off.dx - sz / 2, y + off.dy - sz / 2, sz);
        tt.globalCompositeOperation = 'destination-in'; tt.drawImage(tip, 0, 0, sz, sz);
        sx.drawImage(tmpT, lx - sz / 2, ly - sz / 2);
      } else { sx.globalAlpha = flow; if (kind === 'pencil') sx.drawImage(tip, Math.round(lx - tip.width / 2), Math.round(ly - tip.height / 2)); else sx.drawImage(tip, lx - sz / 2, ly - sz / 2, sz, sz); sx.globalAlpha = 1; }
    };
    const walk = strokeWalker(Math.max(1, sz * (kind === 'pencil' ? .25 : .12)), (x, y) => stampM(x, y));
    const selL = d.sel ? I.selLocal(d, l) : null;
    const live = FP.canvas(W, H); const lv = live.getContext('2d'); lv.drawImage(target, 0, 0);
    let dirty = null; const mark = (x, y) => { const r = sz / 2 + 2; if (!dirty) dirty = { x0: x - r, y0: y - r, x1: x + r, y1: y + r }; else { dirty.x0 = Math.min(dirty.x0, x - r); dirty.y0 = Math.min(dirty.y0, y - r); dirty.x1 = Math.max(dirty.x1, x + r); dirty.y1 = Math.max(dirty.y1, y + r); } };
    const stamp0 = stamp; const stampM = (x, y) => { stamp0(x, y); mark(x - ox, y - oy); };
    const build = (full) => {
      let rx = 0, ry = 0, rw = W, rh = H;
      if (!full) { if (!dirty) return; rx = Math.max(0, Math.floor(dirty.x0)); ry = Math.max(0, Math.floor(dirty.y0)); rw = Math.min(W, Math.ceil(dirty.x1)) - rx; rh = Math.min(H, Math.ceil(dirty.y1)) - ry; dirty = null; if (rw <= 0 || rh <= 0) return; }
      lv.save(); lv.beginPath(); lv.rect(rx, ry, rw, rh); lv.clip();
      lv.globalCompositeOperation = 'source-over'; lv.globalAlpha = 1; lv.clearRect(rx, ry, rw, rh); lv.drawImage(target, 0, 0);
      let s = stroke; if (selL) { const m = FP.canvas(rw, rh); const mx = m.getContext('2d'); mx.drawImage(stroke, -rx, -ry); mx.globalCompositeOperation = 'destination-in'; mx.drawImage(selL, -rx, -ry); s = m; }
      lv.globalAlpha = o.opacity != null ? o.opacity : 1; lv.globalCompositeOperation = isErase ? 'destination-out' : 'source-over'; if (selL) lv.drawImage(s, rx, ry); else lv.drawImage(s, 0, 0); lv.restore();
    };
    const setLive = () => { build(); if (onMask) { live._ver = Math.random(); IE.live = { id: l.id, draw: (x, L) => { const tmpL = Object.assign({}, L, { mask: live }); const s2 = I.layerSource(tmpL); x.globalAlpha = L.opacity; x.globalCompositeOperation = L.blend; x.drawImage(s2.c, L.x + s2.dx, L.y + s2.dy); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; } }; } else IE.live = { id: l.id, canvas: live }; IE.render(); };
    walk(p); setLive();
    drag(e, (q, ev) => { walk(q); IE.mouse = q; setLive(); }, () => {
      build(true); IE.live = null; IE.cloneLive = null;
      I.edit(d, { brush: 'Pincel', pencil: 'Lápiz', eraser: 'Borrador', clone: 'Tampón de clonar', heal: 'Pincel corrector' }[kind] + (onMask ? ' (máscara)' : ''), [l], { mask: onMask });
      const t2 = onMask ? l.mask : l.canvas; const x2 = t2.getContext('2d'); x2.clearRect(0, 0, W, H); x2.drawImage(live, 0, 0);
      if (onMask) I.touchMask(l); l.ver++; IE.dirtyComp(); renderLayersSoon();
    });
  }
  const gray = (hex) => { const [r, g, b] = F.hexToRgb(hex); const v = Math.round(.299 * r + .587 * g + .114 * b); const s = v.toString(16).padStart(2, '0'); return '#' + s + s + s; };
  /** Ajuste de color del pincel corrector: dst + (src - blur(src)) con base de dst difuminada */
  function healPatch(tt, snap, dx, dy, sx0, sy0, sz) {
    const S = Math.ceil(sz); const sxx = snap.getContext('2d', { willReadFrequently: true });
    const dst = sxx.getImageData(Math.round(dx), Math.round(dy), S, S), src = tt.getImageData(0, 0, S, S);
    const bd = F.gauss(new ImageData(new Uint8ClampedArray(dst.data), S, S), Math.max(2, S / 5)), bs = F.gauss(new ImageData(new Uint8ClampedArray(src.data), S, S), Math.max(2, S / 5));
    const o = src.data; for (let i = 0; i < o.length; i += 4) for (let c = 0; c < 3; c++) o[i + c] = Math.max(0, Math.min(255, o[i + c] - bs.data[i + c] + bd.data[i + c]));
    tt.putImageData(src, 0, 0);
  }
  /** Pinceles locales: desenfocar, enfocar, dedo */
  function localBrush(e, p, kind) {
    const d = IE.d; const l = IE.active(); if (!needRaster(l)) return; I.ensureCovers(d, l);
    I.edit(d, { blurb: 'Desenfocar', sharpenb: 'Enfocar', smudge: 'Dedo' }[kind], [l]);
    const o = IE.O[kind]; const sz = Math.max(4, Math.round(o.size)); const x = l.canvas.getContext('2d', { willReadFrequently: true }); const tip = brushTip(sz, .3, '#000000');
    const selL = d.sel ? I.selLocal(d, l) : null; let prev = null; let carry = null;
    const tcan = FP.canvas(sz, sz); const tc = tcan.getContext('2d', { willReadFrequently: true });
    const stamp = (X, Y) => {
      const lx = Math.round(X - l.x - sz / 2), ly = Math.round(Y - l.y - sz / 2);
      if (kind === 'smudge') {
        const cur = x.getImageData(lx, ly, sz, sz);
        if (!carry) { carry = cur; return; }
        const t = tip.getContext('2d').getImageData(0, 0, sz, sz).data; const s = o.strength;
        for (let i = 0; i < cur.data.length; i += 4) { const a = t[i + 3] / 255 * s; for (let c = 0; c < 4; c++) { cur.data[i + c] = cur.data[i + c] * (1 - a) + carry.data[i + c] * a; carry.data[i + c] = carry.data[i + c] * (1 - a * .15) + cur.data[i + c] * a * .15; } }
        x.putImageData(cur, lx, ly);
      } else {
        const cur = x.getImageData(lx, ly, sz, sz); const proc = new ImageData(new Uint8ClampedArray(cur.data), sz, sz);
        if (kind === 'blurb') F.gauss(proc, Math.max(1, sz / 10 * o.strength * 2)); else F.filters.sharpen.fn(proc, { amount: 60 * o.strength * 2, radius: 1, threshold: 0 });
        tc.putImageData(proc, 0, 0); tc.globalCompositeOperation = 'destination-in'; tc.globalAlpha = o.strength; tc.drawImage(tip, 0, 0); tc.globalAlpha = 1; tc.globalCompositeOperation = 'source-over';
        if (selL) { tc.globalCompositeOperation = 'destination-in'; tc.drawImage(selL, -lx, -ly); tc.globalCompositeOperation = 'source-over'; }
        x.drawImage(tcan, lx, ly);
      }
      l.ver++;
    };
    const walk = strokeWalker(Math.max(2, sz * .2), stamp); walk(p); IE.dirtyComp();
    drag(e, (q) => { walk(q); IE.mouse = q; IE.dirtyComp(); }, () => { renderLayersSoon(); });
  }
  /** Corrector puntual: pinta zona y la rellena según contenido */
  function spotHeal(e, p) {
    const d = IE.d; const l = IE.active(); if (!needRaster(l)) return; I.ensureCovers(d, l);
    const o = IE.O.spot; const m = FP.canvas(d.w, d.h); const mx = m.getContext('2d'); mx.fillStyle = 'rgba(255,40,40,1)'; mx.lineCap = mx.lineJoin = 'round'; mx.lineWidth = o.size; mx.strokeStyle = mx.fillStyle;
    let last = p; mx.beginPath(); mx.arc(p.x, p.y, o.size / 2, 0, Math.PI * 2); mx.fill();
    IE.spotMask = m; IE.render();
    drag(e, (q) => { mx.beginPath(); mx.moveTo(last.x, last.y); mx.lineTo(q.x, q.y); mx.stroke(); last = q; IE.mouse = q; IE.render(); }, async () => {
      IE.spotMask = null; await IE.fillMaskContent(l, m, 'Pincel corrector puntual');
    });
  }
  IE.fillMaskContent = async function (l, maskDocCanvas, label) {
    const d = IE.d; const b = I.trimBounds(maskDocCanvas); if (!b) return;
    const pad = Math.max(40, Math.round(Math.max(b.w, b.h) * 1.2));
    const rx = Math.max(0, b.x - pad - l.x), ry = Math.max(0, b.y - pad - l.y); const rw = Math.min(l.canvas.width - rx, b.w + 2 * pad), rh = Math.min(l.canvas.height - ry, b.h + 2 * pad);
    if (rw <= 0 || rh <= 0) return;
    const region = FP.canvas(rw, rh); region.getContext('2d').drawImage(l.canvas, -rx, -ry);
    const mreg = FP.canvas(rw, rh); mreg.getContext('2d').drawImage(maskDocCanvas, -(rx + l.x), -(ry + l.y)); const ma = I.alphaArray(mreg);
    if (b.w * b.h > 250000 && !await FP.confirm('La zona es grande y el relleno puede tardar o dar un resultado irregular. ¿Continuar?', 'Relleno según contenido')) return;
    const pr = FP.progress(label || 'Relleno según contenido', true);
    try { await I.inpaint(region, ma, pr); } finally { pr.close(); }
    I.edit(d, label || 'Relleno según contenido', [l]); const x = l.canvas.getContext('2d'); x.clearRect(rx, ry, rw, rh); x.drawImage(region, rx, ry); l.ver++; IE.dirtyComp(); renderLayersSoon();
  };

  const T = IE.tools;
  ['brush', 'pencil', 'eraser', 'clone', 'heal'].forEach(k => T[k] = { down: (e, p) => paintStroke(e, p, k) });
  ['blurb', 'sharpenb', 'smudge'].forEach(k => T[k] = { down: (e, p) => localBrush(e, p, k) });
  T.spot = { down: spotHeal, overlay: (x) => { if (IE.spotMask) { x.globalAlpha = .45; x.drawImage(IE.spotMask, 0, 0); x.globalAlpha = 1; } } };
  T.hand = { down: (e) => pan(e) };
  T.zoom = { down: (e, p) => { const r = el.stage.getBoundingClientRect(); IE.zoomTo(IE.view.z * (e.altKey ? 1 / 1.5 : 1.5), e.clientX - r.left, e.clientY - r.top); } };
  T.eyedropper = { down: (e, p) => { const c = I.composite(IE.d); const px = c.getContext('2d', { willReadFrequently: true }).getImageData(FP.clamp(Math.floor(p.x), 0, c.width - 1), FP.clamp(Math.floor(p.y), 0, c.height - 1), 1, 1).data; const hex = '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (e.altKey) IE.bg = hex; else IE.fg = hex; drawColors(); FP.toast('Color: ' + hex); } };

  /* ---- selección ---- */
  function shapeSel(e, p, ellipse) {
    const d = IE.d; const mode = selMode(e); let q = p; const o = IE.O.marquee;
    T[IE.tool].st = { a: p, b: p, ellipse };
    drag(e, (pt, ev) => { q = pt; if (ev.shiftKey && !e.shiftKey || o.ratio === '1:1') { const s = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)); q = { x: p.x + Math.sign(q.x - p.x || 1) * s, y: p.y + Math.sign(q.y - p.y || 1) * s }; } T[IE.tool].st.b = q; IE.render(); }, () => {
      T[IE.tool].st = null; const x0 = Math.min(p.x, q.x), y0 = Math.min(p.y, q.y), w = Math.abs(q.x - p.x), hh = Math.abs(q.y - p.y);
      if (w < 1 || hh < 1) { if (mode === 'new') { if (d.sel) { I.edit(d, 'Deseleccionar', []); I.setSel(d, null); IE.after(); } } return; }
      let m = I.shapeMask(d, (x) => { x.beginPath(); if (ellipse) x.ellipse(x0 + w / 2, y0 + hh / 2, w / 2, hh / 2, 0, 0, Math.PI * 2); else x.rect(Math.round(x0), Math.round(y0), Math.round(w), Math.round(hh)); x.fill(); });
      if (o.feather > 0) m = I.blurAlpha(m, o.feather);
      I.edit(d, ellipse ? 'Selección elíptica' : 'Selección rectangular', []); I.combineSel(d, m, mode); IE.after();
    });
  }
  const marqOverlay = (x, v) => { const st = T[IE.tool].st; if (!st) return; const x0 = Math.min(st.a.x, st.b.x), y0 = Math.min(st.a.y, st.b.y), w = Math.abs(st.b.x - st.a.x), hh = Math.abs(st.b.y - st.a.y); x.lineWidth = 1 / v.z; x.setLineDash([4 / v.z, 4 / v.z]); x.strokeStyle = '#000'; x.beginPath(); if (st.ellipse) x.ellipse(x0 + w / 2, y0 + hh / 2, w / 2, hh / 2, 0, 0, Math.PI * 2); else x.rect(x0, y0, w, hh); x.stroke(); x.strokeStyle = '#fff'; x.lineDashOffset = 4 / v.z; x.stroke(); x.setLineDash([]); x.lineDashOffset = 0; };
  T.marquee = { down: (e, p) => shapeSel(e, p, false), overlay: marqOverlay };
  T.ellipse = { down: (e, p) => shapeSel(e, p, true), overlay: marqOverlay };
  T.lasso = {
    down(e, p) { const d = IE.d; const mode = selMode(e); const pts = [p]; T.lasso.pts = pts; drag(e, (q) => { pts.push(q); IE.render(); }, () => { T.lasso.pts = null; if (pts.length < 3) return; finishPolySel(pts, mode, 'Lazo'); }); },
    overlay: (x, v) => { const pts = T.lasso.pts; if (!pts) return; polyDraw(x, v, pts, false); },
  };
  function polyDraw(x, v, pts, open, cur) { x.lineWidth = 1 / v.z; x.strokeStyle = '#000'; x.setLineDash([4 / v.z, 4 / v.z]); x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); if (cur) x.lineTo(cur.x, cur.y); if (!open) x.closePath(); x.stroke(); x.strokeStyle = '#fff'; x.lineDashOffset = 4 / v.z; x.stroke(); x.setLineDash([]); x.lineDashOffset = 0; }
  function finishPolySel(pts, mode, label) { const d = IE.d; let m = I.shapeMask(d, (x) => { x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); x.closePath(); x.fill(); }); if (IE.O.lasso.feather > 0) m = I.blurAlpha(m, IE.O.lasso.feather); I.edit(d, label, []); I.combineSel(d, m, mode); IE.after(); }
  T.polylasso = {
    down(e, p) { const st = T.polylasso; if (!st.pts) { st.pts = [p]; st.mode = selMode(e); return; } const f = st.pts[0]; if (Math.hypot(p.x - f.x, p.y - f.y) * IE.view.z < 8 || e.detail >= 2) { const pts = st.pts; st.pts = null; if (pts.length >= 3) finishPolySel(pts, st.mode, 'Lazo poligonal'); IE.render(); return; } st.pts.push(p); IE.render(); },
    overlay: (x, v) => { const st = T.polylasso; if (st.pts) polyDraw(x, v, st.pts, true, IE.mouse); },
    leave() { T.polylasso.pts = null; }, key(e) { const st = T.polylasso; if (!st.pts) return false; if (e.key === 'Enter') { const pts = st.pts; st.pts = null; if (pts.length >= 3) finishPolySel(pts, st.mode, 'Lazo poligonal'); return true; } if (e.key === 'Escape') { st.pts = null; IE.render(); return true; } if (e.key === 'Backspace') { st.pts.pop(); if (!st.pts.length) st.pts = null; IE.render(); return true; } return false; },
  };
  function sampleImage(all) { const d = IE.d; const l = IE.active(); const c = all || !l || l.type !== 'raster' ? I.composite(d) : I.renderLayerDoc(d, l); return c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, d.w, d.h); }
  T.wand = { down(e, p) { const d = IE.d; const o = IE.O.wand; const img = sampleImage(o.sampleAll); const m = I.floodMask(img, d.w, d.h, p.x, p.y, o.tolerance, o.contiguous); I.edit(d, 'Varita mágica', []); I.combineSel(d, I.maskToCanvas(m, d.w, d.h), selMode(e)); IE.after(); } };
  T.objsel = {
    down(e, p) { const d = IE.d; const mode = selMode(e); let q = p; T.objsel.st = { a: p, b: p }; drag(e, (pt) => { q = pt; T.objsel.st.b = q; IE.render(); }, () => { T.objsel.st = null; const r = { x: Math.max(0, Math.round(Math.min(p.x, q.x))), y: Math.max(0, Math.round(Math.min(p.y, q.y))) }; r.w = Math.min(d.w - r.x, Math.round(Math.abs(q.x - p.x))); r.h = Math.min(d.h - r.y, Math.round(Math.abs(q.y - p.y))); if (r.w < 6 || r.h < 6) return; const m = IE.objectMask(r, IE.O.objsel.tolerance); if (!m) return FP.toast('No se distinguió ningún objeto: prueba a ajustar el rectángulo o la tolerancia', 'warn'); I.edit(d, 'Selección de objetos', []); I.combineSel(d, m, mode); IE.after(); }); },
    overlay: (x, v) => { const st = T.objsel.st; if (!st) return; x.lineWidth = 1.5 / v.z; x.strokeStyle = '#4aa3ff'; x.setLineDash([6 / v.z, 4 / v.z]); x.strokeRect(Math.min(st.a.x, st.b.x), Math.min(st.a.y, st.b.y), Math.abs(st.b.x - st.a.x), Math.abs(st.b.y - st.a.y)); x.setLineDash([]); },
  };
  /** Selección de objeto: fondo = región conectada al borde del rectángulo con colores parecidos */
  IE.objectMask = function (r, tol, whole) {
    const d = IE.d; const img = sampleImage(true); const W = d.w; const data = img.data;
    const bgMask = new Uint8Array(r.w * r.h); const stack = []; const t2 = tol * tol * 3;
    const idx = (x, y) => ((r.y + y) * W + r.x + x) * 4;
    const seeds = []; for (let x = 0; x < r.w; x++) { seeds.push([x, 0], [x, r.h - 1]); } for (let y = 0; y < r.h; y++) { seeds.push([0, y], [r.w - 1, y]); }
    // colores de fondo de referencia: muestras del borde
    const samples = []; for (let i = 0; i < seeds.length; i += Math.max(1, Math.floor(seeds.length / 64))) { const k = idx(seeds[i][0], seeds[i][1]); samples.push([data[k], data[k + 1], data[k + 2], data[k + 3]]); }
    const isBg = (k) => { for (const s of samples) { const dr = data[k] - s[0], dg = data[k + 1] - s[1], db = data[k + 2] - s[2], da = data[k + 3] - s[3]; if (dr * dr + dg * dg + db * db + da * da <= t2) return true; } return false; };
    seeds.forEach(([x, y]) => { const i = y * r.w + x; if (!bgMask[i] && isBg(idx(x, y))) { bgMask[i] = 1; stack.push(i); } });
    while (stack.length) { const i = stack.pop(); const x = i % r.w, y = (i / r.w) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, ay]) => { const X = x + ax, Y = y + ay; if (X < 0 || Y < 0 || X >= r.w || Y >= r.h) return; const j = Y * r.w + X; if (bgMask[j]) return; if (isBg(idx(X, Y))) { bgMask[j] = 1; stack.push(j); } }); }
    let any = 0; const full = new Uint8Array(d.w * d.h); for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (!bgMask[y * r.w + x]) { full[(r.y + y) * W + r.x + x] = 255; any++; }
    if (!any || any > r.w * r.h * .98) return null;
    // limpieza: cierre morfológico ligero
    let a = I.morph(full, d.w, d.h, 1, true); a = I.morph(a, d.w, d.h, 1, false);
    return I.maskToCanvas(a, d.w, d.h);
  };

  /* ---- mover / selección flotante ---- */
  T.move = {
    down(e, p) {
      const d = IE.d; let l = IE.active();
      if (IE.O.move.auto || e.ctrlKey || e.metaKey) { const hit = pickLayer(p); if (hit) { d.activeId = hit.id; l = hit; renderLayers(); } }
      if (!l) return; if (l.locked) return FP.toast('La capa está bloqueada', 'warn');
      if (d.sel && l.type === 'raster' && !IE.editMask) return moveSelection(e, p, l);
      const targets = l.type === 'group' ? I.flat({ layers: l.children }).concat([l]) : [l];
      const before = I.snapshot(d); const starts = targets.map(t => [t, t.x, t.y]); let moved = false;
      drag(e, (q, ev) => { let dx = Math.round(q.x - p.x), dy = Math.round(q.y - p.y); if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; } starts.forEach(([t, x, y]) => { t.x = x + dx; t.y = y + dy; }); moved = moved || dx || dy; IE.dirtyComp(); }, () => { if (moved) { I.history.undo.push({ label: 'Mover', s: before }); I.history.redo = []; I.onChange(); renderHistory(); } });
    },
  };
  function pickLayer(p) { const d = IE.d; let hit = null; const list = I.flat(d).filter(l => l.type === 'raster' || l.type === 'text'); for (let i = list.length - 1; i >= 0; i--) { const l = list[i]; if (!l.visible) continue; const x = Math.floor(p.x - l.x), y = Math.floor(p.y - l.y); if (x < 0 || y < 0 || x >= l.canvas.width || y >= l.canvas.height) continue; if (l.canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, 1, 1).data[3] > 10) { hit = l; break; } } return hit; }
  function moveSelection(e, p, l) {
    const d = IE.d; I.ensureCovers(d, l); I.edit(d, 'Mover selección', [l]);
    const selL = I.selLocal(d, l); const float = FP.canvas(l.canvas.width, l.canvas.height); const fx = float.getContext('2d'); fx.drawImage(l.canvas, 0, 0); fx.globalCompositeOperation = 'destination-in'; fx.drawImage(selL, 0, 0);
    const lx = l.canvas.getContext('2d'); lx.globalCompositeOperation = e.altKey ? 'source-over' : 'destination-out'; if (!e.altKey) lx.drawImage(selL, 0, 0); lx.globalCompositeOperation = 'source-over'; l.ver++;
    const sel0 = d.sel; let dx = 0, dy = 0;
    IE.live = { id: l.id, draw: (x, L) => { x.globalAlpha = L.opacity; x.globalCompositeOperation = L.blend; const s = I.layerSource(L); x.drawImage(s.c, L.x + s.dx, L.y + s.dy); x.drawImage(float, L.x + dx, L.y + dy); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; } };
    drag(e, (q, ev) => { dx = Math.round(q.x - p.x); dy = Math.round(q.y - p.y); if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; } const ns = FP.canvas(d.w, d.h); ns.getContext('2d').drawImage(sel0, dx, dy); d.sel = ns; I.selChanged(d); IE.render(); }, () => { IE.live = null; lx.drawImage(float, dx, dy); l.ver++; IE.dirtyComp(); renderLayersSoon(); });
  }

  /* ---- relleno y degradado ---- */
  T.bucket = { down(e, p) { const d = IE.d; const l = IE.active(); if (!needRaster(l, 'rellenar')) return; const o = IE.O.bucket; const img = sampleImage(o.sampleAll); const m = I.floodMask(img, d.w, d.h, p.x, p.y, o.tolerance, o.contiguous); const mc = I.maskToCanvas(m, d.w, d.h); const x = mc.getContext('2d'); x.globalCompositeOperation = 'source-in'; x.fillStyle = IE.fg; x.fillRect(0, 0, d.w, d.h); if (d.sel) { x.globalCompositeOperation = 'destination-in'; x.drawImage(d.sel, 0, 0); } I.ensureCovers(d, l); I.edit(d, 'Bote de pintura', [l]); const lx = l.canvas.getContext('2d'); lx.globalAlpha = o.opacity; lx.drawImage(mc, -l.x, -l.y); lx.globalAlpha = 1; l.ver++; IE.dirtyComp(); renderLayersSoon(); } };
  T.gradient = {
    down(e, p) { const d = IE.d; const l = IE.active(); if (!needRaster(l, 'aplicar un degradado')) return; let q = p; T.gradient.st = { a: p, b: p }; drag(e, (pt, ev) => { q = pt; if (ev.shiftKey) { const a = Math.round(Math.atan2(q.y - p.y, q.x - p.x) / (Math.PI / 4)) * Math.PI / 4, r = Math.hypot(q.x - p.x, q.y - p.y); q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r }; } T.gradient.st.b = q; IE.render(); }, () => { T.gradient.st = null; if (Math.hypot(q.x - p.x, q.y - p.y) < 2) return; IE.applyGradient(l, p, q); }); },
    overlay: (x, v) => { const st = T.gradient.st; if (!st) return; x.lineWidth = 1.5 / v.z; x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(st.a.x, st.a.y); x.lineTo(st.b.x, st.b.y); x.stroke(); x.fillStyle = '#ff6b3d'; [st.a, st.b].forEach(q => { x.beginPath(); x.arc(q.x, q.y, 4 / v.z, 0, 7); x.fill(); }); },
  };
  IE.applyGradient = function (l, a, b) {
    const d = IE.d; const o = IE.O.gradient; I.ensureCovers(d, l); const g = FP.canvas(d.w, d.h); const x = g.getContext('2d');
    const gr = o.type === 'radial' ? x.createRadialGradient(a.x, a.y, 0, a.x, a.y, Math.hypot(b.x - a.x, b.y - a.y)) : x.createLinearGradient(a.x, a.y, b.x, b.y);
    const [r, gg, bb] = F.hexToRgb(IE.fg); gr.addColorStop(0, IE.fg); gr.addColorStop(1, o.mode === 'fgtrans' ? `rgba(${r},${gg},${bb},0)` : IE.bg);
    x.fillStyle = gr; x.fillRect(0, 0, d.w, d.h); if (d.sel) { x.globalCompositeOperation = 'destination-in'; x.drawImage(d.sel, 0, 0); }
    I.edit(d, 'Degradado', [l]); const lx = l.canvas.getContext('2d'); lx.globalAlpha = o.opacity; lx.drawImage(g, -l.x, -l.y); lx.globalAlpha = 1; l.ver++; IE.dirtyComp(); renderLayersSoon();
  };

  /* ---- formas ---- */
  T.shape = {
    down(e, p) { const d = IE.d; let q = p; T.shape.st = { a: p, b: p }; drag(e, (pt, ev) => { q = pt; if (ev.shiftKey) { const o = IE.O.shape; if (o.kind === 'line' || o.kind === 'arrow') { const a = Math.round(Math.atan2(q.y - p.y, q.x - p.x) / (Math.PI / 4)) * Math.PI / 4, r = Math.hypot(q.x - p.x, q.y - p.y); q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r }; } else { const s = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)); q = { x: p.x + Math.sign(q.x - p.x || 1) * s, y: p.y + Math.sign(q.y - p.y || 1) * s }; } } T.shape.st.b = q; IE.render(); }, () => { T.shape.st = null; if (Math.hypot(q.x - p.x, q.y - p.y) < 3) return; const c = FP.canvas(d.w, d.h); drawShape(c.getContext('2d'), p, q, 1); IE.addLayer(c, { line: 'Línea', arrow: 'Flecha' }[IE.O.shape.kind] || 'Forma', 0, 0, 'Forma'); }); },
    overlay: (x, v) => { const st = T.shape.st; if (st) drawShape(x, st.a, st.b, .8); },
  };
  function drawShape(x, a, b, alpha) {
    const o = IE.O.shape; x.save(); x.globalAlpha = alpha; x.fillStyle = IE.fg; x.strokeStyle = o.fill ? IE.bg : IE.fg; x.lineWidth = o.sw; x.lineJoin = 'round'; x.lineCap = 'round';
    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), hh = Math.abs(b.y - a.y);
    x.beginPath();
    if (o.kind === 'line' || o.kind === 'arrow') { x.strokeStyle = IE.fg; const ang = Math.atan2(b.y - a.y, b.x - a.x), hl = Math.max(10, o.sw * 4); const e = o.kind === 'arrow' ? { x: b.x - Math.cos(ang) * hl * .8, y: b.y - Math.sin(ang) * hl * .8 } : b; x.moveTo(a.x, a.y); x.lineTo(e.x, e.y); x.stroke(); if (o.kind === 'arrow') { x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(b.x - hl * Math.cos(ang - .45), b.y - hl * Math.sin(ang - .45)); x.lineTo(b.x - hl * Math.cos(ang + .45), b.y - hl * Math.sin(ang + .45)); x.closePath(); x.fill(); } x.restore(); return; }
    if (o.kind === 'rect') x.rect(x0, y0, w, hh);
    else if (o.kind === 'round') { const r = Math.min(o.radius, w / 2, hh / 2); x.roundRect ? x.roundRect(x0, y0, w, hh, r) : x.rect(x0, y0, w, hh); }
    else if (o.kind === 'ellipse') x.ellipse(x0 + w / 2, y0 + hh / 2, w / 2, hh / 2, 0, 0, Math.PI * 2);
    else { const n = Math.max(3, o.sides | 0); const cx = x0 + w / 2, cy = y0 + hh / 2; const pts = o.kind === 'star' ? n * 2 : n; for (let i = 0; i < pts; i++) { const ang = -Math.PI / 2 + i * Math.PI * 2 / pts; const rr = o.kind === 'star' && i % 2 ? .45 : 1; const px = cx + Math.cos(ang) * w / 2 * rr, py = cy + Math.sin(ang) * hh / 2 * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); }
    if (o.fill) x.fill(); if (o.stroke || !o.fill) x.stroke(); x.restore();
  }

  /* ---- recorte ---- */
  T.crop = {
    st: null,
    enter() { const d = IE.d; T.crop.st = { x: 0, y: 0, w: d.w, h: d.h }; T.crop.applyPreset(); },
    leave() { T.crop.st = null; },
    applyPreset() {
      const d = IE.d; const pr = IE.CROP_PRESETS.find(q => q[0] === IE.O.crop.preset); const st = T.crop.st; if (!st || !pr || pr[0] === 'free') return;
      const ratio = pr[2] ? pr[2] / pr[3] : pr[1].split(':').map(Number).reduce((a, b) => a / b);
      let w = d.w, hh = w / ratio; if (hh > d.h) { hh = d.h; w = hh * ratio; } Object.assign(st, { x: (d.w - w) / 2, y: (d.h - hh) / 2, w, h: hh }); IE.render();
    },
    ratio() { const pr = IE.CROP_PRESETS.find(q => q[0] === IE.O.crop.preset); if (!pr || pr[0] === 'free') return null; return pr[2] ? pr[2] / pr[3] : pr[1].split(':').map(Number).reduce((a, b) => a / b); },
    down(e, p) {
      const st = T.crop.st; const v = IE.view; const tol = 8 / v.z; const R = T.crop.ratio();
      const hx = [st.x, st.x + st.w / 2, st.x + st.w], hy = [st.y, st.y + st.h / 2, st.y + st.h]; let hk = null;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!(i === 1 && j === 1) && Math.abs(p.x - hx[i]) < tol && Math.abs(p.y - hy[j]) < tol) hk = [i, j];
      const s0 = Object.assign({}, st);
      if (hk) return drag(e, (q) => { let x0 = s0.x, y0 = s0.y, x1 = s0.x + s0.w, y1 = s0.y + s0.h; if (hk[0] === 0) x0 = q.x; if (hk[0] === 2) x1 = q.x; if (hk[1] === 0) y0 = q.y; if (hk[1] === 2) y1 = q.y; if (R) { const w = Math.abs(x1 - x0); const hh = w / R; if (hk[1] === 0) y0 = y1 - hh; else y1 = y0 + hh; } Object.assign(st, { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) }); IE.render(); });
      if (p.x > st.x && p.x < st.x + st.w && p.y > st.y && p.y < st.y + st.h) return drag(e, (q) => { st.x = s0.x + q.x - p.x; st.y = s0.y + q.y - p.y; IE.render(); });
      drag(e, (q) => { let w = q.x - p.x, hh = q.y - p.y; if (R) hh = Math.sign(hh || 1) * Math.abs(w) / R; Object.assign(st, { x: Math.min(p.x, p.x + w), y: Math.min(p.y, p.y + hh), w: Math.abs(w), h: Math.abs(hh) }); IE.render(); });
    },
    overlay(x, v) {
      const st = T.crop.st; if (!st) return; const d = IE.d; x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.rect(-1e5, -1e5, 2e5, 2e5); x.rect(st.x, st.y, st.w, st.h); x.fill('evenodd');
      x.strokeStyle = '#fff'; x.lineWidth = 1.5 / v.z; x.strokeRect(st.x, st.y, st.w, st.h); x.lineWidth = .7 / v.z; x.strokeStyle = 'rgba(255,255,255,.6)'; x.beginPath(); for (let i = 1; i < 3; i++) { x.moveTo(st.x + st.w * i / 3, st.y); x.lineTo(st.x + st.w * i / 3, st.y + st.h); x.moveTo(st.x, st.y + st.h * i / 3); x.lineTo(st.x + st.w, st.y + st.h * i / 3); } x.stroke();
      x.fillStyle = '#fff'; const s = 7 / v.z; [[st.x, st.y], [st.x + st.w / 2, st.y], [st.x + st.w, st.y], [st.x, st.y + st.h / 2], [st.x + st.w, st.y + st.h / 2], [st.x, st.y + st.h], [st.x + st.w / 2, st.y + st.h], [st.x + st.w, st.y + st.h]].forEach(([a, b]) => x.fillRect(a - s / 2, b - s / 2, s, s));
    },
    key(e) { if (e.key === 'Enter') { IE.applyCrop(); return true; } if (e.key === 'Escape') { IE.setTool('move'); return true; } return false; },
  };

  /* ---- texto ---- */
  T.text = {
    down(e, p) {
      const d = IE.d; const hit = pickLayer(p); if (hit && hit.type === 'text') { d.activeId = hit.id; renderLayers(); return IE.editText(hit); }
      const o = IE.O.text; const l = I.newLayer(d, 'Texto'); l.type = 'text'; l.text = Object.assign({}, o, { text: '', color: IE.fg }); I.renderText(l); l.x = Math.round(p.x - l._pad); l.y = Math.round(p.y - l._pad - o.size * .8);
      I.edit(d, 'Nueva capa de texto', []); insertAbove(l); IE.editText(l, true);
    },
  };
  IE.editText = function (l, fresh) {
    if (IE.textEditing) IE.commitText();
    const v = IE.view; const t = l.text; const before = I.snapshot(IE.d);
    const ta = h('textarea', { class: 'textedit', spellcheck: false }); ta.value = t.text;
    const place = () => { Object.assign(ta.style, { left: (v.x + (l.x + l._pad) * v.z) + 'px', top: (v.y + (l.y + l._pad) * v.z) + 'px', font: `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${t.size * v.z}px ${t.font}`, lineHeight: t.lineHeight, color: 'transparent', caretColor: t.color, textAlign: t.align, width: Math.max(40, (l.canvas.width - 2 * l._pad) * v.z + t.size * v.z) + 'px', height: Math.max(t.size * v.z * 1.3, (l.canvas.height - 2 * l._pad) * v.z + 4) + 'px', letterSpacing: (t.spacing || 0) * v.z + 'px' }); };
    place(); el.stage.appendChild(ta); ta.focus(); ta.select(); setTimeout(() => { if (document.activeElement !== ta) { ta.focus(); ta.select(); } }, 30);
    ta.addEventListener('input', () => { t.text = ta.value; I.renderText(l); IE.dirtyComp(); place(); });
    ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); IE.commitText(); } });
    IE.textEditing = { l, ta, before, fresh, place };
  };
  IE.commitText = function () {
    const te = IE.textEditing; if (!te) return; IE.textEditing = null; te.ta.remove(); const l = te.l;
    if (!l.text.text.trim()) { const f = I.find(IE.d, l.id); if (f) f.list.splice(f.list.indexOf(l), 1); if (IE.d.activeId === l.id) IE.d.activeId = (I.flat(IE.d)[0] || {}).id; if (te.fresh) { I.history.undo.pop(); } }
    else { l.name = l.text.text.split('\n')[0].slice(0, 30); if (!te.fresh) { I.history.undo.push({ label: 'Editar texto', s: te.before }); I.history.redo = []; } I.onChange(); }
    IE.after();
  };
  IE.cancelText = () => { const te = IE.textEditing; if (te) { te.ta.remove(); IE.textEditing = null; } };

  /* ======================= Transformación libre ======================= */
  IE.startTransform = function (mode) {
    const d = IE.d; let l = IE.active(); if (!l || l.type === 'adjust') return FP.toast('Selecciona una capa', 'warn'); if (l.locked) return FP.toast('Capa bloqueada', 'warn');
    if (l.type === 'group') return FP.toast('Transforma las capas del grupo de una en una (o combínalas)', 'warn');
    IE.commitPending();
    if (l.type === 'text' && mode && mode !== 'scale' && mode !== 'rotate') { l.type = 'raster'; delete l.text; FP.toast('La capa de texto se ha rasterizado para esta transformación'); }
    let src, bx, by, floating = false;
    if (d.sel && l.type === 'raster') { const sl = I.selLocal(d, l); const f = FP.canvas(l.canvas.width, l.canvas.height); const fx = f.getContext('2d'); fx.drawImage(l.canvas, 0, 0); fx.globalCompositeOperation = 'destination-in'; fx.drawImage(sl, 0, 0); const b = I.trimBounds(f); if (!b) return FP.toast('La selección está vacía en esta capa', 'warn'); src = FP.canvas(b.w, b.h); src.getContext('2d').drawImage(f, -b.x, -b.y); bx = l.x + b.x; by = l.y + b.y; floating = sl; }
    else { const b = l.type === 'text' ? { x: 0, y: 0, w: l.canvas.width, h: l.canvas.height } : I.trimBounds(l.canvas); if (!b) return FP.toast('La capa está vacía', 'warn'); src = FP.canvas(b.w, b.h); src.getContext('2d').drawImage(l.canvas, -b.x, -b.y); bx = l.x + b.x; by = l.y + b.y; }
    const q = [[bx, by], [bx + src.width, by], [bx + src.width, by + src.height], [bx, by + src.height]];
    let maskSrc = null; if (l.mask && !floating) { const b = { x: bx - l.x, y: by - l.y }; maskSrc = FP.canvas(src.width, src.height); maskSrc.getContext('2d').drawImage(l.mask, -b.x, -b.y); }
    IE.T = { l, src, q, q0: q.map(p => p.slice()), mode: mode || 'scale', floating, maskSrc, ratio: src.width / src.height };
    const self = IE.T;
    IE.live = { id: l.id, draw: (x, L) => { x.globalAlpha = L.opacity; x.globalCompositeOperation = L.blend; if (self.floating) { const t = FP.canvas(L.canvas.width, L.canvas.height); const tx = t.getContext('2d'); tx.drawImage(L.canvas, 0, 0); tx.globalCompositeOperation = 'destination-out'; tx.drawImage(self.floating, 0, 0); x.drawImage(t, L.x, L.y); } I.drawWarp(x, self.src, self.q, 14); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; } };
    if (IE.tool !== 'move') IE.setTool('move'); renderOpt(); IE.dirtyComp();
  };
  function drawTransform(x, v) {
    const t = IE.T; const q = t.q; x.lineWidth = 1.2 / v.z; x.strokeStyle = '#4aa3ff'; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke();
    const s = 8 / v.z; x.fillStyle = '#fff'; handles(t).forEach(([, p]) => { x.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); x.strokeRect(p[0] - s / 2, p[1] - s / 2, s, s); });
    const c = center(q); x.beginPath(); x.arc(c[0], c[1], 4 / v.z, 0, 7); x.stroke();
  }
  const center = (q) => [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const handles = (t) => { const q = t.q; return [['c0', q[0]], ['c1', q[1]], ['c2', q[2]], ['c3', q[3]], ['e0', mid(q[0], q[1])], ['e1', mid(q[1], q[2])], ['e2', mid(q[2], q[3])], ['e3', mid(q[3], q[0])]]; };
  function inside(q, p) { let c = false; for (let i = 0, j = 3; i < 4; j = i++) { if (((q[i][1] > p.y) !== (q[j][1] > p.y)) && (p.x < (q[j][0] - q[i][0]) * (p.y - q[i][1]) / (q[j][1] - q[i][1]) + q[i][0])) c = !c; } return c; }
  function hitHandle(p) { const t = IE.T; const tol = 9 / IE.view.z; for (const [k, h2] of handles(t)) if (Math.abs(p.x - h2[0]) < tol && Math.abs(p.y - h2[1]) < tol) return k; return null; }
  function transformHover(e, p) { const k = hitHandle(p); el.stage.style.cursor = k ? (k[0] === 'c' ? (IE.T.mode === 'scale' ? 'nwse-resize' : 'crosshair') : 'move') : inside(IE.T.q, p) ? 'move' : 'alias'; }
  function transformDown(e, p) {
    const t = IE.T; const k = hitHandle(p); const q0 = t.q.map(a => a.slice()); const c = center(q0);
    if (!k && inside(q0, p)) return drag(e, (q) => { const dx = q.x - p.x, dy = q.y - p.y; t.q = q0.map(a => [a[0] + dx, a[1] + dy]); IE.dirtyComp(); renderOpt(true); });
    if (!k) { const a0 = Math.atan2(p.y - c[1], p.x - c[0]); return drag(e, (q, ev) => { let a = Math.atan2(q.y - c[1], q.x - c[0]) - a0; if (ev.shiftKey) a = Math.round(a / (Math.PI / 12)) * Math.PI / 12; const cs = Math.cos(a), sn = Math.sin(a); t.q = q0.map(([x, y]) => [c[0] + (x - c[0]) * cs - (y - c[1]) * sn, c[1] + (x - c[0]) * sn + (y - c[1]) * cs]); IE.dirtyComp(); renderOpt(true); }); }
    const mode = (e.ctrlKey || e.metaKey) ? 'distort' : t.mode; const idx = +k[1];
    drag(e, (q, ev) => {
      const nq = q0.map(a => a.slice());
      if (k[0] === 'c') {
        if (mode === 'distort') nq[idx] = [q.x, q.y];
        else if (mode === 'perspective') { nq[idx] = [q.x, q.y]; const pair = { 0: 1, 1: 0, 2: 3, 3: 2 }[idx]; const dx = q.x - q0[idx][0]; nq[pair] = [q0[pair][0] - dx, q0[pair][1] + (q.y - q0[idx][1])]; }
        else if (mode === 'skew') { const dx = q.x - q0[idx][0], dy = q.y - q0[idx][1]; const nb = { 0: 1, 1: 0, 2: 3, 3: 2 }[idx]; nq[idx] = [q0[idx][0] + dx, q0[idx][1] + dy]; nq[nb] = [q0[nb][0] + dx, q0[nb][1] + dy]; }
        else { // escalar desde la esquina opuesta en el marco de la capa
          const o = q0[(idx + 2) % 4]; const ux = [q0[1][0] - q0[0][0], q0[1][1] - q0[0][1]], uy = [q0[3][0] - q0[0][0], q0[3][1] - q0[0][1]]; const lw = Math.hypot(...ux), lh = Math.hypot(...uy); const ex = [ux[0] / lw, ux[1] / lw], ey = [uy[0] / lh, uy[1] / lh];
          const vx = (q.x - o[0]) * ex[0] + (q.y - o[1]) * ex[1], vy = (q.x - o[0]) * ey[0] + (q.y - o[1]) * ey[1]; const cvx = (q0[idx][0] - o[0]) * ex[0] + (q0[idx][1] - o[1]) * ex[1], cvy = (q0[idx][0] - o[0]) * ey[0] + (q0[idx][1] - o[1]) * ey[1];
          let sx = vx / cvx, sy = vy / cvy; if (!ev.shiftKey) { const s = Math.abs(sx) > Math.abs(sy) ? sx : sy; sx = sy = s; } if (ev.altKey) { /* desde el centro */ }
          for (let i = 0; i < 4; i++) { const px = (q0[i][0] - o[0]) * ex[0] + (q0[i][1] - o[1]) * ex[1], py = (q0[i][0] - o[0]) * ey[0] + (q0[i][1] - o[1]) * ey[1]; nq[i] = [o[0] + ex[0] * px * sx + ey[0] * py * sy, o[1] + ex[1] * px * sx + ey[1] * py * sy]; }
        }
      } else {
        const a = idx, b = (idx + 1) % 4; const m0 = mid(q0[a], q0[b]); const dx = q.x - m0[0], dy = q.y - m0[1];
        if (mode === 'skew' || mode === 'distort') { nq[a] = [q0[a][0] + dx, q0[a][1] + dy]; nq[b] = [q0[b][0] + dx, q0[b][1] + dy]; }
        else { const oa = (idx + 3) % 4, ob = (idx + 2) % 4; const om = mid(q0[oa], q0[ob]); const dir = [m0[0] - om[0], m0[1] - om[1]]; const L0 = Math.hypot(...dir); const u = [dir[0] / L0, dir[1] / L0]; const proj = (q.x - om[0]) * u[0] + (q.y - om[1]) * u[1]; const s = proj / L0; nq[a] = [q0[oa === (a + 3) % 4 ? oa : oa][0] + (q0[a][0] - q0[oa][0]) * s, 0]; nq[a] = [q0[oa][0] + (q0[a][0] - q0[oa][0]) * s, q0[oa][1] + (q0[a][1] - q0[oa][1]) * s]; nq[b] = [q0[ob][0] + (q0[b][0] - q0[ob][0]) * s, q0[ob][1] + (q0[b][1] - q0[ob][1]) * s]; }
      }
      t.q = nq; IE.dirtyComp(); renderOpt(true);
    });
  }
  IE.commitTransform = function () {
    const t = IE.T; if (!t) return; const d = IE.d; const l = t.l; IE.T = null; IE.live = null;
    const xs = t.q.map(p => p[0]), ys = t.q.map(p => p[1]); const x0 = Math.floor(Math.min(...xs)), y0 = Math.floor(Math.min(...ys)), x1 = Math.ceil(Math.max(...xs)), y1 = Math.ceil(Math.max(...ys));
    const same = t.q.every((p, i) => Math.abs(p[0] - t.q0[i][0]) < .01 && Math.abs(p[1] - t.q0[i][1]) < .01); if (same) { IE.dirtyComp(); renderOpt(); return; }
    if ((x1 - x0) * (y1 - y0) > FP.LIMITS.maxPixels / 2) { FP.toast('Transformación demasiado grande', 'err'); IE.dirtyComp(); return; }
    let warped; if (I.isParallelogram(t.q)) { warped = FP.canvas(x1 - x0, y1 - y0); const wx = warped.getContext('2d'); wx.imageSmoothingQuality = 'high'; wx.translate(-x0, -y0); I.drawWarp(wx, t.src, t.q, 24); } else warped = I.warpPixels(t.src, t.q, x0, y0, x1 - x0, y1 - y0);
    I.edit(d, 'Transformación libre', [l]);
    if (l.type === 'text') { const sx = Math.hypot(t.q[1][0] - t.q[0][0], t.q[1][1] - t.q[0][1]) / t.src.width; const rot = Math.atan2(t.q[1][1] - t.q[0][1], t.q[1][0] - t.q[0][0]); if (Math.abs(rot) < .001) { l.text.size = Math.max(1, l.text.size * sx); I.renderText(l); l.x = Math.round(t.q[0][0]); l.y = Math.round(t.q[0][1]); IE.after(); renderOpt(); return; } l.type = 'raster'; delete l.text; }
    if (t.floating) { I.ensureCovers(d, l); const lx = l.canvas.getContext('2d'); lx.globalCompositeOperation = 'destination-out'; lx.drawImage(t.floating, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.drawImage(warped, x0 - l.x, y0 - l.y); const ns = FP.canvas(d.w, d.h); const nx = ns.getContext('2d'); nx.translate(0, 0); const sm = FP.canvas(t.src.width, t.src.height); sm.getContext('2d').fillRect(0, 0, sm.width, sm.height); I.drawWarp(nx, sm, t.q, 24); I.setSel(d, ns); }
    else { l.canvas = warped; l.x = x0; l.y = y0; if (t.maskSrc) { const m = FP.canvas(warped.width, warped.height); const mx = m.getContext('2d'); mx.fillStyle = '#fff'; mx.fillRect(0, 0, m.width, m.height); if (I.isParallelogram(t.q)) { mx.translate(-x0, -y0); I.drawWarp(mx, t.maskSrc, t.q, 24); } else mx.drawImage(I.warpPixels(t.maskSrc, t.q, x0, y0, m.width, m.height), 0, 0); m._ver = 1; l.mask = m; } }
    l.ver++; IE.after(); renderOpt();
  };
  IE.cancelTransform = () => { IE.T = null; IE.live = null; IE.dirtyComp(); renderOpt(); };
  IE.setTransformNumbers = function (v) { const t = IE.T; if (!t) return; const w0 = t.src.width, h0 = t.src.height; const c = center(t.q0); const sx = v.w / 100, sy = v.h / 100, a = v.rot * Math.PI / 180, kx = Math.tan((v.skx || 0) * Math.PI / 180); const cs = Math.cos(a), sn = Math.sin(a); t.q = [[-w0 / 2, -h0 / 2], [w0 / 2, -h0 / 2], [w0 / 2, h0 / 2], [-w0 / 2, h0 / 2]].map(([x, y]) => { x = x * sx + y * sy * kx; y = y * sy; return [c[0] + x * cs - y * sn + (v.dx || 0), c[1] + x * sn + y * cs + (v.dy || 0)]; }); IE.dirtyComp(); };
  IE.flipTransform = (axis) => { const t = IE.T; if (!t) return; const q = t.q; t.q = axis === 'h' ? [q[1], q[0], q[3], q[2]] : [q[3], q[2], q[1], q[0]]; IE.dirtyComp(); };

  /* ======================= Barra de opciones ======================= */
  function renderOpt(onlyT) {
    const ob = el.optbar; if (!IE.d) { ob.innerHTML = ''; return; }
    if (IE.T) {
      const t = IE.T; const w0 = t.src.width, h0 = t.src.height; const q = t.q; const sw = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) / w0 * 100, sh = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]) / h0 * 100, rot = Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]) * 180 / Math.PI;
      if (onlyT && FP.$('#tf-w')) { FP.$('#tf-w').value = sw.toFixed(1); FP.$('#tf-h').value = sh.toFixed(1); FP.$('#tf-r').value = rot.toFixed(1); return; }
      ob.innerHTML = ''; const num = (id, val, label) => h('label', null, label, h('input', { id, type: 'number', step: .1, value: val.toFixed(1), onchange: apply }));
      function apply() { IE.setTransformNumbers({ w: +FP.$('#tf-w').value, h: +FP.$('#tf-h').value, rot: +FP.$('#tf-r').value, skx: +FP.$('#tf-k').value }); }
      ob.append(h('span', { class: 'ttl' }, icon('transform', 's'), 'Transformar'), h('select', { onchange: (e) => { t.mode = e.target.value; } }, [['scale', 'Escalar / rotar'], ['skew', 'Inclinar'], ['distort', 'Distorsionar'], ['perspective', 'Perspectiva']].map(([v, l]) => h('option', { value: v, selected: t.mode === v }, l))),
        num('tf-w', sw, 'An %'), num('tf-h', sh, 'Al %'), num('tf-r', rot, 'Ángulo °'), h('label', null, 'Incl. °', h('input', { id: 'tf-k', type: 'number', value: 0, step: 1, onchange: apply })),
        h('button', { class: 'ibtn', 'data-tip': 'Voltear horizontal', onclick: () => IE.flipTransform('h') }, icon('flip')), h('button', { class: 'ibtn', 'data-tip': 'Voltear vertical', onclick: () => IE.flipTransform('v') }, icon('flipv')),
        h('span', { class: 'muted small' }, 'Mayús: libre · Ctrl: distorsionar · fuera: rotar'), h('div', { style: { flex: 1 } }),
        h('button', { class: 'btn sm', onclick: IE.cancelTransform }, 'Cancelar (Esc)'), h('button', { class: 'btn sm pri', onclick: IE.commitTransform }, icon('check', 's'), 'Aplicar (Intro)'));
      return;
    }
    ob.innerHTML = ''; const k = IE.tool; const o = IE.O[k] || {};
    const names = Object.fromEntries(TOOLS.filter(t => t !== '-').map(t => [t[0], t[2].split(' (')[0]]));
    ob.appendChild(h('span', { class: 'ttl' }, names[k] || k));
    const rng = (key, label, min, max, step, unit, mul) => { mul = mul || 1; const out = h('span', { class: 'badge' }, Math.round(o[key] * mul) + (unit || '')); return h('label', null, label, h('input', { type: 'range', min, max, step: step || 1, value: o[key] * mul, oninput: (e) => { o[key] = +e.target.value / mul; out.textContent = Math.round(o[key] * mul) + (unit || ''); IE.render(); } }), out); };
    const chk = (key, label) => h('label', null, h('input', { type: 'checkbox', checked: !!o[key], onchange: (e) => { o[key] = e.target.checked; } }), label);
    const sel = (key, label, opts, cb) => h('label', null, label, h('select', { onchange: (e) => { o[key] = e.target.value; cb && cb(); } }, opts.map(([v, l]) => h('option', { value: v, selected: String(o[key]) === String(v) }, l))));
    const selModes = () => h('div', { style: { display: 'flex', gap: '2px' } }, [['new', 'Nueva'], ['add', 'Añadir (Mayús)'], ['sub', 'Restar (Alt)'], ['int', 'Intersecar']].map(([m, l]) => h('button', { class: 'btn sm' + (IE.selMode === m ? ' pri' : ''), onclick: () => { IE.selMode = m; renderOpt(); } }, l)));
    if (['brush', 'eraser'].includes(k)) ob.append(rng('size', 'Tamaño', 1, 500, 1, ' px'), rng('hardness', 'Dureza', 0, 100, 1, ' %', 100), rng('opacity', 'Opacidad', 1, 100, 1, ' %', 100), rng('flow', 'Flujo', 1, 100, 1, ' %', 100));
    if (k === 'pencil') ob.append(rng('size', 'Tamaño', 1, 100, 1, ' px'), rng('opacity', 'Opacidad', 1, 100, 1, ' %', 100));
    if (k === 'clone') ob.append(rng('size', 'Tamaño', 1, 400, 1, ' px'), rng('hardness', 'Dureza', 0, 100, 1, ' %', 100), rng('opacity', 'Opacidad', 1, 100, 1, ' %', 100), chk('sampleAll', 'Muestrear todas las capas'), h('span', { class: 'muted small' }, 'Alt+clic: origen'));
    if (k === 'heal') ob.append(rng('size', 'Tamaño', 2, 300, 1, ' px'), rng('hardness', 'Dureza', 0, 100, 1, ' %', 100), h('span', { class: 'muted small' }, 'Alt+clic: origen. Mezcla la textura del origen con el color del destino.'));
    if (k === 'spot') ob.append(rng('size', 'Tamaño', 2, 300, 1, ' px'), h('span', { class: 'muted small' }, 'Pinta sobre la imperfección u objeto: se rellenará con el contenido de alrededor.'));
    if (['blurb', 'sharpenb', 'smudge'].includes(k)) ob.append(rng('size', 'Tamaño', 4, 300, 1, ' px'), rng('strength', 'Intensidad', 1, 100, 1, ' %', 100));
    if (k === 'bucket') ob.append(rng('tolerance', 'Tolerancia', 0, 255), rng('opacity', 'Opacidad', 1, 100, 1, ' %', 100), chk('contiguous', 'Contiguo'), chk('sampleAll', 'Todas las capas'));
    if (k === 'gradient') ob.append(sel('type', 'Tipo', [['linear', 'Lineal'], ['radial', 'Radial']]), sel('mode', 'Colores', [['fgbg', 'Frontal → fondo'], ['fgtrans', 'Frontal → transparente']]), rng('opacity', 'Opacidad', 1, 100, 1, ' %', 100));
    if (k === 'wand') ob.append(selModes(), rng('tolerance', 'Tolerancia', 0, 255), chk('contiguous', 'Contiguo'), chk('sampleAll', 'Todas las capas'));
    if (k === 'objsel') ob.append(selModes(), rng('tolerance', 'Tolerancia del fondo', 5, 150), h('span', { class: 'muted small' }, 'Dibuja un rectángulo alrededor del objeto (mejor con fondos uniformes)'));
    if (k === 'marquee' || k === 'ellipse') ob.append(selModes(), rng('feather', 'Desvanecer', 0, 100, 1, ' px'), sel('ratio', 'Proporción', [['', 'Libre'], ['1:1', 'Cuadrada']]));
    if (k === 'lasso' || k === 'polylasso') { o.feather = IE.O.lasso.feather; ob.append(selModes(), h('label', null, 'Desvanecer', h('input', { type: 'number', min: 0, max: 100, value: IE.O.lasso.feather, onchange: (e) => IE.O.lasso.feather = +e.target.value })), k === 'polylasso' ? h('span', { class: 'muted small' }, 'Clic: vértice · doble clic o Intro: cerrar · Retroceso: deshacer vértice') : null); }
    if (k === 'move') ob.append(chk('auto', 'Selección automática de capa'), h('button', { class: 'btn sm', onclick: () => IE.startTransform() }, icon('transform', 's'), 'Transformar (Ctrl+T)'), h('div', { class: 'sep' }), ...[['left', 'Izq.'], ['hcenter', 'Centro H'], ['right', 'Der.'], ['top', 'Arriba'], ['vcenter', 'Centro V'], ['bottom', 'Abajo']].map(([a, l]) => h('button', { class: 'btn sm', 'data-tip': 'Alinear con el lienzo', onclick: () => IE.alignLayer(a) }, l)));
    if (k === 'crop') ob.append(sel('preset', 'Formato', IE.CROP_PRESETS.map(p => [p[0], p[1]]), () => T.crop.applyPreset()), h('button', { class: 'btn sm pri', onclick: () => IE.applyCrop() }, icon('check', 's'), 'Recortar (Intro)'), h('button', { class: 'btn sm', onclick: () => { T.crop.enter(); IE.render(); } }, 'Restablecer'));
    if (k === 'text') {
      const l = IE.active(); const isT = l && l.type === 'text'; const s = isT ? l.text : o;
      const setT = (key, val) => { o[key] = val; if (isT) { if (!IE.textEditing) I.edit(IE.d, 'Texto', []); l.text[key] = val; I.renderText(l); IE.dirtyComp(); if (IE.textEditing) IE.textEditing.place(); renderLayersSoon(); } };
      const fonts = IE.FONTS.concat(IE.fonts.map(f => f.name));
      ob.append(h('select', { onchange: (e) => setT('font', e.target.value) }, fonts.map(f => h('option', { value: f, selected: s.font === f, style: { fontFamily: f } }, f))),
        h('button', { class: 'btn sm', 'data-tip': 'Cargar fuente TTF/OTF/WOFF desde tu ordenador', onclick: () => IE.loadFont() }, '+ Fuente'),
        h('label', null, 'Tamaño', h('input', { type: 'number', min: 1, max: 2000, value: s.size, onchange: (e) => setT('size', +e.target.value) })),
        h('input', { type: 'color', value: isT ? l.text.color : IE.fg, oninput: (e) => { IE.fg = e.target.value; drawColors(); setT('color', e.target.value); } }),
        ...[['bold', 'N'], ['italic', 'K'], ['underline', 'S']].map(([kk, lab]) => h('button', { class: 'ibtn' + (s[kk] ? ' on' : ''), style: { fontWeight: kk === 'bold' ? 'bold' : '', fontStyle: kk === 'italic' ? 'italic' : '', textDecoration: kk === 'underline' ? 'underline' : '' }, onclick: () => { setT(kk, !s[kk]); renderOpt(); } }, lab)),
        h('select', { onchange: (e) => setT('align', e.target.value) }, [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']].map(([v, lab]) => h('option', { value: v, selected: s.align === v }, lab))),
        h('label', null, 'Interlineado', h('input', { type: 'number', min: .5, max: 4, step: .05, value: s.lineHeight, onchange: (e) => setT('lineHeight', +e.target.value) })),
        h('label', null, 'Espaciado', h('input', { type: 'number', min: -50, max: 200, value: s.spacing || 0, onchange: (e) => setT('spacing', +e.target.value) })),
        h('label', null, h('input', { type: 'checkbox', checked: !!s.strokeOn, onchange: (e) => { setT('strokeOn', e.target.checked); } }), 'Contorno'), h('input', { type: 'color', value: s.strokeColor, oninput: (e) => setT('strokeColor', e.target.value) }), h('input', { type: 'number', min: 1, max: 100, value: s.strokeWidth, onchange: (e) => setT('strokeWidth', +e.target.value) }));
    }
    if (k === 'shape') ob.append(sel('kind', 'Forma', [['rect', 'Rectángulo'], ['round', 'Rect. redondeado'], ['ellipse', 'Elipse'], ['polygon', 'Polígono'], ['star', 'Estrella'], ['line', 'Línea'], ['arrow', 'Flecha']], renderOpt), chk('fill', 'Relleno (frontal)'), chk('stroke', 'Trazo (fondo)'), rng('sw', 'Grosor', 1, 100, 1, ' px'), o.kind === 'round' ? rng('radius', 'Radio', 0, 300, 1, ' px') : null, (o.kind === 'polygon' || o.kind === 'star') ? h('label', null, 'Lados', h('input', { type: 'number', min: 3, max: 50, value: o.sides, onchange: (e) => o.sides = +e.target.value })) : null, h('span', { class: 'muted small' }, 'Se crea en una capa nueva'));
    if (k === 'eyedropper') ob.append(h('span', { class: 'muted small' }, 'Clic: color frontal · Alt+clic: color de fondo'));
    if (k === 'zoom' || k === 'hand') ob.append(h('button', { class: 'btn sm', onclick: IE.fit }, 'Ajustar a pantalla'), h('button', { class: 'btn sm', onclick: () => IE.zoomTo(1) }, '100 %'));
    ob.append(h('div', { style: { flex: 1 } }), h('button', { class: 'ibtn', 'data-tip': 'Alejar', onclick: () => IE.zoomTo(IE.view.z / 1.25) }, icon('zoomout')), h('span', { class: 'badge', id: 'img-zoom' }, Math.round(IE.view.z * 100) + ' %'), h('button', { class: 'ibtn', 'data-tip': 'Acercar', onclick: () => IE.zoomTo(IE.view.z * 1.25) }, icon('zoomin')), h('button', { class: 'ibtn', 'data-tip': 'Ajustar a pantalla (Ctrl+0)', onclick: IE.fit }, icon('fit')), h('button', { class: 'ibtn mobonly', onclick: () => el.right.classList.toggle('mob') }, icon('layers')));
  }
  IE.renderOpt = renderOpt;
  function updateStatus(p) {
    if (!IE.d || !el.status) return; const d = IE.d; const z = FP.$('#img-zoom'); if (z) z.textContent = Math.round(IE.view.z * 100) + ' %';
    const sb = I.selBounds(d); el.status.innerHTML = '';
    el.status.append(h('span', null, d.w + ' × ' + d.h + ' px'), h('span', null, d.dpi + ' ppp'), h('span', null, 'Zoom ' + Math.round(IE.view.z * 100) + ' %'), p ? h('span', null, 'X ' + Math.floor(p.x) + '  Y ' + Math.floor(p.y)) : h('span'), sb ? h('span', null, 'Selección ' + sb.w + ' × ' + sb.h) : h('span'), IE.editMask ? h('span', { style: { color: 'var(--warn)' } }, 'Editando máscara') : h('span'), h('span', { class: 'sp' }), h('span', null, I.flat(d).length + ' capas'), h('span', null, 'Procesamiento local'));
  }
  IE.updateStatus = updateStatus;

  /* ======================= Panel de capas ======================= */
  const thumbs = new WeakMap();
  function thumbOf(l, mask) {
    const src = mask ? l.mask : l.canvas; if (!src) return null; const key = (mask ? (src._ver || 0) : l.ver) + ':' + src.width;
    const cached = thumbs.get(src); if (cached && cached.key === key) return cached.c;
    const c = FP.canvas(36, 36); const x = c.getContext('2d'); const s = Math.min(36 / src.width, 36 / src.height); x.imageSmoothingQuality = 'medium'; x.drawImage(src, (36 - src.width * s) / 2, (36 - src.height * s) / 2, src.width * s, src.height * s);
    thumbs.set(src, { key, c }); return c;
  }
  let lyT = 0; function renderLayersSoon() { clearTimeout(lyT); lyT = setTimeout(renderLayers, 120); }
  IE.renderLayers = () => renderLayers();
  function renderLayers() {
    const box = el.layers; if (!box) return; box.innerHTML = ''; const d = IE.d; renderLyOpts(); if (!d) return;
    const rows = (list, depth) => { for (let i = list.length - 1; i >= 0; i--) { const l = list[i]; box.appendChild(layerRow(l, depth)); if (l.type === 'group' && l.open !== false) rows(l.children, depth + 1); } };
    rows(d.layers, 0);
  }
  function layerRow(l, depth) {
    const d = IE.d; const on = d.activeId === l.id;
    const eye = h('div', { class: 'eye' + (l.visible ? '' : ' off'), 'data-tip': 'Mostrar/ocultar', onclick: (e) => { e.stopPropagation(); I.edit(d, l.visible ? 'Ocultar capa' : 'Mostrar capa', []); l.visible = !l.visible; IE.after(); } }, icon(l.visible ? 'eye' : 'eyeoff', 's'));
    let th;
    if (l.type === 'group') th = h('div', { class: 'tw', onclick: (e) => { e.stopPropagation(); l.open = l.open === false; renderLayers(); } }, icon(l.open === false ? 'chevr' : 'chevd', 's'));
    const lt = l.type === 'group' ? h('div', { class: 'lt', style: { display: 'grid', placeItems: 'center', background: 'var(--bg2)' } }, icon('folderl')) : l.type === 'adjust' ? h('div', { class: 'lt', style: { display: 'grid', placeItems: 'center', background: 'var(--bg2)' } }, icon('adjust')) : h('div', { class: 'lt' + (on && !IE.editMask ? ' act' : ''), onclick: (e) => { if (e.ctrlKey || e.metaKey) { e.stopPropagation(); IE.selFromLayer(l); } else { IE.editMask = false; } } }, thumbOf(l));
    const mt = l.mask ? h('div', { class: 'lt msk' + (on && IE.editMask ? ' act' : ''), 'data-tip': 'Máscara: clic para editar · Mayús+clic: activar/desactivar · Alt+clic: ver', style: { opacity: l.maskOn ? 1 : .35 }, onclick: (e) => { e.stopPropagation(); d.activeId = l.id; if (e.shiftKey) { I.edit(d, 'Máscara on/off', []); l.maskOn = !l.maskOn; IE.after(); return; } if (e.altKey) { IE.maskView = !IE.maskView; } IE.editMask = true; renderLayers(); updateStatus(); IE.render(); } }, thumbOf(l, true)) : null;
    const nm = h('div', { class: 'nm' }, l.name);
    const row = h('div', { class: 'ly' + (on ? ' on' : ''), draggable: true, style: { paddingLeft: 6 + depth * 14 + 'px' } }, eye, th || h('div', { class: 'tw' }), lt, mt, nm,
      l.type === 'text' ? h('span', { class: 'ic' }, icon('text', 's')) : null, I.hasFx(l) ? h('span', { class: 'ic', 'data-tip': 'Estilos de capa', onclick: (e) => { e.stopPropagation(); d.activeId = l.id; IE.layerStyleDialog(); } }, icon('fx', 's')) : null, l.locked ? h('span', { class: 'ic' }, icon('lock', 's')) : null,
      l.blend !== 'source-over' || l.opacity < 1 ? h('span', { class: 'ic small' }, Math.round(l.opacity * 100) + '%') : null);
    row.addEventListener('click', () => { if (d.activeId !== l.id) { IE.commitPending(); d.activeId = l.id; IE.editMask = false; renderLayers(); renderOpt(); IE.render(); } });
    row.addEventListener('dblclick', (e) => { if (e.target === nm) { const inp = h('input', { type: 'text', value: l.name, style: { width: '100%' } }); nm.replaceWith(inp); inp.focus(); inp.select(); const done = () => { if (inp.value && inp.value !== l.name) { I.edit(d, 'Renombrar capa', []); l.name = inp.value; } IE.after(); }; inp.addEventListener('blur', done); inp.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = l.name; inp.blur(); } }); } else if (l.type === 'adjust') IE.editAdjLayer(l); else if (l.type === 'text') { IE.setTool('text'); IE.editText(l); } else IE.layerStyleDialog(); });
    row.addEventListener('contextmenu', (e) => { e.preventDefault(); d.activeId = l.id; renderLayers(); FP.menu({ x: e.clientX, y: e.clientY }, IE.layerMenu()); });
    row.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/fp-layer', l.id); e.dataTransfer.effectAllowed = 'move'; });
    row.addEventListener('dragover', (e) => { if (!Array.from(e.dataTransfer.types).includes('text/fp-layer')) return; e.preventDefault(); const r = row.getBoundingClientRect(); const y = (e.clientY - r.top) / r.height; row.classList.remove('dragover-a', 'dragover-b', 'dragover-in'); row._pos = l.type === 'group' && y > .3 && y < .7 ? 'in' : y < .5 ? 'b' : 'a'; row.classList.add('dragover-' + row._pos); });
    row.addEventListener('dragleave', () => row.classList.remove('dragover-a', 'dragover-b', 'dragover-in'));
    row.addEventListener('drop', (e) => { e.preventDefault(); row.classList.remove('dragover-a', 'dragover-b', 'dragover-in'); const id = e.dataTransfer.getData('text/fp-layer'); if (id && id !== l.id) IE.moveLayer(id, l.id, row._pos); });
    return row;
  }
  function renderLyOpts() {
    const box = el.lyopts; if (!box) return; box.innerHTML = ''; const l = IE.active(); if (!l) return; const d = IE.d;
    const op = h('input', { type: 'number', min: 0, max: 100, value: Math.round(l.opacity * 100) }); let opT = 0;
    op.addEventListener('input', () => { if (!opT) I.edit(d, 'Opacidad', []); clearTimeout(opT); opT = setTimeout(() => { opT = 0; renderLayers(); }, 800); l.opacity = FP.clamp(+op.value / 100, 0, 1); IE.dirtyComp(); });
    box.append(h('select', { 'data-tip': 'Modo de fusión', onchange: (e) => { I.edit(d, 'Modo de fusión', []); l.blend = e.target.value; IE.after(); } }, I.BLENDS.map(([v, n]) => h('option', { value: v, selected: l.blend === v }, n))), h('span', { class: 'small muted' }, 'Opac.'), op,
      h('button', { class: 'ibtn' + (l.locked ? ' on' : ''), 'data-tip': 'Bloquear capa', onclick: () => { I.edit(d, l.locked ? 'Desbloquear' : 'Bloquear', []); l.locked = !l.locked; IE.after(); } }, icon('lock', 's')));
  }
  let histT = 0; function renderHistorySoon() { clearTimeout(histT); histT = setTimeout(renderHistory, 150); }
  function renderHistory() {
    const box = el.hist; if (!box) return; box.innerHTML = ''; if (!IE.d) return;
    const u = I.history.undo, r = I.history.redo;
    box.appendChild(h('div', { class: 'li' + (u.length ? '' : ' cur'), onclick: () => { while (I.history.undo.length) I.undo(IE.d); IE.after(); } }, 'Abrir / estado inicial'));
    u.forEach((x, i) => box.appendChild(h('div', { class: 'li' + (i === u.length - 1 ? ' cur' : ''), onclick: () => { let n = u.length - 1 - i; while (n-- > 0) I.undo(IE.d); IE.after(); } }, x.label)));
    r.slice().reverse().forEach((x, i) => box.appendChild(h('div', { class: 'li fut', onclick: () => { let n = i + 1; while (n-- > 0) I.redo(IE.d); IE.after(); } }, x.label)));
    box.scrollTop = box.scrollHeight;
  }
  IE.renderHistory = renderHistory;

  /* ---------- operaciones de capa ---------- */
  function insertAbove(l, ref) {
    const d = IE.d; const a = ref ? I.find(d, ref.id) : I.find(d, d.activeId);
    if (a && a.l.type === 'group' && a.l.open !== false && !ref) a.l.children.push(l); else if (a) a.list.splice(a.list.indexOf(a.l) + 1, 0, l); else d.layers.push(l);
    d.activeId = l.id; IE.editMask = false; IE.after(); renderOpt();
  }
  IE.insertAbove = insertAbove;
  IE.addLayer = function (canvas, name, x, y, label) { const d = IE.d; const l = I.newLayer(d, name, canvas, x, y); I.edit(d, label || 'Nueva capa', []); insertAbove(l); return l; };
  IE.newLayer = () => { const d = IE.d; if (!d) return; const n = I.flat(d).length + 1; IE.addLayer(FP.canvas(d.w, d.h), 'Capa ' + n); };
  IE.duplicateLayer = function () {
    const d = IE.d; const l = IE.active(); if (!l) return; I.edit(d, 'Duplicar capa', []);
    const dup = (x) => { const c = Object.assign({}, x, { id: FP.uid(), name: x.name + ' copia', canvas: x.canvas ? I.cloneCanvas(x.canvas) : x.canvas, mask: x.mask ? I.cloneCanvas(x.mask) : null }); if (c.mask) c.mask._ver = 1; if (x.text) c.text = Object.assign({}, x.text); if (x.fx) c.fx = JSON.parse(JSON.stringify(x.fx)); if (x.adj) c.adj = JSON.parse(JSON.stringify(x.adj)); if (x.children) c.children = x.children.map(dup); return c; };
    const f = I.find(d, l.id); const c = dup(l); f.list.splice(f.list.indexOf(l) + 1, 0, c); d.activeId = c.id; IE.after();
  };
  IE.deleteLayer = function () { const d = IE.d; const l = IE.active(); if (!l) return; if (I.flat(d).length <= 1) return FP.toast('El documento necesita al menos una capa', 'warn'); I.edit(d, 'Eliminar capa', []); const f = I.find(d, l.id); const i = f.list.indexOf(l); f.list.splice(i, 1); const nxt = f.list[Math.max(0, i - 1)] || f.parent || I.flat(d)[0]; d.activeId = nxt ? nxt.id : null; IE.after(); };
  IE.moveLayer = function (id, targetId, pos) {
    const d = IE.d; const a = I.find(d, id), b = I.find(d, targetId); if (!a || !b) return;
    let anc = b.parent; while (anc) { if (anc.id === id) return FP.toast('No puedes meter un grupo dentro de sí mismo', 'warn'); const f = I.find(d, anc.id); anc = f && f.parent; }
    I.edit(d, 'Reordenar capas', []); a.list.splice(a.list.indexOf(a.l), 1);
    if (pos === 'in') b.l.children.push(a.l); else { const list = b.list; const i = list.indexOf(b.l); list.splice(pos === 'b' ? i + 1 : i, 0, a.l); }
    IE.after();
  };
  IE.arrange = function (how) { const d = IE.d; const f = I.find(d, d.activeId); if (!f) return; const list = f.list, i = list.indexOf(f.l); let j = { front: list.length - 1, back: 0, up: Math.min(list.length - 1, i + 1), down: Math.max(0, i - 1) }[how]; if (j === i) return; I.edit(d, 'Organizar capas', []); list.splice(i, 1); list.splice(j, 0, f.l); IE.after(); };
  IE.groupLayers = function () { const d = IE.d; const l = IE.active(); I.edit(d, 'Agrupar', []); const g = { id: FP.uid(), type: 'group', name: 'Grupo ' + (I.flat(d).filter(x => x.type === 'group').length + 1), visible: true, locked: false, opacity: 1, blend: 'source-over', x: 0, y: 0, children: [], mask: null, maskOn: true, open: true, ver: 1 }; if (l) { const f = I.find(d, l.id); const i = f.list.indexOf(l); f.list.splice(i, 1, g); g.children.push(l); } else d.layers.push(g); d.activeId = g.id; IE.after(); };
  IE.ungroup = function () { const d = IE.d; const l = IE.active(); if (!l || l.type !== 'group') return FP.toast('Selecciona un grupo', 'warn'); I.edit(d, 'Desagrupar', []); const f = I.find(d, l.id); const i = f.list.indexOf(l); f.list.splice(i, 1, ...l.children); d.activeId = (l.children[l.children.length - 1] || f.list[0] || {}).id; IE.after(); };
  IE.selFromLayer = function (l) { const d = IE.d; if (!l.canvas) return; const m = FP.canvas(d.w, d.h); m.getContext('2d').drawImage(I.renderLayerDoc(d, Object.assign({}, l, { fx: null })), 0, 0); I.edit(d, 'Cargar selección', []); I.setSel(d, m); IE.after(); };

  /* ======================= Teclado ======================= */
  const toolKeys = {}; TOOLS.forEach(t => { if (t !== '-' && t[3]) (toolKeys[t[3].toLowerCase()] = toolKeys[t[3].toLowerCase()] || []).push(t[0]); });
  document.addEventListener('keydown', (e) => {
    if (FP.current !== 'img' || FP.$('.ovl') || FP.inField(e)) return; const d = IE.d; const m = FP.mod(e); const k = e.key.toLowerCase();
    if (e.code === 'Space' && !spaceDown) { spaceDown = true; el.stage.style.cursor = 'grab'; e.preventDefault(); return; }
    if (m && k === 'o') { e.preventDefault(); return e.shiftKey ? IE.placeDialog() : IE.openDialog(); }
    if (m && k === 'n') { e.preventDefault(); return e.shiftKey ? IE.newLayer() : IE.newDocDialog(); }
    if (!d) return;
    if (IE.tools[IE.tool] && IE.tools[IE.tool].key && IE.tools[IE.tool].key(e)) { e.preventDefault(); return; }
    if (IE.T && e.key === 'Enter') { e.preventDefault(); return IE.commitTransform(); }
    if (IE.T && e.key === 'Escape') { e.preventDefault(); return IE.cancelTransform(); }
    const act = IE.keymap(e, m, k); if (act) { e.preventDefault(); try { const r = act(); if (r && r.catch) r.catch(err => FP.error(err)); } catch (err) { FP.error(err); } return; }
    if (!m && !e.altKey && toolKeys[k]) { e.preventDefault(); const list = toolKeys[k]; const i = list.indexOf(IE.tool); IE.setTool(e.shiftKey && i >= 0 ? list[(i + 1) % list.length] : (i >= 0 ? IE.tool : list[0])); }
  });
  document.addEventListener('keyup', (e) => { if (e.code === 'Space') { spaceDown = false; if (IE.d) setCursor(); } });

  /* ======================= Registro ======================= */
  let built = false;
  FP.views.img = {
    show(root) { if (!built) { build(root); built = true; } if (IE.d) { IE.render(); renderLayers(); } },
    openFiles: (f) => IE.openFiles(f), openProject: (f) => IE.openProject(f), newDocDialog: () => IE.newDocDialog(), collageDialog: () => IE.collageDialog(), runTool: (id) => IE.runTool(id), restoreAutosave: (a) => IE.restoreAutosave(a),
    onDropFiles: (files) => { if (IE.d) return IE.placeFiles(Array.from(files)); return FP.openFiles(files, 'img'); },
  };
  let autoT = 0;
  function scheduleAutosave() { if (!FP.settings.autosave) return; clearTimeout(autoT); autoT = setTimeout(async () => { if (!IE.d || !FP.dirty.img || IE.d.w * IE.d.h * I.flat(IE.d).length > 80e6) return; try { const b = await IE.projectBlob(); await FP.db.put('autosave', { id: 'img', kind: 'img', name: IE.d.name, date: Date.now(), blob: b, thumb: FP.thumbDataURL(I.composite(IE.d), 200) }); } catch (e) { console.warn('autoguardado', e); } }, 20000); }
})();
