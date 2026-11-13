/* FOTOPEA · pantalla principal */
(function () {
  'use strict';
  const { h, icon } = FP;

  const IMG_TOOLS = [
    ['new', 'Lienzo nuevo', 'Documento en blanco con capas', 'plus'],
    ['removebg', 'Quitar fondo', 'Selección automática del fondo', 'bg'],
    ['resize', 'Redimensionar', 'Tamaño, resolución y proporción', 'resize'],
    ['collage', 'Collage', 'Composición en cuadrícula', 'collage'],
    ['social', 'Recorte para redes', 'Instagram, YouTube, X…', 'social'],
    ['convert', 'Convertir imagen', 'PNG, JPG, WEBP, BMP, TIFF, PDF', 'swap'],
    ['watermark', 'Marca de agua', 'Texto o logotipo, también en mosaico', 'watermark'],
    ['frame', 'Marcos', 'Borde, paspartú, polaroid, esquinas', 'frame'],
  ];

  async function runImgTool(id) {
    await FP.ensureEditor();
    if (id === 'new') { await FP.show('img'); return FP.views.img.newDocDialog(); }
    if (id === 'collage') { await FP.show('img'); return FP.views.img.collageDialog(); }
    const files = await FP.pickFiles('image/*,.tif,.tiff,.svg', false); if (!files.length) return;
    await FP.show('img'); await FP.views.img.openFiles(files);
    await FP.views.img.runTool(id);
  }

  function toolCard(t, fn) { return h('button', { class: 'tool', onclick: () => fn(t[0]).catch(e => FP.error(e)) }, icon(t[3]), h('div', null, h('b', null, t[1]), h('span', null, t[2]))); }

  async function renderRecents(box) {
    box.innerHTML = '';
    if (!FP.settings.recents) { box.appendChild(h('div', { class: 'muted small' }, 'El historial de archivos recientes está desactivado.')); return; }
    const all = (await FP.db.all('recent')).filter(r => r.kind === 'img').sort((a, b) => b.date - a.date);
    if (!all.length) { box.appendChild(h('div', { class: 'muted small' }, 'Aún no has abierto archivos. Se guardan solo en este navegador.')); return; }
    const grid = h('div', { class: 'recent' });
    all.forEach(r => {
      const th = h('div', { class: 'th', style: r.thumb ? { backgroundImage: `url(${r.thumb})` } : null }, r.thumb ? null : icon('image'));
      const el = h('div', { class: 'rc', 'data-tip': r.blob ? 'Abrir' : 'El archivo no se guardó: vuelve a seleccionarlo' }, th,
        h('div', { class: 'nm' }, r.name), h('div', { class: 'dt' }, new Date(r.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) + ' · ' + FP.fmtBytes(r.size)),
        h('button', { class: 'x', 'data-tip': 'Quitar de recientes', onclick: async (e) => { e.stopPropagation(); await FP.db.del('recent', r.id); renderRecents(box); } }, icon('x', 's')));
      el.addEventListener('click', async () => {
        if (r.blob) { const f = new File([r.blob], r.name, { type: r.blob.type }); FP.openFiles([f]).catch(e => FP.error(e)); }
        else { const fs = await FP.pickFiles('image/*,.tif,.tiff,.svg'); if (fs.length) FP.openFiles(fs); }
      });
      grid.appendChild(el);
    });
    box.appendChild(grid);
  }

  async function autosaves(box) {
    box.innerHTML = '';
    const list = (await FP.db.all('autosave')).filter(a => a.kind === 'img');
    if (!list.length) { box.closest('.sect').classList.add('hidden'); return; }
    box.closest('.sect').classList.remove('hidden');
    const grid = h('div', { class: 'recent' });
    list.sort((a, b) => b.date - a.date).forEach(a => {
      grid.appendChild(h('div', { class: 'rc', onclick: async () => { await FP.ensureEditor(); await FP.show('img'); FP.views.img.restoreAutosave(a); } },
        h('div', { class: 'th', style: a.thumb ? { backgroundImage: `url(${a.thumb})` } : null }), h('div', { class: 'nm' }, '↺ ' + a.name), h('div', { class: 'dt' }, 'Recuperar · ' + new Date(a.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })),
        h('button', { class: 'x', 'data-tip': 'Descartar', onclick: async (e) => { e.stopPropagation(); await FP.db.del('autosave', a.id); autosaves(box); } }, icon('x', 's'))));
    });
    box.appendChild(grid);
  }

  async function privacyDialog() {
    const v = await FP.dialog('Privacidad y almacenamiento local', [
      { type: 'note', html: 'FOTOPEA procesa tus imágenes <b>en tu navegador</b>. No se envían a ningún servidor.' },
      { key: 'recents', type: 'checkbox', label: 'Recordar archivos recientes en este navegador', value: FP.settings.recents },
      { key: 'recentsKeepFile', type: 'checkbox', label: 'Guardar una copia local para reabrirlos con un clic (máx. 80 MB por archivo)', value: FP.settings.recentsKeepFile },
      { key: 'autosave', type: 'checkbox', label: 'Autoguardado local de proyectos (recuperación tras cierre inesperado)', value: FP.settings.autosave },
      { type: 'note', kind: 'warn', text: 'En ordenadores compartidos desactiva estas opciones y pulsa «Borrar datos locales».' },
    ], { icon: 'shield' });
    if (!v) return;
    Object.assign(FP.settings, v); FP.saveSettings();
    if (!v.recentsKeepFile) { const all = await FP.db.all('recent'); for (const r of all) { delete r.blob; await FP.db.put('recent', r); } }
    if (!v.autosave) await FP.db.clear('autosave');
    render();
  }
  async function clearLocal() {
    if (!await FP.confirm('Se borrarán los archivos recientes y los autoguardados de este navegador.', 'Borrar datos locales', 'Borrar', true)) return;
    for (const s of ['recent', 'autosave']) await FP.db.clear(s);
    FP.toast('Datos locales borrados', 'ok'); render();
  }

  function render() {
    const v = FP.$('#view-home'); v.innerHTML = '';
    const drop = h('div', { class: 'drop' }, icon('upload'), h('h3', null, 'Arrastra aquí tus archivos'),
      h('div', { class: 'muted' }, 'JPG, PNG, WEBP, GIF, BMP, TIFF, SVG o proyectos .fotopea'),
      h('div', { style: { marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' } },
        h('button', { class: 'btn pri', onclick: async () => { const f = await FP.pickFiles('image/*,.tif,.tiff,.svg,.fotopea', true); FP.openFiles(f).catch(e => FP.error(e)); } }, icon('folder', 's'), 'Seleccionar archivos')));
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
    drop.addEventListener('drop', (e) => { e.preventDefault(); FP.openFiles(e.dataTransfer.files).catch(err => FP.error(err)); });

    const recBox = h('div'), autoBox = h('div');
    v.append(
      h('div', { class: 'home-top' }, h('div', { class: 'logo' }, h('div', { class: 'mark' }, 'F'), 'FOTOPEA'), h('div', { class: 'sp' }),
        h('button', { class: 'ibtn', 'data-tip': 'Privacidad y almacenamiento', onclick: privacyDialog }, icon('shield')),
        h('button', { class: 'ibtn', 'data-tip': 'Cambiar tema claro/oscuro', onclick: () => { FP.toggleTheme(); render(); } }, icon(FP.settings.theme === 'dark' ? 'sun' : 'moon'))),
      h('div', { class: 'home-main' },
        h('div', { class: 'hero' }, h('h1', { html: 'Edita tus fotos e imágenes, <b>sin instalar nada</b>' }),
          h('p', null, 'FOTOPEA es un editor de imágenes profesional, inspirado en Photoshop, que funciona en tu navegador. Tus imágenes se procesan en tu dispositivo: no se suben a ningún servidor.')),
        h('div', { class: 'cards one' },
          h('div', { class: 'card', onclick: (e) => { if (!e.target.closest('button')) openImg(); } },
            h('div', { class: 'ci', style: { background: 'rgba(74,163,255,.15)', color: '#4aa3ff' } }, icon('image')), h('h2', null, 'Editor de imágenes'),
            h('p', null, 'Capas y grupos, máscaras, selecciones, pinceles, clonado y corrector, transformaciones con perspectiva, ajustes no destructivos, filtros, texto y proyectos editables.'),
            h('div', { class: 'acts' }, h('button', { class: 'btn pri', onclick: openImg }, icon('folder', 's'), 'Abrir imagen'),
              h('button', { class: 'btn', onclick: () => runImgTool('new').catch(e => FP.error(e)) }, icon('plus', 's'), 'Lienzo nuevo')))),
        drop,
        h('div', { class: 'sect hidden' }, h('h3', null, 'Recuperar trabajo sin guardar'), autoBox),
        h('div', { class: 'sect' }, h('h3', null, 'Herramientas'), h('div', { class: 'tools' }, IMG_TOOLS.map(t => toolCard(t, runImgTool)))),
        h('div', { class: 'sect' }, h('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, 'Archivos recientes', h('button', { class: 'btn sm ghost', onclick: clearLocal }, icon('trash', 's'), 'Borrar datos locales')), recBox),
        h('div', { class: 'foot' }, 'FOTOPEA ' + FP.version + ' · Editor de imágenes · Procesamiento local en el navegador · pdf-lib y JSZip (código abierto)')));
    renderRecents(recBox); autosaves(autoBox);
  }
  async function openImg() { const f = await FP.pickFiles('image/*,.tif,.tiff,.svg,.fotopea', true); if (f.length) FP.openFiles(f).catch(e => FP.error(e)); }

  FP.views.home = { show: () => render() };
  FP.views.home.show();
  FP.current = 'home';
  const hsh = location.hash.slice(1);
  if (hsh === 'img') { FP.ensureEditor().then(() => FP.show('img')); }
})();
