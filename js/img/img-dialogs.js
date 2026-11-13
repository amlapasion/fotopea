/* FOTOPEA · Editor de imágenes: menús, diálogos, ajustes, filtros, exportación y proyectos */
(function () {
  'use strict';
  const { h, icon } = FP; const I = window.IMGC; const F = window.IMGF; const IE = window.IMGE;
  const D = () => IE.d; const need = () => !IE.d;

  /* ======================= Abrir / nuevo ======================= */
  IE.openDialog = async () => { const f = await FP.pickFiles('image/*,.tif,.tiff,.svg,.fotopea', true); if (f.length) FP.openFiles(f, 'img'); };
  IE.placeDialog = async () => { const f = await FP.pickFiles('image/*,.tif,.tiff,.svg', true); if (f.length) IE.placeFiles(f); };
  async function loadCanvas(file) {
    const t = await FP.sniff(file); let opts = {};
    if (t === 'svg') { const v = await FP.dialog('Rasterizar SVG: ' + file.name, [{ type: 'note', text: 'El SVG se convierte en píxeles. Elige la escala para conservar la nitidez. Los scripts del SVG no se ejecutan.' }, { key: 's', type: 'select', label: 'Escala', value: '2', options: [['1', '100 %'], ['2', '200 %'], ['4', '400 %'], ['8', '800 %']] }], { icon: 'image' }); if (!v) return null; opts.svgScale = +v.s; }
    const c = await FP.loadImageFile(file, opts); if (c._info) FP.toast(c._info, 'warn', 6000); return c;
  }
  IE.openFiles = async function (files) {
    files = Array.from(files); if (!files.length) return;
    if (IE.d) {
      const ch = await FP.modal({ title: 'Abrir imágenes', icon: 'image', body: h('div', null, '¿Cómo quieres abrir ' + files.map(f => f.name).join(', ') + '?'), buttons: [{ label: 'Cancelar', value: null }, { label: 'Como documento nuevo', value: 'new' }, { label: 'Añadir como capas', value: 'layers', primary: true }] });
      if (!ch) return; if (ch === 'layers') return IE.placeFiles(files); if (!await IE.confirmDiscard()) return;
    }
    const p = FP.progress('Abriendo ' + files[0].name);
    try {
      p.close(); const c = await loadCanvas(files[0]); if (!c) return;
      if (c.width * c.height > FP.LIMITS.warnPixels) FP.toast(`Imagen muy grande (${c.width}×${c.height}). Algunas operaciones pueden ser lentas.`, 'warn', 6000);
      const d = I.newDoc(c.width, c.height, files[0].name, 'transparent'); d.layers[0].canvas = c; d.layers[0].name = 'Fondo';
      IE.setDoc(d); IE.setTool(IE.tool === 'crop' ? 'move' : IE.tool);
      FP.addRecent(files[0], 'img', FP.thumbDataURL(c, 200));
      if (files.length > 1) await IE.placeFiles(files.slice(1));
    } catch (e) { p.close(); FP.error(e, 'No se pudo abrir la imagen'); }
  };
  IE.placeFiles = async function (files) {
    const d = IE.d; if (!d) return IE.openFiles(files);
    for (const f of files) {
      const t = await FP.sniff(f); if (t === 'project') { await IE.openProject(f); continue; } if (t === 'pdf') { FP.toast('FOTOPEA no abre PDF: ' + f.name, 'warn'); continue; }
      try { let c = await loadCanvas(f); if (!c) continue; let s = Math.min(1, d.w / c.width, d.h / c.height); if (s < 1) c = I.resample(c, c.width * s, c.height * s); IE.addLayer(c, FP.baseName(f.name), Math.round((d.w - c.width) / 2), Math.round((d.h - c.height) / 2), 'Colocar imagen'); }
      catch (e) { FP.error(e, f.name); }
    }
  };
  const DOC_PRESETS = [['custom', 'Personalizado'], ['1920x1080', 'Full HD 1920×1080'], ['3840x2160', '4K 3840×2160'], ['1080x1080', 'Instagram 1080×1080'], ['1080x1350', 'Instagram vertical 1080×1350'], ['1080x1920', 'Historia 1080×1920'], ['1280x720', 'YouTube miniatura 1280×720'], ['2480x3508', 'A4 300 ppp (2480×3508)'], ['1240x1754', 'A4 150 ppp'], ['800x600', '800×600']];
  IE.newDocDialog = async function (pre) {
    if (!await IE.confirmDiscard()) return;
    const v = await FP.dialog('Nuevo documento', [{ key: 'name', label: 'Nombre', value: 'Sin título' }, { key: 'preset', type: 'select', label: 'Plantilla', value: pre || '1920x1080', options: DOC_PRESETS },
      { key: 'w', type: 'number', label: 'Ancho (px)', value: 1920, min: 1, max: 16000, half: true, show: v => v.preset === 'custom' }, { key: 'h', type: 'number', label: 'Alto (px)', value: 1080, min: 1, max: 16000, half: true, show: v => v.preset === 'custom' },
      { key: 'dpi', type: 'number', label: 'Resolución (ppp)', value: 72, min: 1, max: 2400 }, { key: 'bg', type: 'select', label: 'Fondo', value: '#ffffff', options: [['#ffffff', 'Blanco'], ['#000000', 'Negro'], ['transparent', 'Transparente'], ['fg', 'Color frontal'], ['bgc', 'Color de fondo']] }], { icon: 'plus', ok: 'Crear' });
    if (!v) return; let [w, hh] = v.preset === 'custom' ? [v.w, v.h] : v.preset.split('x').map(Number);
    w = FP.clamp(Math.round(w), 1, 16000); hh = FP.clamp(Math.round(hh), 1, 16000); if (w * hh > FP.LIMITS.maxPixels / 2) return FP.toast('Tamaño demasiado grande', 'err');
    const d = I.newDoc(w, hh, v.name, v.bg === 'fg' ? IE.fg : v.bg === 'bgc' ? IE.bg : v.bg); d.dpi = v.dpi || 72; IE.setDoc(d);
  };
  IE.close = async () => { if (!await IE.confirmDiscard()) return; IE.cancelAll(); IE.d = null; I.resetHistory(); FP.dirty.img = false; FP.db.del('autosave', 'img'); IE.renderEmpty(); };

  /* ======================= Portapapeles ======================= */
  IE.copy = async function (merged, cut) {
    const d = IE.d; const l = IE.active(); if (!merged && (!l || !l.canvas || l.type === 'group')) return FP.toast('Selecciona una capa de píxeles', 'warn');
    const src = merged ? I.composite(d) : I.renderLayerDoc(d, Object.assign({}, l, { fx: null })); const b = I.selBounds(d) || { x: 0, y: 0, w: d.w, h: d.h };
    const c = FP.canvas(b.w, b.h); const x = c.getContext('2d'); x.drawImage(src, -b.x, -b.y); if (d.sel) { x.globalCompositeOperation = 'destination-in'; x.drawImage(d.sel, -b.x, -b.y); }
    IE.clip = { c, x: b.x, y: b.y };
    try { const blob = await FP.toBlob(c, 'image/png'); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); } catch (e) { }
    if (cut && !merged) IE.clearSel('Cortar'); else FP.toast('Copiado');
  };
  IE.paste = async function () {
    const d = IE.d; if (!d) return;
    if (IE.clip) { const c = I.cloneCanvas(IE.clip.c); IE.addLayer(c, 'Pegado', IE.clip.x, IE.clip.y, 'Pegar'); return; }
    try { const items = await navigator.clipboard.read(); for (const it of items) { const t = it.types.find(x => x.startsWith('image/')); if (t) { const b = await it.getType(t); return IE.placeFiles([new File([b], 'pegado.png', { type: t })]); } } } catch (e) { }
    FP.toast('El portapapeles no contiene una imagen', 'warn');
  };
  document.addEventListener('paste', (e) => {
    if (FP.current !== 'img' || FP.inField(e)) return; const f = Array.from(e.clipboardData.files || []).filter(f => f.type.startsWith('image/')); if (!f.length) return;
    e.preventDefault(); IE.clip = null; if (IE.d) IE.placeFiles(f); else IE.openFiles(f);
  });
  IE.clearSel = function (label) {
    const d = IE.d; const l = IE.active(); if (!l) return;
    if (IE.editMask && l.mask) { I.edit(d, label || 'Borrar', [l], { mask: true }); const x = l.mask.getContext('2d'); if (d.sel) { const t = FP.canvas(l.mask.width, l.mask.height); const tx = t.getContext('2d'); tx.drawImage(d.sel, -l.x, -l.y); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#000'; tx.fillRect(0, 0, t.width, t.height); x.drawImage(t, 0, 0); } else { x.fillStyle = '#000'; x.fillRect(0, 0, l.mask.width, l.mask.height); } I.touchMask(l); IE.after(); return; }
    if (!IE.needRaster(l, 'borrar')) return; if (!d.sel) return FP.toast('No hay selección. Usa Ctrl+A para seleccionar todo.', 'warn');
    I.edit(d, label || 'Borrar', [l]); const x = l.canvas.getContext('2d'); x.globalCompositeOperation = 'destination-out'; x.drawImage(d.sel, -l.x, -l.y); x.globalCompositeOperation = 'source-over'; l.ver++; IE.after();
  };
  IE.fillDialog = async function (quick) {
    const d = IE.d; const l = IE.active(); if (!IE.needRaster(l, 'rellenar')) return;
    const v = quick ? { what: quick, opacity: 100, keep: false } : await FP.dialog('Rellenar', [{ key: 'what', type: 'select', label: 'Contenido', value: 'fg', options: [['fg', 'Color frontal'], ['bg', 'Color de fondo'], ['white', 'Blanco'], ['black', 'Negro'], ['gray', 'Gris 50 %'], ['aware', 'Según contenido (eliminar objeto)']] }, { key: 'opacity', type: 'range', label: 'Opacidad', value: 100, min: 1, max: 100, unit: ' %' }, { key: 'keep', type: 'checkbox', label: 'Conservar transparencia', value: false }], { icon: 'bucket' });
    if (!v) return; if (v.what === 'aware') { if (!d.sel) return FP.toast('Selecciona primero la zona a rellenar', 'warn'); return IE.contentAwareFill(); }
    const col = { fg: IE.fg, bg: IE.bg, white: '#ffffff', black: '#000000', gray: '#808080' }[v.what];
    I.ensureCovers(d, l); I.edit(d, 'Rellenar', [l]); const t = FP.canvas(d.w, d.h); const tx = t.getContext('2d'); tx.fillStyle = col; tx.fillRect(0, 0, d.w, d.h); if (d.sel) { tx.globalCompositeOperation = 'destination-in'; tx.drawImage(d.sel, 0, 0); }
    const x = l.canvas.getContext('2d'); x.globalAlpha = v.opacity / 100; x.globalCompositeOperation = v.keep ? 'source-atop' : 'source-over'; x.drawImage(t, -l.x, -l.y); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; l.ver++; IE.after();
  };
  IE.strokeSelDialog = async function () {
    const d = IE.d; const l = IE.active(); if (!d.sel) return FP.toast('Necesitas una selección', 'warn'); if (!IE.needRaster(l)) return;
    const v = await FP.dialog('Contornear selección', [{ key: 'w', type: 'number', label: 'Grosor (px)', value: 4, min: 1, max: 200 }, { key: 'color', type: 'color', label: 'Color', value: IE.fg }, { key: 'pos', type: 'select', label: 'Posición', value: 'center', options: [['inside', 'Interior'], ['center', 'Centro'], ['outside', 'Exterior']] }], { icon: 'pen' });
    if (!v) return; const a = I.alphaArray(d.sel).map(x => x >= 128 ? 255 : 0); const r = Math.max(1, Math.round(v.w / (v.pos === 'center' ? 2 : 1)));
    const outer = v.pos === 'inside' ? a : I.morph(a, d.w, d.h, r, true), inner = v.pos === 'outside' ? a : I.morph(a, d.w, d.h, r, false);
    const ring = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) ring[i] = outer[i] && !inner[i] ? 255 : 0;
    const t = I.maskToCanvas(ring, d.w, d.h); const tx = t.getContext('2d'); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = v.color; tx.fillRect(0, 0, d.w, d.h);
    I.ensureCovers(d, l); I.edit(d, 'Contornear', [l]); l.canvas.getContext('2d').drawImage(t, -l.x, -l.y); l.ver++; IE.after();
  };
  IE.contentAwareFill = async function () { const d = IE.d; const l = IE.active(); if (!d.sel) return FP.toast('Selecciona primero el objeto a eliminar (lazo, rectángulo…)', 'warn'); if (!IE.needRaster(l)) return; const m = I.cloneCanvas(d.sel); const a = I.alphaArray(m); const e = I.morph(a.map(v => v > 20 ? 255 : 0), d.w, d.h, 2, true); await IE.fillMaskContent(l, I.maskToCanvas(e, d.w, d.h), 'Relleno según contenido'); };

  /* ======================= Selección ======================= */
  IE.selectAll = () => { const d = IE.d; I.edit(d, 'Seleccionar todo', []); I.setSel(d, I.shapeMask(d, x => x.fillRect(0, 0, d.w, d.h))); IE.after(); };
  IE.selectNone = () => { const d = IE.d; if (!d.sel) return; IE.lastSel = d.sel; I.edit(d, 'Deseleccionar', []); I.setSel(d, null); IE.after(); };
  IE.reselect = () => { if (!IE.lastSel) return; I.edit(D(), 'Volver a seleccionar', []); I.setSel(D(), IE.lastSel); IE.after(); };
  IE.selInvert = () => { const d = IE.d; const n = I.shapeMask(d, x => x.fillRect(0, 0, d.w, d.h)); if (d.sel) { const x = n.getContext('2d'); x.globalCompositeOperation = 'destination-out'; x.drawImage(d.sel, 0, 0); } I.edit(d, 'Invertir selección', []); I.setSel(d, n); if (!I.selBounds(d)) I.setSel(d, null); IE.after(); };
  IE.selModify = async function (op) {
    const d = IE.d; if (!d.sel) return FP.toast('No hay selección', 'warn');
    const v = await FP.dialog({ expand: 'Expandir selección', contract: 'Contraer selección', feather: 'Desvanecer selección', smooth: 'Suavizar selección' }[op], [{ key: 'r', type: 'number', label: 'Radio (px)', value: op === 'feather' ? 10 : 4, min: 1, max: 300 }], { icon: 'marquee' });
    if (!v) return; let c;
    if (op === 'feather') c = I.blurAlpha(d.sel, v.r);
    else if (op === 'smooth') { const b = I.blurAlpha(d.sel, v.r); const a = I.alphaArray(b).map(x => x >= 128 ? 255 : 0); c = I.maskToCanvas(a, d.w, d.h); }
    else { const a = I.alphaArray(d.sel); c = I.maskToCanvas(I.morph(a, d.w, d.h, Math.round(v.r), op === 'expand'), d.w, d.h); }
    I.edit(d, 'Modificar selección', []); I.setSel(d, c); if (!I.selBounds(d)) I.setSel(d, null); IE.after();
  };
  IE.colorRange = async function () {
    const d = IE.d; const img = I.composite(d).getContext('2d', { willReadFrequently: true }).getImageData(0, 0, d.w, d.h); let mask = null;
    const v = await FP.dialog('Gama de colores', [{ type: 'note', text: 'Selecciona todos los píxeles parecidos a un color (usa el cuentagotas antes para elegir el color frontal).' }, { key: 'color', type: 'color', label: 'Color', value: IE.fg }, { key: 'tol', type: 'range', label: 'Tolerancia', value: 40, min: 1, max: 200 }, { key: 'mode', type: 'select', label: 'Modo', value: 'new', options: [['new', 'Nueva selección'], ['add', 'Añadir'], ['sub', 'Restar']] }],
      { icon: 'color', onChange: (vv) => { prev(vv); }, onOpen: (m, form) => prev(form.values()) });
    function prev(vv) { const [r, g, b] = F.hexToRgb(vv.color); const dd = img.data; const t = vv.tol * vv.tol * 3; const a = new Uint8Array(d.w * d.h); for (let i = 0; i < a.length; i++) { const k = i * 4; const x = (dd[k] - r) ** 2 + (dd[k + 1] - g) ** 2 + (dd[k + 2] - b) ** 2; a[i] = x <= t ? 255 : x <= t * 2 ? Math.round(255 * (1 - (x - t) / t)) : 0; } mask = I.maskToCanvas(a, d.w, d.h); const ov = FP.canvas(d.w, d.h); const ox = ov.getContext('2d'); ox.drawImage(mask, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = 'rgba(255,50,50,.6)'; ox.fillRect(0, 0, d.w, d.h); IE.overlayCanvas = ov; IE.render(); }
    IE.overlayCanvas = null; if (!v || !mask) { IE.render(); return; }
    I.edit(d, 'Gama de colores', []); I.combineSel(d, mask, v.mode); IE.after();
  };
  IE.autoSubject = function (background) {
    const d = IE.d; const m = IE.objectMask({ x: 0, y: 0, w: d.w, h: d.h }, 40);
    if (!m) return FP.toast('No se distinguió el sujeto del fondo. Usa la varita mágica o el lazo.', 'warn');
    I.edit(d, background ? 'Seleccionar fondo' : 'Seleccionar sujeto', []); I.setSel(d, m); if (background) { IE.after(); return IE.selInvert(); } IE.after();
  };

  /* ======================= Máscaras y estilos ======================= */
  IE.maskOp = function (op) {
    const d = IE.d; const l = IE.active(); if (!l) return; if (l.type === 'text' && op !== 'delete') return FP.toast('Rasteriza la capa de texto antes de añadir una máscara', 'warn');
    if (op === 'reveal' || op === 'hide' || op === 'sel') {
      if (l.mask) return FP.toast('La capa ya tiene máscara', 'warn'); I.edit(d, 'Añadir máscara', []);
      if (l.type === 'group' || l.type === 'adjust') { l.canvas = l.canvas || null; const m = FP.canvas(d.w, d.h); const x = m.getContext('2d'); x.fillStyle = op === 'hide' ? '#000' : '#fff'; x.fillRect(0, 0, d.w, d.h); if (op === 'sel' && d.sel) { x.fillStyle = '#000'; x.fillRect(0, 0, d.w, d.h); const t = FP.canvas(d.w, d.h); const tx = t.getContext('2d'); tx.drawImage(d.sel, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#fff'; tx.fillRect(0, 0, d.w, d.h); x.drawImage(t, 0, 0); } m._ver = 1; l.mask = m; l.maskOn = true; l.x = l.x || 0; l.y = l.y || 0; }
      else I.addMask(d, l, op === 'sel' && d.sel, op === 'hide');
      IE.editMask = true; IE.after(); return;
    }
    if (!l.mask) return FP.toast('La capa no tiene máscara', 'warn');
    if (op === 'delete') { I.edit(d, 'Eliminar máscara', []); l.mask = null; IE.editMask = false; }
    else if (op === 'toggle') { I.edit(d, 'Máscara on/off', []); l.maskOn = !l.maskOn; }
    else if (op === 'invert') { I.edit(d, 'Invertir máscara', [l], { mask: true }); const x = l.mask.getContext('2d'); x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, l.mask.width, l.mask.height); x.globalCompositeOperation = 'source-over'; I.touchMask(l); }
    else if (op === 'apply') { if (l.type !== 'raster') return FP.toast('Solo en capas de píxeles', 'warn'); I.edit(d, 'Aplicar máscara', [l]); const x = l.canvas.getContext('2d'); x.globalCompositeOperation = 'destination-in'; x.drawImage(I.maskAlpha(l), 0, 0); x.globalCompositeOperation = 'source-over'; l.mask = null; IE.editMask = false; }
    else if (op === 'edit') { IE.editMask = !IE.editMask; }
    IE.after(); IE.updateStatus();
  };
  IE.layerStyleDialog = async function () {
    const d = IE.d; const l = IE.active(); if (!l || l.type === 'group' || l.type === 'adjust') return FP.toast('Selecciona una capa de píxeles o de texto', 'warn');
    const orig = l.fx ? JSON.parse(JSON.stringify(l.fx)) : null; const fx = l.fx || {};
    const s = Object.assign({ on: false, color: '#000000', opacity: .6, blur: 12, dx: 8, dy: 8 }, fx.shadow), g = Object.assign({ on: false, color: '#ffe066', opacity: .9, size: 20 }, fx.glow), st = Object.assign({ on: false, color: '#ffffff', width: 4, opacity: 1 }, fx.stroke), ov = Object.assign({ on: false, color: '#ff6b3d', opacity: .5 }, fx.overlay);
    const apply = (v) => { l.fx = { shadow: { on: v.s_on, color: v.s_color, opacity: v.s_op / 100, blur: v.s_blur, dx: v.s_dx, dy: v.s_dy }, glow: { on: v.g_on, color: v.g_color, opacity: v.g_op / 100, size: v.g_size }, stroke: { on: v.t_on, color: v.t_color, width: v.t_w, opacity: v.t_op / 100 }, overlay: { on: v.o_on, color: v.o_color, opacity: v.o_op / 100 } }; l.ver++; IE.dirtyComp(); };
    const v = await FP.dialog('Estilo de capa · ' + l.name, [
      { type: 'note', text: 'Efectos no destructivos: puedes cambiarlos o quitarlos en cualquier momento.' },
      { key: 's_on', type: 'checkbox', label: 'Sombra paralela', value: s.on }, { key: 's_color', type: 'color', label: 'Color', value: s.color, half: true, show: v => v.s_on }, { key: 's_op', type: 'range', label: 'Opacidad', value: s.opacity * 100, min: 0, max: 100, unit: ' %', half: true, show: v => v.s_on }, { key: 's_blur', type: 'range', label: 'Desenfoque', value: s.blur, min: 0, max: 100, half: true, show: v => v.s_on }, { key: 's_dx', type: 'range', label: 'Desplaz. X', value: s.dx, min: -100, max: 100, half: true, show: v => v.s_on }, { key: 's_dy', type: 'range', label: 'Desplaz. Y', value: s.dy, min: -100, max: 100, show: v => v.s_on },
      { key: 'g_on', type: 'checkbox', label: 'Resplandor exterior', value: g.on }, { key: 'g_color', type: 'color', label: 'Color', value: g.color, half: true, show: v => v.g_on }, { key: 'g_op', type: 'range', label: 'Opacidad', value: g.opacity * 100, min: 0, max: 100, unit: ' %', half: true, show: v => v.g_on }, { key: 'g_size', type: 'range', label: 'Tamaño', value: g.size, min: 1, max: 150, show: v => v.g_on },
      { key: 't_on', type: 'checkbox', label: 'Trazo (contorno)', value: st.on }, { key: 't_color', type: 'color', label: 'Color', value: st.color, half: true, show: v => v.t_on }, { key: 't_w', type: 'range', label: 'Grosor', value: st.width, min: 1, max: 50, half: true, show: v => v.t_on }, { key: 't_op', type: 'range', label: 'Opacidad', value: st.opacity * 100, min: 0, max: 100, unit: ' %', show: v => v.t_on },
      { key: 'o_on', type: 'checkbox', label: 'Superposición de color', value: ov.on }, { key: 'o_color', type: 'color', label: 'Color', value: ov.color, half: true, show: v => v.o_on }, { key: 'o_op', type: 'range', label: 'Opacidad', value: ov.opacity * 100, min: 0, max: 100, unit: ' %', half: true, show: v => v.o_on },
    ], { icon: 'fx', size: 'wide', onChange: apply });
    const now = l.fx; l.fx = orig; l.ver++;
    if (!v) { IE.dirtyComp(); return; }
    I.edit(d, 'Estilo de capa', []); apply(v); l.fx = Object.assign({}, l.fx); IE.after();
  };

  /* ======================= Ajustes y filtros con vista previa ======================= */
  function previewOn(l, fn) {
    const d = IE.d; const onMask = false; let busy = false, pend = null; const base = l.canvas; const selL = I.selLocal(d, l);
    const run = (params) => {
      pend = params; if (busy) return; busy = true;
      requestAnimationFrame(() => { const p = pend; pend = null; try { const x = base.getContext('2d', { willReadFrequently: true }); const id = x.getImageData(0, 0, base.width, base.height); const r = fn(id, p) || id; const c = FP.canvas(base.width, base.height); const cx = c.getContext('2d'); cx.putImageData(r, 0, 0); if (selL) { cx.globalCompositeOperation = 'destination-in'; cx.drawImage(selL, 0, 0); const o = FP.canvas(base.width, base.height); const ox = o.getContext('2d'); ox.drawImage(base, 0, 0); ox.globalCompositeOperation = 'destination-out'; ox.drawImage(selL, 0, 0); ox.globalCompositeOperation = 'source-over'; ox.drawImage(c, 0, 0); IE.live = { id: l.id, canvas: o }; } else IE.live = { id: l.id, canvas: c }; IE.dirtyComp(); } catch (e) { FP.error(e); } busy = false; if (pend) run(pend); });
    };
    return { run, stop: () => { IE.live = null; IE.dirtyComp(); } };
  }
  function paramFields(def, vals) {
    return def.params.map(([k, label, min, max, dv, step]) => {
      if (min === 'bool') return { key: k, type: 'checkbox', label, value: vals[k] };
      if (min === 'color') return { key: k, type: 'color', label, value: vals[k] };
      if (Array.isArray(min)) return { key: k, type: 'select', label, value: vals[k], options: min.map(o => [o, { zoom: 'Zoom', spin: 'Giro', horizontal: 'Horizontal', vertical: 'Vertical', ambas: 'Ambas' }[o] || o]) };
      return { key: k, type: 'range', label, value: vals[k], min, max, step: step || 1 };
    });
  }
  IE.adjustDialog = async function (kind) {
    const d = IE.d; const l = IE.active(); const onMask = IE.editMask && l && l.mask; if (!onMask && !IE.needRaster(l, 'aplicar ajustes')) return;
    if (kind === 'invert' || kind === 'autoLevels' || kind === 'autoWhiteBalance') { I.applyPixels(d, l, (id) => F.adjust[kind](id, {}), { invert: 'Invertir', autoLevels: 'Tono automático', autoWhiteBalance: 'Balance de blancos automático' }[kind], onMask); IE.after(); return; }
    const def = F.ADJ_DEFS[kind]; const vals = F.defaults(kind);
    const pv = previewOn(l, (id, p) => F.adjust[kind](id, p));
    let curveEd = null; const extra = [];
    if (kind === 'curves') { curveEd = curveEditor(vals, () => pv.run(Object.assign({}, vals))); extra.push({ type: 'node', node: curveEd }); }
    if (kind === 'levels') extra.push({ type: 'node', node: histogramEl(l) });
    const v = await FP.dialog(def.name, extra.concat(paramFields(def, vals), [{ type: 'note', text: d.sel ? 'Se aplica solo a la selección.' : 'Para un ajuste no destructivo usa Capa › Nueva capa de ajuste.' }]), { icon: 'adjust', size: kind === 'curves' ? 'wide' : '', onChange: (vv) => pv.run(Object.assign(vals, vv)), onOpen: () => pv.run(vals) });
    pv.stop(); if (!v) return;
    Object.assign(vals, v); I.applyPixels(d, l, (id) => F.adjust[kind](id, vals), def.name, onMask); IE.lastFilter = null; IE.after();
  };
  IE.filterDialog = async function (key, repeat) {
    const d = IE.d; const l = IE.active(); if (!IE.needRaster(l, 'aplicar filtros')) return; const f = F.filters[key];
    const vals = repeat && IE.lastFilter && IE.lastFilter.key === key ? IE.lastFilter.vals : Object.fromEntries(f.params.map(p => [p[0], p[4]]));
    if (!repeat) {
      const pv = previewOn(l, (id, p) => f.fn(id, p));
      const v = await FP.dialog(f.name, paramFields(f, vals).concat([{ type: 'note', text: 'Vista previa en el lienzo. ' + (d.sel ? 'Se aplica solo a la selección.' : '') }]), { icon: 'fx', onChange: (vv) => pv.run(Object.assign(vals, vv)), onOpen: () => pv.run(vals) });
      pv.stop(); if (!v) return; Object.assign(vals, v);
    }
    await FP.busy('Aplicando ' + f.name + '…', async () => { I.applyPixels(d, l, (id) => f.fn(id, vals), f.name); });
    IE.lastFilter = { key, vals }; IE.after();
  };
  function histogramEl(l) {
    const c = FP.canvas(256, 80); c.style.cssText = 'width:100%;height:80px;background:var(--bg2);border-radius:6px;margin-bottom:10px';
    const id = l.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, l.canvas.width, l.canvas.height); const hs = F.histogram(id)[3]; const mx = Math.max(...hs) || 1;
    const x = c.getContext('2d'); x.fillStyle = '#9aa0a8'; for (let i = 0; i < 256; i++) { const hh = Math.sqrt(hs[i] / mx) * 80; x.fillRect(i, 80 - hh, 1, hh); } return c;
  }
  function curveEditor(vals, onChange) {
    const S = 256; const c = FP.canvas(S, S); c.className = 'curve'; c.style.width = '256px'; c.style.height = '256px';
    let ch = 'rgb'; const pts = { rgb: vals.points, r: [[0, 0], [255, 255]], g: [[0, 0], [255, 255]], b: [[0, 0], [255, 255]] };
    const draw = () => {
      const x = c.getContext('2d'); x.clearRect(0, 0, S, S); x.strokeStyle = 'rgba(128,128,128,.35)'; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, S); x.moveTo(0, i * 64); x.lineTo(S, i * 64); x.stroke(); }
      x.strokeStyle = 'rgba(128,128,128,.6)'; x.beginPath(); x.moveTo(0, S); x.lineTo(S, 0); x.stroke();
      const lut = F.curveLut(pts[ch]); x.strokeStyle = { rgb: '#e7e8ea', r: '#ff5c5c', g: '#3ecf8e', b: '#4aa3ff' }[ch]; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 256; i++) i ? x.lineTo(i, S - lut[i]) : x.moveTo(i, S - lut[i]); x.stroke(); x.lineWidth = 1;
      x.fillStyle = '#ff6b3d'; pts[ch].forEach(p => { x.beginPath(); x.arc(p[0], S - p[1], 5, 0, 7); x.fill(); });
    };
    const emit = () => { vals.points = pts.rgb; vals.r = ch === 'rgb' && pts.r.length === 2 ? pts.r : pts.r; vals.g = pts.g; vals.b = pts.b; ['r', 'g', 'b'].forEach(k => { if (pts[k].length === 2 && pts[k][0][1] === 0 && pts[k][1][1] === 255) vals[k] = null; }); draw(); onChange(); };
    c.addEventListener('pointerdown', (e) => {
      const r = c.getBoundingClientRect(); const pos = (ev) => [FP.clamp((ev.clientX - r.left) * S / r.width, 0, 255), FP.clamp(S - (ev.clientY - r.top) * S / r.height, 0, 255)];
      const p = pos(e); const P = pts[ch]; let i = P.findIndex(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 10);
      if (i < 0) { P.push(p); P.sort((a, b) => a[0] - b[0]); i = P.indexOf(p); }
      if (e.button === 2 || e.altKey) { if (i > 0 && i < P.length - 1) P.splice(i, 1); emit(); return; }
      c.setPointerCapture(e.pointerId); const pt = P[i];
      const mv = (ev) => { const q = pos(ev); const lo = i > 0 ? P[i - 1][0] + 1 : 0, hi = i < P.length - 1 ? P[i + 1][0] - 1 : 255; pt[0] = i === 0 ? Math.min(q[0], hi) : i === P.length - 1 ? Math.max(q[0], lo) : FP.clamp(q[0], lo, hi); pt[1] = q[1]; emit(); };
      const up = () => { c.removeEventListener('pointermove', mv); c.removeEventListener('pointerup', up); }; c.addEventListener('pointermove', mv); c.addEventListener('pointerup', up);
    });
    c.addEventListener('contextmenu', e => e.preventDefault());
    const sel = h('select', { onchange: (e) => { ch = e.target.value; draw(); } }, [['rgb', 'RGB'], ['r', 'Rojo'], ['g', 'Verde'], ['b', 'Azul']].map(([v, l]) => h('option', { value: v }, l)));
    draw();
    return h('div', { style: { display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap' } }, c, h('div', { class: 'small muted', style: { maxWidth: '240px' } }, h('div', { class: 'field' }, h('span', null, 'Canal'), sel), 'Clic para añadir puntos y arrastra para moverlos. Alt+clic o clic derecho elimina un punto.', h('div', { style: { marginTop: '8px' } }, h('button', { class: 'btn sm', onclick: () => { pts[ch].splice(0, pts[ch].length, [0, 0], [255, 255]); emit(); } }, 'Restablecer canal'))));
  }
  /* capas de ajuste */
  IE.adjLayerMenu = () => Object.keys(F.ADJ_DEFS).filter(k => !['opacity', 'colorToAlpha'].includes(k)).map(k => ({ label: F.ADJ_DEFS[k].name, action: () => IE.addAdjLayer(k) }));
  IE.addAdjLayer = async function (kind) {
    const d = IE.d; const l = { id: FP.uid(), type: 'adjust', name: F.ADJ_DEFS[kind].name, visible: true, locked: false, opacity: 1, blend: 'source-over', x: 0, y: 0, canvas: null, mask: null, maskOn: true, adj: { kind, params: F.defaults(kind) }, ver: 1 };
    I.edit(d, 'Capa de ajuste', []); IE.insertAbove(l); const ok = await IE.editAdjLayer(l, true); if (!ok) { IE.undo(); I.history.redo.pop(); IE.renderHistory(); }
  };
  IE.editAdjLayer = async function (l, fresh) {
    const def = F.ADJ_DEFS[l.adj.kind]; const before = JSON.parse(JSON.stringify(l.adj.params)); const vals = l.adj.params; const extra = [];
    if (l.adj.kind === 'curves') extra.push({ type: 'node', node: curveEditor(vals, () => IE.dirtyComp()) });
    const v = await FP.dialog(def.name + ' (capa de ajuste)', extra.concat(paramFields(def, vals)), { icon: 'adjust', size: l.adj.kind === 'curves' ? 'wide' : '', onChange: (vv) => { Object.assign(vals, vv); IE.dirtyComp(); } });
    if (!v) { l.adj.params = before; IE.dirtyComp(); return false; }
    if (!fresh) { const now = JSON.parse(JSON.stringify(vals)); l.adj.params = before; I.edit(IE.d, 'Editar capa de ajuste', []); l.adj.params = Object.assign(now, v); } else Object.assign(vals, v);
    IE.after(); return true;
  };

  /* ======================= Imagen ======================= */
  function eachLayer(fn) { I.walk(IE.d.layers, (l) => { fn(l); }); }
  function rasterizeTexts(why) { let n = 0; eachLayer(l => { if (l.type === 'text') { l.type = 'raster'; delete l.text; n++; } }); if (n) FP.toast(n + ' capa(s) de texto rasterizadas para ' + why, 'warn'); }
  IE.imageSizeDialog = async function () {
    const d = IE.d; const v = await FP.dialog('Tamaño de imagen', [{ key: 'unit', type: 'select', label: 'Unidad', value: 'px', options: [['px', 'Píxeles'], ['pct', 'Porcentaje'], ['cm', 'Centímetros (según ppp)']] },
      { key: 'w', type: 'number', label: 'Ancho', value: d.w, half: true, step: .01 }, { key: 'h', type: 'number', label: 'Alto', value: d.h, half: true, step: .01 }, { key: 'keep', type: 'checkbox', label: 'Mantener proporciones', value: true },
      { key: 'dpi', type: 'number', label: 'Resolución (ppp)', value: d.dpi }, { key: 'q', type: 'select', label: 'Remuestreo', value: 'high', options: [['high', 'Alta calidad (bicúbico)'], ['nearest', 'Vecino más próximo (pixel art)']] }],
      { icon: 'resize', onOpen: (m, form) => { const i = form.inputs; let lock = false; const ar = d.w / d.h; const conv = () => i.unit.value; i.unit.addEventListener('change', () => { const u = conv(); if (u === 'px') { i.w.value = d.w; i.h.value = d.h; } else if (u === 'pct') { i.w.value = 100; i.h.value = 100; } else { i.w.value = (d.w / d.dpi * 2.54).toFixed(2); i.h.value = (d.h / d.dpi * 2.54).toFixed(2); } }); i.w.addEventListener('input', () => { if (i.keep.checked && !lock) { lock = true; i.h.value = conv() === 'pct' ? i.w.value : (+i.w.value / ar).toFixed(conv() === 'px' ? 0 : 2); lock = false; } }); i.h.addEventListener('input', () => { if (i.keep.checked && !lock) { lock = true; i.w.value = conv() === 'pct' ? i.h.value : (+i.h.value * ar).toFixed(conv() === 'px' ? 0 : 2); lock = false; } }); } });
    if (!v) return; let W = v.w, H = v.h; if (v.unit === 'pct') { W = d.w * v.w / 100; H = d.h * v.h / 100; } else if (v.unit === 'cm') { W = v.w / 2.54 * v.dpi; H = v.h / 2.54 * v.dpi; }
    W = Math.round(W); H = Math.round(H); if (W < 1 || H < 1 || W * H > FP.LIMITS.maxPixels / 2) return FP.toast('Tamaño no válido', 'err');
    await FP.busy('Redimensionando…', async () => { IE.resizeDoc(W, H, v.q !== 'nearest'); d.dpi = v.dpi; }); IE.fit();
  };
  IE.resizeDoc = function (W, H, smooth) {
    const d = IE.d; const sx = W / d.w, sy = H / d.h; I.edit(d, 'Tamaño de imagen', []);
    eachLayer(l => {
      if (l.type === 'text') { l.text = Object.assign({}, l.text, { size: l.text.size * (sx + sy) / 2 }); I.renderText(l); l.x = Math.round(l.x * sx); l.y = Math.round(l.y * sy); }
      else if (l.canvas) { l.canvas = I.resample(l.canvas, l.canvas.width * sx, l.canvas.height * sy, smooth); l.x = Math.round(l.x * sx); l.y = Math.round(l.y * sy); }
      if (l.mask) { const m = I.resample(l.mask, l.mask.width * sx, l.mask.height * sy); m._ver = 1; l.mask = m; }
      if (l.fx) { l.fx = JSON.parse(JSON.stringify(l.fx)); }
      l.ver++;
    });
    d.w = W; d.h = H; I.setSel(d, null); IE.after();
  };
  IE.canvasSizeDialog = async function () {
    const d = IE.d; const anchors = [['tl', '↖'], ['tc', '↑'], ['tr', '↗'], ['ml', '←'], ['mc', '•'], ['mr', '→'], ['bl', '↙'], ['bc', '↓'], ['br', '↘']];
    const v = await FP.dialog('Tamaño del lienzo', [{ key: 'w', type: 'number', label: 'Ancho (px)', value: d.w, half: true }, { key: 'h', type: 'number', label: 'Alto (px)', value: d.h, half: true }, { key: 'anchor', type: 'select', label: 'Anclaje', value: 'mc', options: anchors.map(([k, s]) => [k, s + ' ' + { tl: 'Arriba izq.', tc: 'Arriba', tr: 'Arriba der.', ml: 'Izquierda', mc: 'Centro', mr: 'Derecha', bl: 'Abajo izq.', bc: 'Abajo', br: 'Abajo der.' }[k]]) }, { key: 'fill', type: 'select', label: 'Rellenar el área nueva del fondo', value: 'none', options: [['none', 'Transparente'], ['bg', 'Color de fondo'], ['white', 'Blanco']] }], { icon: 'crop' });
    if (!v) return; IE.setCanvasSize(Math.round(v.w), Math.round(v.h), v.anchor, v.fill);
  };
  IE.setCanvasSize = function (W, H, anchor, fill) {
    const d = IE.d; if (W < 1 || H < 1 || W * H > FP.LIMITS.maxPixels / 2) return FP.toast('Tamaño no válido', 'err');
    const ax = anchor[1] === 'l' ? 0 : anchor[1] === 'r' ? 1 : .5, ay = anchor[0] === 't' ? 0 : anchor[0] === 'b' ? 1 : .5; const dx = Math.round((W - d.w) * ax), dy = Math.round((H - d.h) * ay);
    I.edit(d, 'Tamaño del lienzo', []); eachLayer(l => { if (l.type === 'raster' || l.type === 'text') { l.x += dx; l.y += dy; } else if (l.mask && (l.type === 'group' || l.type === 'adjust')) { l.x += dx; l.y += dy; } });
    d.w = W; d.h = H; I.setSel(d, null);
    if (fill && fill !== 'none') { const c = FP.canvas(W, H); const x = c.getContext('2d'); x.fillStyle = fill === 'bg' ? IE.bg : '#ffffff'; x.fillRect(0, 0, W, H); const l = I.newLayer(d, 'Fondo ampliado', c); d.layers.unshift(l); }
    IE.after(); IE.fit();
  };
  IE.applyCrop = function () {
    const d = IE.d; const st = IE.tools.crop.st; if (!st) return; const x0 = Math.round(st.x), y0 = Math.round(st.y), w = Math.round(st.w), hh = Math.round(st.h); if (w < 1 || hh < 1) return;
    const pr = IE.CROP_PRESETS.find(q => q[0] === IE.O.crop.preset);
    I.edit(d, 'Recortar', []); eachLayer(l => { l.x -= x0; l.y -= y0; }); d.w = w; d.h = hh; I.setSel(d, null);
    eachLayer(l => { if (l.type === 'raster' && l.canvas && (l.canvas.width > w * 1.5 || l.canvas.height > hh * 1.5)) { const nx = Math.max(l.x, 0), ny = Math.max(l.y, 0); const ex = Math.min(l.x + l.canvas.width, w), ey = Math.min(l.y + l.canvas.height, hh); if (ex <= nx || ey <= ny) return; const c = FP.canvas(ex - nx, ey - ny); c.getContext('2d').drawImage(l.canvas, l.x - nx, l.y - ny); if (l.mask) { const m = FP.canvas(c.width, c.height); m.getContext('2d').drawImage(l.mask, l.x - nx, l.y - ny); m._ver = 1; l.mask = m; } l.canvas = c; l.x = nx; l.y = ny; } });
    IE.tools.crop.st = { x: 0, y: 0, w, h: hh };
    if (pr && pr[2] && (w !== pr[2] || hh !== pr[3])) { IE.resizeDoc(pr[2], pr[3], true); I.history.undo.pop(); FP.toast(`Recortado y escalado a ${pr[2]}×${pr[3]} px (${pr[1]})`, 'ok'); }
    IE.after(); IE.setTool('move'); IE.fit();
  };
  IE.cropToSel = () => { const d = IE.d; const b = I.selBounds(d); if (!b) return FP.toast('No hay selección', 'warn'); IE.tools.crop.st = { x: b.x, y: b.y, w: b.w, h: b.h }; const pv = IE.O.crop.preset; IE.O.crop.preset = 'free'; IE.applyCrop(); IE.O.crop.preset = pv; };
  IE.trim = () => { const d = IE.d; const b = I.trimBounds(I.composite(d)); if (!b) return FP.toast('La imagen está vacía', 'warn'); if (b.w === d.w && b.h === d.h) return FP.toast('No hay bordes transparentes que recortar'); IE.tools.crop.st = b; const pv = IE.O.crop.preset; IE.O.crop.preset = 'free'; IE.applyCrop(); IE.O.crop.preset = pv; };
  IE.rotateCanvas = async function (deg) {
    const d = IE.d; if (deg === 'custom') { const v = await FP.dialog('Rotar lienzo', [{ key: 'a', type: 'number', label: 'Ángulo (grados, positivo = horario)', value: 15, min: -360, max: 360, step: .1 }], { icon: 'rotr' }); if (!v) return; deg = v.a; }
    deg = ((deg % 360) + 360) % 360; if (!deg) return; rasterizeTexts('rotar');
    const a = deg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a); const right = deg % 90 === 0;
    const W = right ? (deg % 180 ? d.h : d.w) : Math.ceil(Math.abs(d.w * cs) + Math.abs(d.h * sn)), H = right ? (deg % 180 ? d.w : d.h) : Math.ceil(Math.abs(d.w * sn) + Math.abs(d.h * cs));
    I.edit(d, 'Rotar lienzo', []);
    const rot = (c, l) => { const corners = [[l.x, l.y], [l.x + c.width, l.y], [l.x + c.width, l.y + c.height], [l.x, l.y + c.height]].map(([x, y]) => { const X = x - d.w / 2, Y = y - d.h / 2; return [W / 2 + X * cs - Y * sn, H / 2 + X * sn + Y * cs]; }); const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]); const nx = Math.floor(Math.min(...xs) + 1e-6), ny = Math.floor(Math.min(...ys) + 1e-6); const n = FP.canvas(Math.round(Math.max(...xs) - nx), Math.round(Math.max(...ys) - ny)); const x = n.getContext('2d'); x.translate(corners[0][0] - nx, corners[0][1] - ny); x.rotate(a); x.drawImage(c, 0, 0); return { c: n, x: nx, y: ny }; };
    eachLayer(l => { if (l.canvas && l.type === 'raster') { const r = rot(l.canvas, l); if (l.mask) { const m = rot(l.mask, l); m.c._ver = 1; l.mask = m.c; } l.canvas = r.c; l.x = r.x; l.y = r.y; l.ver++; } else if (l.mask) { const r = rot(l.mask, { x: l.x, y: l.y }); r.c._ver = 1; l.mask = r.c; l.x = r.x; l.y = r.y; } });
    d.w = W; d.h = H; I.setSel(d, null); IE.after(); IE.fit();
  };
  IE.flipCanvas = function (axis) {
    const d = IE.d; rasterizeTexts('voltear'); I.edit(d, axis === 'h' ? 'Voltear horizontal' : 'Voltear vertical', []);
    const flip = (c) => { const n = FP.canvas(c.width, c.height); const x = n.getContext('2d'); if (axis === 'h') { x.translate(c.width, 0); x.scale(-1, 1); } else { x.translate(0, c.height); x.scale(1, -1); } x.drawImage(c, 0, 0); return n; };
    eachLayer(l => { const c = l.canvas || l.mask; if (!c) return; if (l.canvas) l.canvas = flip(l.canvas); if (l.mask) { l.mask = flip(l.mask); l.mask._ver = 1; } if (axis === 'h') l.x = d.w - (l.x + c.width); else l.y = d.h - (l.y + c.height); l.ver++; });
    I.setSel(d, null); IE.after();
  };
  IE.flipLayer = function (axis) {
    const d = IE.d; const l = IE.active(); if (!IE.needRaster(l, 'voltear')) return; I.edit(d, 'Voltear capa', [l]);
    const c = l.canvas; const n = FP.canvas(c.width, c.height); const x = n.getContext('2d'); if (axis === 'h') { x.translate(c.width, 0); x.scale(-1, 1); } else { x.translate(0, c.height); x.scale(1, -1); } x.drawImage(c, 0, 0); l.canvas = n; l.ver++; IE.after();
  };
  IE.rotateLayer = (deg) => { const t = IE.active(); if (!t) return; IE.startTransform(); if (!IE.T) return; const q = IE.T.q; const c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2]; const a = deg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a); IE.T.q = q.map(([x, y]) => [c[0] + (x - c[0]) * cs - (y - c[1]) * sn, c[1] + (x - c[0]) * sn + (y - c[1]) * cs]); IE.commitTransform(); };
  IE.resolutionDialog = async function () { const d = IE.d; const v = await FP.dialog('Resolución', [{ type: 'note', text: `Cambia los ppp guardados en el archivo sin remuestrear. Tamaño de impresión actual: ${(d.w / d.dpi * 2.54).toFixed(1)} × ${(d.h / d.dpi * 2.54).toFixed(1)} cm.` }, { key: 'dpi', type: 'number', label: 'Píxeles por pulgada', value: d.dpi, min: 1, max: 4800 }], { icon: 'info' }); if (!v) return; I.edit(d, 'Resolución', []); d.dpi = v.dpi; IE.after(); IE.updateStatus(); };
  IE.alignLayer = function (how) { const d = IE.d; const l = IE.active(); if (!l || !l.canvas) return; const b = I.trimBounds(l.canvas) || { x: 0, y: 0, w: l.canvas.width, h: l.canvas.height }; I.edit(d, 'Alinear', []); const ref = I.selBounds(d) || { x: 0, y: 0, w: d.w, h: d.h }; if (how === 'left') l.x = ref.x - b.x; if (how === 'right') l.x = ref.x + ref.w - b.x - b.w; if (how === 'hcenter') l.x = Math.round(ref.x + (ref.w - b.w) / 2 - b.x); if (how === 'top') l.y = ref.y - b.y; if (how === 'bottom') l.y = ref.y + ref.h - b.y - b.h; if (how === 'vcenter') l.y = Math.round(ref.y + (ref.h - b.h) / 2 - b.y); IE.after(); };

  /* ======================= Capas: combinar, rasterizar… ======================= */
  IE.mergeDown = function () {
    const d = IE.d; const f = I.find(d, d.activeId); if (!f) return; const i = f.list.indexOf(f.l); const below = f.list[i - 1];
    if (!below) return FP.toast('No hay capa debajo', 'warn'); if (below.type === 'adjust' || below.type === 'group' || f.l.type === 'group') return FP.toast('Combina capas de píxeles o texto (rasteriza grupos con «Combinar visibles»)', 'warn');
    I.edit(d, 'Combinar hacia abajo', []); const c = FP.canvas(d.w, d.h); const x = c.getContext('2d');
    I.compose(d, [Object.assign({}, below, { opacity: 1, blend: 'source-over', visible: true }), f.l], x);
    const nl = Object.assign(I.newLayer(d, below.name, c), { opacity: below.opacity, blend: below.blend }); f.list.splice(i - 1, 2, nl); d.activeId = nl.id; IE.after();
  };
  IE.mergeVisible = function () { const d = IE.d; const c = I.composite(d); I.edit(d, 'Combinar visibles', []); const keep = []; d.layers.forEach(l => { if (!l.visible) keep.push(l); }); const nl = I.newLayer(d, 'Combinada', c); d.layers = keep.concat([nl]); d.activeId = nl.id; IE.after(); };
  IE.flattenImage = async function () { const d = IE.d; const hidden = I.flat(d).some(l => !l.visible); if (hidden && !await FP.confirm('Se descartarán las capas ocultas.', 'Acoplar imagen', 'Acoplar')) return; const c = I.composite(d); I.edit(d, 'Acoplar imagen', []); const nl = I.newLayer(d, 'Fondo', c); d.layers = [nl]; d.activeId = nl.id; IE.after(); };
  IE.rasterize = function () { const d = IE.d; const l = IE.active(); if (!l) return; if (l.type === 'text') { I.edit(d, 'Rasterizar texto', []); l.type = 'raster'; delete l.text; l.name += ' (raster)'; IE.after(); return; } if (I.hasFx(l)) { I.edit(d, 'Rasterizar estilo', []); const c = I.renderLayerDoc(d, Object.assign({}, l, { opacity: 1 })); l.canvas = c; l.x = 0; l.y = 0; l.fx = null; l.mask = null; l.ver++; IE.after(); return; } FP.toast('La capa ya es de píxeles'); };
  IE.layerViaCopy = function (cut) {
    const d = IE.d; const l = IE.active(); if (!l || !l.canvas) return;
    if (!d.sel) return IE.duplicateLayer();
    const c = FP.canvas(d.w, d.h); const x = c.getContext('2d'); x.drawImage(l.canvas, l.x, l.y); x.globalCompositeOperation = 'destination-in'; x.drawImage(d.sel, 0, 0);
    if (cut && l.type === 'raster') { I.edit(d, 'Capa vía cortar', [l]); const lx = l.canvas.getContext('2d'); lx.globalCompositeOperation = 'destination-out'; lx.drawImage(d.sel, -l.x, -l.y); lx.globalCompositeOperation = 'source-over'; l.ver++; }
    IE.addLayer(c, l.name + (cut ? ' (cortada)' : ' (copia)'), 0, 0, cut ? 'Capa vía cortar' : 'Capa vía copiar');
  };
  IE.fillLayerDialog = async function () { const v = await FP.dialog('Capa de relleno de color', [{ key: 'c', type: 'color', label: 'Color', value: IE.fg }], { icon: 'bucket' }); if (!v) return; const d = IE.d; const c = FP.canvas(d.w, d.h); const x = c.getContext('2d'); x.fillStyle = v.c; x.fillRect(0, 0, d.w, d.h); IE.addLayer(c, 'Relleno ' + v.c, 0, 0, 'Capa de relleno'); };
  IE.loadFont = async function () {
    const f = await FP.pickFiles('.ttf,.otf,.woff,.woff2'); if (!f[0]) return;
    try { const buf = await FP.readBuf(f[0]); const name = FP.baseName(f[0].name).replace(/[^\w\- ]/g, ''); const ff = new FontFace(name, buf); await ff.load(); document.fonts.add(ff); IE.fonts.push({ name, bytes: new Uint8Array(buf), file: f[0].name }); IE.O.text.font = name; IE.renderOpt(); FP.toast('Fuente «' + name + '» cargada (se guarda en el proyecto)', 'ok'); }
    catch (e) { FP.error(e, 'Fuente no válida'); }
  };

  /* ======================= Herramientas avanzadas ======================= */
  IE.removeBgDialog = async function () {
    const d = IE.d; const l = IE.active(); if (!IE.needRaster(l, 'quitar el fondo')) return;
    let mask = null; const keep = { sel: d.sel };
    const compute = (v) => { const m = IE.objectMask({ x: 0, y: 0, w: d.w, h: d.h }, v.tol); if (!m) { mask = null; IE.live = null; IE.dirtyComp(); return; } mask = v.feather ? I.blurAlpha(m, v.feather) : m; const t = FP.canvas(d.w, d.h); const tx = t.getContext('2d'); tx.drawImage(l.canvas, l.x, l.y); tx.globalCompositeOperation = 'destination-in'; tx.drawImage(mask, 0, 0); IE.live = { id: l.id, draw: (x) => x.drawImage(t, 0, 0) }; IE.dirtyComp(); };
    const v = await FP.dialog('Quitar fondo', [{ type: 'note', text: 'Detecta el fondo a partir de los bordes de la imagen (funciona mejor con fondos uniformes o de estudio). Para fondos complejos, afina después con el pincel sobre la máscara.' },
      { key: 'tol', type: 'range', label: 'Tolerancia', value: 40, min: 5, max: 150 }, { key: 'feather', type: 'range', label: 'Suavizar bordes (px)', value: 1, min: 0, max: 20 },
      { key: 'how', type: 'radio', label: 'Resultado', value: 'mask', options: [['mask', 'Máscara de capa (editable)'], ['delete', 'Borrar píxeles']] },
      { key: 'bg', type: 'select', label: 'Nuevo fondo', value: 'none', options: [['none', 'Transparente'], ['color', 'Color de fondo actual'], ['white', 'Blanco'], ['image', 'Imagen de otro archivo…']] }], { icon: 'bg', onChange: compute, onOpen: (m, f) => compute(f.values()) });
    IE.live = null; IE.dirtyComp(); if (!v || !mask) { if (v) FP.toast('No se pudo separar el fondo', 'warn'); return; }
    if (v.how === 'mask') { I.edit(d, 'Quitar fondo (máscara)', []); const m = FP.canvas(l.canvas.width, l.canvas.height); const mx = m.getContext('2d'); mx.fillStyle = '#000'; mx.fillRect(0, 0, m.width, m.height); const t = FP.canvas(m.width, m.height); const tx = t.getContext('2d'); tx.drawImage(mask, -l.x, -l.y); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#fff'; tx.fillRect(0, 0, t.width, t.height); mx.drawImage(t, 0, 0); m._ver = 1; if (l.mask) { const o = l.mask.getContext('2d'); } l.mask = m; l.maskOn = true; }
    else { I.edit(d, 'Quitar fondo', [l]); const x = l.canvas.getContext('2d'); x.globalCompositeOperation = 'destination-in'; x.drawImage(mask, -l.x, -l.y); x.globalCompositeOperation = 'source-over'; l.ver++; }
    IE.after(); if (v.bg !== 'none') await IE.addBackground(v.bg === 'color' ? IE.bg : v.bg === 'white' ? '#ffffff' : 'image');
  };
  IE.addBackground = async function (what) {
    const d = IE.d; let c;
    if (what === 'image') { const f = await FP.pickFiles('image/*,.tif,.tiff'); if (!f[0]) return; const img = await FP.loadImageFile(f[0]); c = FP.canvas(d.w, d.h); const s = Math.max(d.w / img.width, d.h / img.height); c.getContext('2d').drawImage(img, (d.w - img.width * s) / 2, (d.h - img.height * s) / 2, img.width * s, img.height * s); }
    else { c = FP.canvas(d.w, d.h); const x = c.getContext('2d'); x.fillStyle = what; x.fillRect(0, 0, d.w, d.h); }
    const f = I.find(d, d.activeId); const l = I.newLayer(d, 'Nuevo fondo', c); I.edit(d, 'Cambiar fondo', []); const list = f ? f.list : d.layers; list.splice(f ? list.indexOf(f.l) : 0, 0, l); IE.after();
  };
  IE.changeBgDialog = async function () { const v = await FP.dialog('Cambiar fondo', [{ type: 'note', text: 'Añade un fondo nuevo debajo de la capa activa. Si la capa aún tiene fondo, usa antes «Quitar fondo».' }, { key: 'w', type: 'select', label: 'Fondo', value: 'image', options: [['image', 'Imagen de otro archivo…'], ['color', 'Color de fondo actual'], ['white', 'Blanco'], ['black', 'Negro']] }], { icon: 'bg' }); if (!v) return; IE.addBackground(v.w === 'color' ? IE.bg : v.w === 'white' ? '#ffffff' : v.w === 'black' ? '#000000' : 'image'); };
  IE.watermarkDialog = async function () {
    const d = IE.d; const v = await FP.dialog('Marca de agua / logotipo', [{ key: 'kind', type: 'radio', label: 'Tipo', value: 'text', options: [['text', 'Texto'], ['image', 'Logotipo (imagen)']] },
      { key: 'text', label: 'Texto', value: '© ' + new Date().getFullYear(), show: v => v.kind === 'text' }, { key: 'color', type: 'color', label: 'Color', value: '#ffffff', show: v => v.kind === 'text', half: true }, { key: 'size', type: 'range', label: 'Tamaño (% del ancho)', value: 20, min: 2, max: 100, unit: ' %', half: true },
      { key: 'pos', type: 'select', label: 'Posición', value: 'br', options: [['tl', 'Arriba izquierda'], ['tr', 'Arriba derecha'], ['cc', 'Centro'], ['bl', 'Abajo izquierda'], ['br', 'Abajo derecha'], ['tile', 'Mosaico (toda la imagen)']] },
      { key: 'opacity', type: 'range', label: 'Opacidad', value: 60, min: 5, max: 100, unit: ' %' }, { key: 'rot', type: 'range', label: 'Rotación', value: 0, min: -90, max: 90, unit: '°' }], { icon: 'watermark' });
    if (!v) return; let mark;
    if (v.kind === 'image') { const f = await FP.pickFiles('image/*,.svg'); if (!f[0]) return; mark = await FP.loadImageFile(f[0], { svgScale: 4 }); const w = d.w * v.size / 100; mark = I.resample(mark, w, w * mark.height / mark.width); }
    else { const tl = { text: Object.assign({}, IE.O.text, { text: v.text, font: 'Arial', bold: true, color: v.color, size: 100 }) }; I.renderText(tl); const w = d.w * v.size / 100; mark = I.resample(tl.canvas, w, w * tl.canvas.height / tl.canvas.width); }
    const c = FP.canvas(d.w, d.h); const x = c.getContext('2d'); const a = v.rot * Math.PI / 180; const m = Math.round(d.w * .03);
    const put = (cx, cy) => { x.save(); x.translate(cx, cy); x.rotate(-a); x.drawImage(mark, -mark.width / 2, -mark.height / 2); x.restore(); };
    if (v.pos === 'tile') { const sx = mark.width * 1.8, sy = mark.height * 2.5; for (let yy = sy / 2; yy < d.h + sy; yy += sy) for (let xx = (Math.round(yy / sy) % 2) * sx / 2; xx < d.w + sx; xx += sx) put(xx, yy); }
    else { const px = v.pos[1] === 'l' ? m + mark.width / 2 : v.pos[1] === 'r' ? d.w - m - mark.width / 2 : d.w / 2; const py = v.pos[0] === 't' ? m + mark.height / 2 : v.pos[0] === 'b' ? d.h - m - mark.height / 2 : d.h / 2; put(px, py); }
    const l = IE.addLayer(c, 'Marca de agua', 0, 0, 'Marca de agua'); l.opacity = v.opacity / 100; IE.after();
  };
  IE.frameDialog = async function () {
    const d = IE.d; const v = await FP.dialog('Añadir marco', [{ key: 'style', type: 'select', label: 'Estilo', value: 'border', options: [['border', 'Borde sobre la imagen'], ['expand', 'Paspartú (amplía el lienzo)'], ['polaroid', 'Polaroid'], ['round', 'Esquinas redondeadas'], ['double', 'Doble línea']] },
      { key: 'w', type: 'range', label: 'Grosor (% del lado menor)', value: 4, min: 1, max: 25, unit: ' %' }, { key: 'color', type: 'color', label: 'Color', value: '#ffffff' }], { icon: 'frame' });
    if (!v) return; const t = Math.max(1, Math.round(Math.min(d.w, d.h) * v.w / 100));
    if (v.style === 'expand' || v.style === 'polaroid') { const extraB = v.style === 'polaroid' ? t * 4 : t; IE.setCanvasSize(d.w + 2 * t, d.h + t + extraB, 'tc', 'none'); I.history.undo.pop(); I.walk(d.layers, l => { l.y += 0; }); const c = FP.canvas(d.w, d.h); const x = c.getContext('2d'); x.fillStyle = v.color; x.fillRect(0, 0, d.w, d.h); I.edit(d, 'Marco', []); d.layers.unshift(I.newLayer(d, 'Marco', c)); IE.after(); return; }
    if (v.style === 'round') { const c = I.composite(d); const r = t * 3; I.edit(d, 'Esquinas redondeadas', []); const n = FP.canvas(d.w, d.h); const x = n.getContext('2d'); x.beginPath(); x.roundRect ? x.roundRect(0, 0, d.w, d.h, r) : x.rect(0, 0, d.w, d.h); x.clip(); x.drawImage(c, 0, 0); const nl = I.newLayer(d, 'Imagen redondeada', n); d.layers.forEach(l => l.visible = false); d.layers.push(nl); d.activeId = nl.id; IE.after(); return; }
    const c = FP.canvas(d.w, d.h); const x = c.getContext('2d'); x.strokeStyle = v.color; x.lineWidth = t; x.strokeRect(t / 2, t / 2, d.w - t, d.h - t);
    if (v.style === 'double') { x.lineWidth = Math.max(1, t / 3); x.strokeRect(t * 1.8, t * 1.8, d.w - t * 3.6, d.h - t * 3.6); }
    IE.addLayer(c, 'Marco', 0, 0, 'Marco');
  };
  IE.collageDialog = async function () {
    const LAYOUTS = { '2h': [[0, 0, .5, 1], [.5, 0, .5, 1]], '2v': [[0, 0, 1, .5], [0, .5, 1, .5]], '3a': [[0, 0, .6, 1], [.6, 0, .4, .5], [.6, .5, .4, .5]], '3h': [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]], '4': [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]], '5': [[0, 0, .5, .6], [.5, 0, .5, .6], [0, .6, 1 / 3, .4], [1 / 3, .6, 1 / 3, .4], [2 / 3, .6, 1 / 3, .4]], '6': [[0, 0, 1 / 3, .5], [1 / 3, 0, 1 / 3, .5], [2 / 3, 0, 1 / 3, .5], [0, .5, 1 / 3, .5], [1 / 3, .5, 1 / 3, .5], [2 / 3, .5, 1 / 3, .5]], '9': [...Array(9)].map((_, i) => [(i % 3) / 3, Math.floor(i / 3) / 3, 1 / 3, 1 / 3]) };
    const files = await FP.pickFiles('image/*,.tif,.tiff', true); if (!files.length) return;
    const v = await FP.dialog('Collage con ' + files.length + ' imágenes', [{ key: 'layout', type: 'select', label: 'Distribución', value: files.length <= 2 ? '2h' : files.length === 3 ? '3a' : files.length === 4 ? '4' : files.length === 5 ? '5' : files.length <= 6 ? '6' : '9', options: [['2h', '2 en horizontal'], ['2v', '2 en vertical'], ['3a', '3 (1 grande + 2)'], ['3h', '3 en fila'], ['4', '4 en cuadrícula'], ['5', '5 (2 + 3)'], ['6', '6 en cuadrícula'], ['9', '9 en cuadrícula']] },
      { key: 'size', type: 'select', label: 'Tamaño', value: '2000x2000', options: [['2000x2000', 'Cuadrado 2000×2000'], ['1080x1350', 'Instagram vertical 1080×1350'], ['1920x1080', 'Horizontal 1920×1080'], ['2480x3508', 'A4 vertical 300 ppp']] },
      { key: 'gap', type: 'range', label: 'Separación (px)', value: 20, min: 0, max: 100 }, { key: 'radius', type: 'range', label: 'Redondeo de esquinas', value: 0, min: 0, max: 100 }, { key: 'bg', type: 'color', label: 'Color de fondo', value: '#ffffff' }], { icon: 'collage', ok: 'Crear collage' });
    if (!v) return; if (IE.d && !await IE.confirmDiscard()) return;
    const [W, H] = v.size.split('x').map(Number); const d = I.newDoc(W, H, 'Collage', v.bg); d.layers[0].name = 'Fondo'; IE.setDoc(d);
    const cells = LAYOUTS[v.layout]; const g = v.gap; const pr = FP.progress('Creando collage');
    try {
      for (let i = 0; i < Math.min(cells.length, files.length); i++) {
        pr.set(i / cells.length, files[i].name); const img = await FP.loadImageFile(files[i]); const [cx, cy, cw, ch] = cells[i];
        const x0 = Math.round(cx * W + g / (cx === 0 ? 1 : 2)), y0 = Math.round(cy * H + g / (cy === 0 ? 1 : 2)), x1 = Math.round((cx + cw) * W - g / (cx + cw >= .999 ? 1 : 2)), y1 = Math.round((cy + ch) * H - g / (cy + ch >= .999 ? 1 : 2));
        const w = x1 - x0, hh = y1 - y0; const c = FP.canvas(w, hh); const x = c.getContext('2d'); if (v.radius && x.roundRect) { x.beginPath(); x.roundRect(0, 0, w, hh, v.radius); x.clip(); } const s = Math.max(w / img.width, hh / img.height); const sm = I.resample(img, img.width * s, img.height * s); x.drawImage(sm, (w - sm.width) / 2, (hh - sm.height) / 2);
        const l = I.newLayer(d, FP.baseName(files[i].name), c, x0, y0); d.layers.push(l); d.activeId = l.id;
      }
    } finally { pr.close(); }
    if (files.length > cells.length) FP.toast(`La distribución tiene ${cells.length} huecos: se usaron las primeras ${cells.length} imágenes`, 'warn');
    I.resetHistory(); IE.after(); IE.fit();
  };
  IE.runTool = async function (id) {
    const m = { removebg: IE.removeBgDialog, resize: IE.imageSizeDialog, social: () => { IE.O.crop.preset = 'ig-post'; IE.setTool('crop'); FP.toast('Elige el formato en la barra superior y pulsa Intro'); }, convert: IE.exportDialog, watermark: IE.watermarkDialog, frame: IE.frameDialog };
    if (m[id]) await m[id]();
  };

  /* ======================= Exportación ======================= */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
  async function pngWithDpi(blob, dpi) {
    const b = new Uint8Array(await blob.arrayBuffer()); const ppm = Math.round(dpi / .0254); const chunk = new Uint8Array(21); const dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1; dv.setUint32(17, CRC(chunk.subarray(4, 17)));
    const out = new Uint8Array(b.length + 21); out.set(b.subarray(0, 33)); out.set(chunk, 33); out.set(b.subarray(33), 54); return new Blob([out], { type: 'image/png' });
  }
  async function jpgWithDpi(blob, dpi) { const b = new Uint8Array(await blob.arrayBuffer()); if (b[6] === 0x4A && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46) { b[13] = 1; b[14] = dpi >> 8; b[15] = dpi & 255; b[16] = dpi >> 8; b[17] = dpi & 255; } return new Blob([b], { type: 'image/jpeg' }); }
  function bmpEncode(c) {
    const w = c.width, hh = c.height; const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, hh).data; let opaque = true; for (let i = 3; i < d.length; i += 4) if (d[i] < 255) { opaque = false; break; }
    if (opaque) { const row = Math.ceil(w * 3 / 4) * 4; const size = 54 + row * hh; const b = new Uint8Array(size); const v = new DataView(b.buffer); b[0] = 66; b[1] = 77; v.setUint32(2, size, true); v.setUint32(10, 54, true); v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, hh, true); v.setUint16(26, 1, true); v.setUint16(28, 24, true); v.setUint32(34, row * hh, true); v.setUint32(38, 2835, true); v.setUint32(42, 2835, true);
      for (let y = 0; y < hh; y++) { const o = 54 + (hh - 1 - y) * row; for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; b[o + x * 3] = d[i + 2]; b[o + x * 3 + 1] = d[i + 1]; b[o + x * 3 + 2] = d[i]; } } return new Blob([b], { type: 'image/bmp' }); }
    const size = 122 + w * hh * 4; const b = new Uint8Array(size); const v = new DataView(b.buffer); b[0] = 66; b[1] = 77; v.setUint32(2, size, true); v.setUint32(10, 122, true); v.setUint32(14, 108, true); v.setInt32(18, w, true); v.setInt32(22, hh, true); v.setUint16(26, 1, true); v.setUint16(28, 32, true); v.setUint32(30, 3, true); v.setUint32(34, w * hh * 4, true); v.setUint32(38, 2835, true); v.setUint32(42, 2835, true);
    v.setUint32(54, 0x00FF0000, true); v.setUint32(58, 0x0000FF00, true); v.setUint32(62, 0x000000FF, true); v.setUint32(66, 0xFF000000, true); v.setUint32(70, 0x57696E20, true);
    for (let y = 0; y < hh; y++) { const o = 122 + (hh - 1 - y) * w * 4; for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; b[o + x * 4] = d[i + 2]; b[o + x * 4 + 1] = d[i + 1]; b[o + x * 4 + 2] = d[i]; b[o + x * 4 + 3] = d[i + 3]; } }
    return new Blob([b], { type: 'image/bmp' });
  }
  IE.encode = async function (c, fmt, o) {
    o = o || {}; const dpi = o.dpi || 72;
    if (fmt === 'png') return pngWithDpi(await FP.toBlob(c, 'image/png'), dpi);
    if (fmt === 'jpg') { const f = FP.canvas(c.width, c.height); const x = f.getContext('2d'); x.fillStyle = o.bg || '#ffffff'; x.fillRect(0, 0, f.width, f.height); x.drawImage(c, 0, 0); return jpgWithDpi(await FP.toBlob(f, 'image/jpeg', o.quality), dpi); }
    if (fmt === 'webp') return FP.toBlob(c, 'image/webp', o.quality);
    if (fmt === 'bmp') return bmpEncode(c);
    if (fmt === 'tiff') { const T = await FP.lib.tiff(); return T.encode(c, dpi); }
    if (fmt === 'pdf') {
      const L = await FP.lib.pdflib(); const doc = await L.PDFDocument.create(); const opaque = !c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v < 255);
      const img = opaque && o.pdfJpeg ? await doc.embedJpg(new Uint8Array(await (await FP.toBlob(c, 'image/jpeg', o.quality || .92)).arrayBuffer())) : await doc.embedPng(new Uint8Array(await (await FP.toBlob(c, 'image/png')).arrayBuffer()));
      let pw = c.width * 72 / dpi, ph = c.height * 72 / dpi; let x = 0, y = 0, w = pw, hh = ph;
      if (o.page === 'A4') { [pw, ph] = pw > ph ? [841.89, 595.28] : [595.28, 841.89]; const s = Math.min((pw - 56) / w, (ph - 56) / hh, 1); w *= s; hh *= s; x = (pw - w) / 2; y = (ph - hh) / 2; }
      doc.addPage([pw, ph]).drawImage(img, { x, y, width: w, height: hh }); doc.setTitle(IE.d.name); doc.setProducer('FOTOPEA');
      return new Blob([await doc.save()], { type: 'application/pdf' });
    }
    throw new Error('Formato no soportado');
  };
  IE.exportDialog = async function () {
    const d = IE.d; if (!d) return;
    const v = await FP.dialog('Exportar imagen', [{ key: 'name', label: 'Nombre', value: FP.baseName(d.name) },
      { key: 'fmt', type: 'select', label: 'Formato', value: 'png', options: [['png', 'PNG (sin pérdida, transparencia)'], ['jpg', 'JPG'], ['webp', 'WEBP'], ['bmp', 'BMP'], ['tiff', 'TIFF (sin compresión)'], ['pdf', 'PDF']] },
      { key: 'quality', type: 'range', label: 'Calidad', value: 92, min: 10, max: 100, unit: ' %', show: v => v.fmt === 'jpg' || v.fmt === 'webp' || (v.fmt === 'pdf' && v.pdfJpeg) },
      { key: 'bg', type: 'color', label: 'Fondo para zonas transparentes', value: '#ffffff', show: v => v.fmt === 'jpg' },
      { key: 'pdfJpeg', type: 'checkbox', label: 'Comprimir en JPEG (archivo más pequeño)', value: false, show: v => v.fmt === 'pdf' }, { key: 'page', type: 'select', label: 'Página', value: 'image', options: [['image', 'Tamaño de la imagen (según ppp)'], ['A4', 'A4 centrada']], show: v => v.fmt === 'pdf' },
      { key: 'what', type: 'select', label: 'Contenido', value: 'all', options: [['all', 'Imagen completa'], ['layer', 'Solo la capa activa'], ['sel', 'Solo la selección']] },
      { key: 'scale', type: 'number', label: 'Escala (%)', value: 100, min: 1, max: 800, half: true }, { key: 'dpi', type: 'number', label: 'Resolución (ppp)', value: d.dpi, min: 1, max: 4800, half: true },
      { type: 'note', html: 'El archivo final se procesa en tu navegador. Para seguir editando capas, guarda también el <b>proyecto .fotopea</b>.' }], { icon: 'download', ok: 'Exportar' });
    if (!v) return;
    try {
      const blob = await FP.busy('Exportando…', async () => {
        let c = v.what === 'layer' ? I.renderLayerDoc(d, IE.active()) : I.composite(d);
        if (v.what === 'sel') { const b = I.selBounds(d); if (!b) throw new Error('No hay selección'); const n = FP.canvas(b.w, b.h); const x = n.getContext('2d'); x.drawImage(c, -b.x, -b.y); x.globalCompositeOperation = 'destination-in'; x.drawImage(d.sel, -b.x, -b.y); c = n; }
        if (v.scale !== 100) c = I.resample(c, c.width * v.scale / 100, c.height * v.scale / 100);
        return IE.encode(c, v.fmt, { quality: v.quality / 100, bg: v.bg, dpi: v.dpi, pdfJpeg: v.pdfJpeg, page: v.page });
      });
      FP.download(blob, v.name + '.' + v.fmt);
    } catch (e) { FP.error(e, 'Exportación'); }
  };
  IE.quickExport = async (fmt) => { const c = I.composite(IE.d); FP.download(await IE.encode(c, fmt, { quality: .92, dpi: IE.d.dpi }), FP.baseName(IE.d.name) + '.' + fmt); };

  /* ======================= Proyecto .fotopea ======================= */
  IE.projectBlob = async function () {
    const JSZip = await FP.lib.jszip(); const z = new JSZip(); const d = IE.d;
    const ser = (list) => list.map(l => { const o = { id: l.id, type: l.type, name: l.name, visible: l.visible, locked: l.locked, opacity: l.opacity, blend: l.blend, x: l.x, y: l.y, maskOn: l.maskOn, fx: l.fx || null, open: l.open }; if (l.text) o.text = l.text; if (l.adj) o.adj = l.adj; if (l.children) o.children = ser(l.children); return o; });
    const files = []; I.walk(d.layers, l => { if (l.canvas && l.type !== 'text') files.push(['layers/' + l.id + '.png', l.canvas]); if (l.mask) files.push(['masks/' + l.id + '.png', l.mask]); });
    for (const [n, c] of files) z.file(n, await FP.toBlob(c, 'image/png'));
    if (d.sel) z.file('selection.png', await FP.toBlob(d.sel, 'image/png'));
    IE.fonts.forEach(f => z.file('fonts/' + f.file, f.bytes));
    z.file('preview.png', await FP.toBlob(I.resample(I.composite(d), Math.min(d.w, 512), Math.min(d.w, 512) * d.h / d.w), 'image/png'));
    z.file('document.json', JSON.stringify({ app: 'FOTOPEA', kind: 'image', version: 1, w: d.w, h: d.h, dpi: d.dpi, name: d.name, activeId: d.activeId, layers: ser(d.layers), fonts: IE.fonts.map(f => ({ name: f.name, file: f.file })) }));
    return z.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } });
  };
  IE.saveProject = async function () { if (!IE.d) return; try { IE.commitPending(); const b = await FP.busy('Guardando proyecto…', () => IE.projectBlob()); FP.download(b, FP.baseName(IE.d.name) + '.fotopea'); FP.dirty.img = false; FP.db.del('autosave', 'img'); } catch (e) { FP.error(e, 'Proyecto'); } };
  IE.openProject = async function (file) {
    if (!await IE.confirmDiscard()) return; const pr = FP.progress('Abriendo proyecto');
    try {
      const JSZip = await FP.lib.jszip(); const z = await JSZip.loadAsync(file); const j = JSON.parse(await z.file('document.json').async('string'));
      if (j.app !== 'FOTOPEA' || j.kind !== 'image') throw new Error('No es un proyecto de imagen de FOTOPEA');
      const loadC = async (n) => { const f = z.file(n); if (!f) return null; const img = await FP.blobToImage(await f.async('blob')); const c = FP.canvas(img.naturalWidth, img.naturalHeight); c.getContext('2d').drawImage(img, 0, 0); return c; };
      for (const fo of (j.fonts || [])) { try { const bytes = await z.file('fonts/' + fo.file).async('uint8array'); const ff = new FontFace(fo.name, bytes); await ff.load(); document.fonts.add(ff); if (!IE.fonts.some(x => x.name === fo.name)) IE.fonts.push({ name: fo.name, file: fo.file, bytes }); } catch (e) { } }
      const de = async (list) => { const out = []; for (const o of list) { const l = Object.assign({}, o, { ver: 1 }); if (o.children) l.children = await de(o.children); if (o.type === 'raster') l.canvas = await loadC('layers/' + o.id + '.png'); if (o.type === 'text') I.renderText(l); l.mask = await loadC('masks/' + o.id + '.png'); if (l.mask) l.mask._ver = 1; out.push(l); } return out; };
      const d = { w: j.w, h: j.h, dpi: j.dpi || 72, name: j.name, activeId: j.activeId, sel: null, ver: 1 }; d.layers = await de(j.layers); d.sel = await loadC('selection.png');
      pr.close(); IE.setDoc(d); if (d.sel) I.selChanged(d); FP.toast('Proyecto abierto con ' + I.flat(d).length + ' capas', 'ok');
    } catch (e) { pr.close(); FP.error(e, 'No se pudo abrir el proyecto'); }
  };
  IE.restoreAutosave = async (a) => { await IE.openProject(new File([a.blob], a.name + '.fotopea')); FP.dirty.img = true; };

  /* ======================= Menús ======================= */
  IE.layerMenu = () => [
    { label: 'Nueva capa', icon: 'plus', key: 'Ctrl+Mayús+N', action: IE.newLayer }, { label: 'Duplicar capa', icon: 'copy', action: IE.duplicateLayer }, { label: 'Eliminar capa', icon: 'trash', action: IE.deleteLayer },
    { label: 'Estilo de capa…', icon: 'fx', action: IE.layerStyleDialog },
    { label: 'Máscara', icon: 'mask', sub: [{ label: 'Mostrar todo', action: () => IE.maskOp('reveal') }, { label: 'Ocultar todo', action: () => IE.maskOp('hide') }, { label: 'Desde la selección', action: () => IE.maskOp('sel') }, '-', { label: 'Editar máscara / capa', action: () => IE.maskOp('edit') }, { label: 'Invertir máscara', action: () => IE.maskOp('invert') }, { label: 'Activar / desactivar', action: () => IE.maskOp('toggle') }, { label: 'Aplicar máscara', action: () => IE.maskOp('apply') }, { label: 'Eliminar máscara', action: () => IE.maskOp('delete') }] },
    '-', { label: 'Agrupar', icon: 'folderl', key: 'Ctrl+G', action: IE.groupLayers }, { label: 'Desagrupar', key: 'Ctrl+Mayús+G', action: IE.ungroup },
    { label: 'Combinar hacia abajo', icon: 'merged', key: 'Ctrl+E', action: IE.mergeDown }, { label: 'Combinar visibles', key: 'Ctrl+Mayús+E', action: IE.mergeVisible }, { label: 'Rasterizar', action: IE.rasterize },
  ];
  IE.menus = () => ({
    Archivo: () => [
      { label: 'Nuevo…', icon: 'plus', key: 'Ctrl+N', action: () => IE.newDocDialog() }, { label: 'Abrir…', icon: 'folder', key: 'Ctrl+O', action: IE.openDialog }, { label: 'Colocar imagen como capa…', icon: 'img', key: 'Ctrl+Mayús+O', disabled: need, action: IE.placeDialog },
      { label: 'Abrir proyecto (.fotopea)…', icon: 'folder', action: async () => { const f = await FP.pickFiles('.fotopea'); if (f[0]) IE.openProject(f[0]); } },
      '-', { label: 'Guardar proyecto editable (.fotopea)', icon: 'save', key: 'Ctrl+S', disabled: need, action: IE.saveProject },
      { label: 'Exportar como…', icon: 'download', key: 'Ctrl+Mayús+S', disabled: need, action: IE.exportDialog },
      { label: 'Exportación rápida', disabled: need, sub: [['png', 'PNG'], ['jpg', 'JPG'], ['webp', 'WEBP'], ['bmp', 'BMP'], ['tiff', 'TIFF'], ['pdf', 'PDF']].map(([f, l]) => ({ label: l, action: () => IE.quickExport(f) })) },
      '-', { label: 'Cerrar', icon: 'x', disabled: need, action: IE.close }, { label: 'Volver al inicio', icon: 'home', action: () => FP.goHome() }],
    Edición: () => [
      { label: 'Deshacer', icon: 'undo', key: 'Ctrl+Z', disabled: () => !I.history.undo.length, action: IE.undo }, { label: 'Rehacer', icon: 'redo', key: 'Ctrl+Y', disabled: () => !I.history.redo.length, action: IE.redo },
      '-', { label: 'Cortar', key: 'Ctrl+X', disabled: need, action: () => IE.copy(false, true) }, { label: 'Copiar', icon: 'copy', key: 'Ctrl+C', disabled: need, action: () => IE.copy(false) }, { label: 'Copiar combinado', key: 'Ctrl+Mayús+C', disabled: need, action: () => IE.copy(true) }, { label: 'Pegar', key: 'Ctrl+V', disabled: need, action: IE.paste },
      { label: 'Borrar', key: 'Supr', disabled: need, action: () => IE.clearSel() }, { label: 'Rellenar…', icon: 'bucket', key: 'Mayús+F5', disabled: need, action: () => IE.fillDialog() }, { label: 'Contornear…', disabled: need, action: IE.strokeSelDialog },
      { label: 'Rellenar según contenido (eliminar objeto)', icon: 'heal', disabled: need, action: IE.contentAwareFill },
      '-', { label: 'Transformación libre', icon: 'transform', key: 'Ctrl+T', disabled: need, action: () => IE.startTransform() },
      { label: 'Transformar', disabled: need, sub: [{ label: 'Escalar / rotar', action: () => IE.startTransform('scale') }, { label: 'Inclinar', action: () => IE.startTransform('skew') }, { label: 'Distorsionar', action: () => IE.startTransform('distort') }, { label: 'Perspectiva', action: () => IE.startTransform('perspective') }, '-', { label: 'Rotar 90° horario', action: () => IE.rotateLayer(90) }, { label: 'Rotar 90° antihorario', action: () => IE.rotateLayer(-90) }, { label: 'Rotar 180°', action: () => IE.rotateLayer(180) }, { label: 'Voltear horizontal', action: () => IE.flipLayer('h') }, { label: 'Voltear vertical', action: () => IE.flipLayer('v') }] },
      '-', { label: 'Cargar fuente…', action: IE.loadFont }],
    Imagen: () => [
      { label: 'Ajustes', icon: 'adjust', disabled: need, sub: Object.keys(F.ADJ_DEFS).map(k => ({ label: F.ADJ_DEFS[k].name + '…', action: () => IE.adjustDialog(k) })).concat(['-', { label: 'Tono automático', action: () => IE.adjustDialog('autoLevels') }, { label: 'Balance de blancos automático', action: () => IE.adjustDialog('autoWhiteBalance') }]) },
      '-', { label: 'Tamaño de imagen…', icon: 'resize', key: 'Ctrl+Alt+I', disabled: need, action: IE.imageSizeDialog }, { label: 'Tamaño del lienzo…', icon: 'crop', key: 'Ctrl+Alt+C', disabled: need, action: IE.canvasSizeDialog }, { label: 'Resolución (ppp)…', disabled: need, action: IE.resolutionDialog },
      { label: 'Rotar lienzo', icon: 'rotr', disabled: need, sub: [{ label: '90° horario', action: () => IE.rotateCanvas(90) }, { label: '90° antihorario', action: () => IE.rotateCanvas(270) }, { label: '180°', action: () => IE.rotateCanvas(180) }, { label: 'Ángulo personalizado…', action: () => IE.rotateCanvas('custom') }] },
      { label: 'Voltear lienzo horizontal', icon: 'flip', disabled: need, action: () => IE.flipCanvas('h') }, { label: 'Voltear lienzo vertical', icon: 'flipv', disabled: need, action: () => IE.flipCanvas('v') },
      '-', { label: 'Recortar a la selección', disabled: need, action: IE.cropToSel }, { label: 'Recortar transparencia', disabled: need, action: IE.trim }, { label: 'Recortar para redes sociales…', icon: 'social', disabled: need, action: () => IE.runTool('social') },
      '-', { label: 'Quitar fondo…', icon: 'bg', disabled: need, action: IE.removeBgDialog }, { label: 'Cambiar / sustituir fondo…', disabled: need, action: IE.changeBgDialog }, { label: 'Marca de agua / logotipo…', icon: 'watermark', disabled: need, action: IE.watermarkDialog }, { label: 'Marco…', icon: 'frame', disabled: need, action: IE.frameDialog }, { label: 'Nuevo collage…', icon: 'collage', action: IE.collageDialog }],
    Capa: () => [
      { label: 'Nueva', icon: 'plus', disabled: need, sub: [{ label: 'Capa', key: 'Ctrl+Mayús+N', action: IE.newLayer }, { label: 'Capa vía copiar', key: 'Ctrl+J', action: () => IE.layerViaCopy(false) }, { label: 'Capa vía cortar', key: 'Ctrl+Mayús+J', action: () => IE.layerViaCopy(true) }, { label: 'Grupo', action: IE.groupLayers }, { label: 'Capa de relleno de color…', action: IE.fillLayerDialog }, { label: 'Añadir imagen como capa…', action: IE.placeDialog }] },
      { label: 'Nueva capa de ajuste', icon: 'adjust', disabled: need, sub: IE.adjLayerMenu() },
      ...IE.layerMenu().map(it => it === '-' || !it ? it : Object.assign({}, it, { disabled: need })),
      { label: 'Organizar', disabled: need, sub: [{ label: 'Traer al frente', key: 'Ctrl+Mayús+]', action: () => IE.arrange('front') }, { label: 'Hacia delante', key: 'Ctrl+]', action: () => IE.arrange('up') }, { label: 'Hacia atrás', key: 'Ctrl+[', action: () => IE.arrange('down') }, { label: 'Enviar al fondo', key: 'Ctrl+Mayús+[', action: () => IE.arrange('back') }] },
      { label: 'Alinear con el lienzo / selección', disabled: need, sub: [['left', 'Izquierda'], ['hcenter', 'Centro horizontal'], ['right', 'Derecha'], ['top', 'Arriba'], ['vcenter', 'Centro vertical'], ['bottom', 'Abajo']].map(([k, l]) => ({ label: l, action: () => IE.alignLayer(k) })) },
      { label: 'Acoplar imagen', disabled: need, action: IE.flattenImage }],
    Selección: () => [
      { label: 'Todo', key: 'Ctrl+A', disabled: need, action: IE.selectAll }, { label: 'Deseleccionar', key: 'Ctrl+D', disabled: need, action: IE.selectNone }, { label: 'Volver a seleccionar', key: 'Ctrl+Mayús+D', disabled: need, action: IE.reselect }, { label: 'Invertir', key: 'Ctrl+Mayús+I', disabled: need, action: IE.selInvert },
      '-', { label: 'Gama de colores…', disabled: need, action: IE.colorRange }, { label: 'Sujeto (automático)', disabled: need, action: () => IE.autoSubject(false) }, { label: 'Fondo (automático)', disabled: need, action: () => IE.autoSubject(true) }, { label: 'Cargar desde transparencia de la capa', disabled: need, action: () => IE.selFromLayer(IE.active()) },
      { label: 'Modificar', disabled: need, sub: [{ label: 'Expandir…', action: () => IE.selModify('expand') }, { label: 'Contraer…', action: () => IE.selModify('contract') }, { label: 'Desvanecer…', key: 'Mayús+F6', action: () => IE.selModify('feather') }, { label: 'Suavizar…', action: () => IE.selModify('smooth') }] }],
    Filtro: () => [{ label: 'Repetir último filtro', key: 'Ctrl+F', disabled: () => !IE.lastFilter || need(), action: () => IE.filterDialog(IE.lastFilter.key, true) }, '-'].concat(F.FILTER_MENU.map(([g, keys]) => ({ label: g, disabled: need, sub: keys.map(k => ({ label: F.filters[k].name + '…', action: () => IE.filterDialog(k) })) }))),
    Vista: () => [{ label: 'Acercar', icon: 'zoomin', key: 'Ctrl++', disabled: need, action: () => IE.zoomTo(IE.view.z * 1.25) }, { label: 'Alejar', icon: 'zoomout', key: 'Ctrl+-', disabled: need, action: () => IE.zoomTo(IE.view.z / 1.25) }, { label: 'Ajustar a pantalla', icon: 'fit', key: 'Ctrl+0', disabled: need, action: IE.fit }, { label: 'Píxeles reales (100 %)', key: 'Ctrl+1', disabled: need, action: () => IE.zoomTo(1) },
      '-', { label: 'Ver máscara en rojo', checked: () => !!IE.maskView, action: () => { IE.maskView = !IE.maskView; IE.render(); } }, { label: 'Pantalla completa', icon: 'full', key: 'F11', action: () => document.fullscreenElement ? document.exitFullscreen() : IE.el.root.requestFullscreen() }, { label: 'Mostrar/ocultar panel lateral', key: 'Tab', action: () => IE.el.right.classList.toggle('hidden') }, { label: 'Tema claro / oscuro', icon: 'sun', action: () => { FP.toggleTheme(); IE.render(); } }],
    Ayuda: () => [{ label: 'Atajos de teclado', icon: 'info', action: shortcuts }, { label: 'Limitaciones', icon: 'shield', action: limits }],
  });
  IE.keymap = function (e, m, k) {
    const s = e.shiftKey, a = e.altKey;
    if (m) {
      if (k === 'z') return s ? IE.redo : IE.undo; if (k === 'y') return IE.redo; if (k === 's') return s ? IE.exportDialog : IE.saveProject;
      if (k === 'a') return IE.selectAll; if (k === 'd') return s ? IE.reselect : IE.selectNone; if (k === 'i' && s) return IE.selInvert; if (k === 'i' && a) return IE.imageSizeDialog; if (k === 'c' && a) return IE.canvasSizeDialog;
      if (k === 'c') return () => IE.copy(s); if (k === 'x') return () => IE.copy(false, true); if (k === 'v') return IE.paste;
      if (k === 'j') return () => IE.layerViaCopy(s); if (k === 'e') return s ? IE.mergeVisible : IE.mergeDown; if (k === 'g') return s ? IE.ungroup : IE.groupLayers; if (k === 't') return () => IE.startTransform();
      if (k === 'f' && IE.lastFilter) return () => IE.filterDialog(IE.lastFilter.key, true);
      if (k === '+' || k === '=') return () => IE.zoomTo(IE.view.z * 1.25); if (k === '-') return () => IE.zoomTo(IE.view.z / 1.25); if (k === '0') return IE.fit; if (k === '1') return () => IE.zoomTo(1);
      if (k === ']') return () => IE.arrange(s ? 'front' : 'up'); if (k === '[') return () => IE.arrange(s ? 'back' : 'down');
      if (e.key === 'Backspace') return () => IE.fillDialog('bg');
      return null;
    }
    if (a && e.key === 'Backspace') return () => IE.fillDialog('fg');
    if (e.key === 'Delete' || e.key === 'Backspace') return () => IE.clearSel();
    if (e.key === 'F5' && s) return () => IE.fillDialog(); if (e.key === 'F6' && s) return () => IE.selModify('feather');
    if (k === 'x' && !s) return () => { [IE.fg, IE.bg] = [IE.bg, IE.fg]; IE.setFg(IE.fg); };
    if (k === 'd' && !s) return () => { IE.bg = '#ffffff'; IE.setFg('#000000'); };
    if (k === '[' || k === ']') return () => { const o = IE.O[IE.tool]; if (o && o.size) { o.size = FP.clamp(Math.round(o.size * (k === ']' ? 1.2 : 1 / 1.2)) + (k === ']' ? 1 : 0), 1, 1000); IE.renderOpt(); IE.render(); } };
    if (e.key === 'Escape') return () => { if (IE.d.sel) IE.selectNone(); };
    if (e.key === 'Tab') return () => IE.el.right.classList.toggle('hidden');
    if (e.key.startsWith('Arrow') && IE.tool === 'move') return () => { const l = IE.active(); if (!l || l.locked) return; const st = s ? 10 : 1; if (!IE._nudge) I.edit(IE.d, 'Mover', []); clearTimeout(IE._nudge); IE._nudge = setTimeout(() => IE._nudge = 0, 700); const dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0; const ts = l.type === 'group' ? I.flat({ layers: l.children }).concat([l]) : [l]; ts.forEach(t => { t.x += dx; t.y += dy; }); IE.dirtyComp(); };
    return null;
  };
  function shortcuts() {
    const rows = [['V', 'Mover (Ctrl: elegir capa bajo el cursor)'], ['M / L / W', 'Selección rectangular-elíptica / lazo / varita (Mayús alterna)'], ['C', 'Recortar'], ['I', 'Cuentagotas'], ['J', 'Correctores'], ['S', 'Tampón de clonar'], ['B', 'Pincel / lápiz'], ['E', 'Borrador'], ['G', 'Bote / degradado'], ['R', 'Desenfocar / enfocar / dedo'], ['T', 'Texto'], ['U', 'Formas'], ['H / Espacio', 'Mano'], ['Z', 'Zoom'], ['[ ]', 'Tamaño del pincel'], ['X / D', 'Intercambiar / colores por defecto'], ['Mayús / Alt al seleccionar', 'Añadir / restar a la selección'], ['Ctrl+T', 'Transformación libre (Intro aplica, Esc cancela)'], ['Ctrl+J', 'Capa vía copiar'], ['Ctrl+E / Ctrl+Mayús+E', 'Combinar abajo / visibles'], ['Ctrl+G', 'Agrupar'], ['Ctrl+A / D / Mayús+I', 'Seleccionar todo / deseleccionar / invertir'], ['Supr', 'Borrar selección'], ['Alt+Retroceso / Ctrl+Retroceso', 'Rellenar con frontal / fondo'], ['Ctrl+Z / Ctrl+Y', 'Deshacer / rehacer'], ['Ctrl+S / Ctrl+Mayús+S', 'Guardar proyecto / exportar'], ['Ctrl+0 / Ctrl+1', 'Ajustar / 100 %'], ['Rueda', 'Zoom (Mayús: desplazamiento horizontal)'], ['Tab', 'Ocultar paneles']];
    FP.modal({ title: 'Atajos de teclado', icon: 'info', size: 'wide', body: h('table', { style: { width: '100%' } }, rows.map(r => h('tr', null, h('td', { class: 'kbd', style: { padding: '3px 14px 3px 0', color: 'var(--tx)', whiteSpace: 'nowrap' } }, r[0]), h('td', null, r[1])))) });
  }
  function limits() {
    FP.alert(`<p>Todo se procesa localmente en tu navegador; las imágenes no se suben a ningún servidor.</p>
      <p><b>Formatos:</b> GIF se abre como imagen estática (primer fotograma). TIFF: sin compresión, LZW, PackBits y Deflate (no JPEG‑en‑TIFF). SVG se rasteriza a la escala elegida. La exportación TIFF es sin compresión.</p>
      <p><b>Quitar fondo y selección de objetos</b> usan análisis de color desde los bordes: funcionan muy bien con fondos uniformes; con fondos complejos conviene afinar a mano con la máscara.</p>
      <p><b>Relleno según contenido</b> usa síntesis por parches: ideal para objetos pequeños sobre fondos con textura regular.</p>
      <p><b>Límites de tamaño:</b> dependen de la memoria del navegador (≈ 16000 px por lado como máximo; por encima de 8000×8000 puede ir lento).</p>
      <p><b>Capas de texto</b> usan las fuentes instaladas en tu equipo o las que cargues (TTF/OTF/WOFF), que se guardan dentro del proyecto.</p>`, 'Limitaciones');
  }
})();
