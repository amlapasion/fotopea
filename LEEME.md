# FOTOPEA 1.1.0

Editor de imágenes avanzado, inspirado en Photoshop, que funciona en el navegador. Las imágenes se procesan en tu equipo y no se suben a ningún servidor.

> **Cambio en 1.1.0:** el editor PDF se ha trasladado al proyecto independiente **YO AMO EL PEDEFE**. FOTOPEA queda dedicado exclusivamente a la edición de imágenes y no depende de ese proyecto. Se han eliminado PDF.js, el cifrado PDF y Tesseract (eran exclusivos del editor PDF). Se conservan pdf-lib (para **exportar imágenes a PDF**) y JSZip (para los proyectos `.fotopea`).

## Cómo usarlo

**En tu ordenador:** descomprime la carpeta y abre `index.html` con Chrome o Edge (doble clic). Funciona sin conexión.

**En Internet (gratis):** sube la carpeta completa a cualquier alojamiento de webs estáticas (Netlify Drop, GitHub Pages, Cloudflare Pages…).

## Estructura

```
index.html               Página principal
css/app.css              Estilos (tema oscuro y claro)
js/core/core.js          Núcleo: interfaz común, diálogos, carga diferida, IndexedDB, detección de formatos
js/home.js               Pantalla de inicio
js/img/img-core.js       Documento: capas, máscaras, selección, historial, composición, deformaciones
js/img/filters.js        Ajustes y filtros
js/img/img-editor.js     Interfaz del editor y herramientas
js/img/img-dialogs.js    Menús, diálogos, exportación y proyectos
js/img/tiff.js           Lector y escritor de TIFF
vendor/                  pdf-lib 1.17 (exportar a PDF) y JSZip 3.10 (proyectos)
```

## Qué incluye
### Editor de imágenes
- **Formatos**: abre JPG, PNG, WEBP, GIF (estático), BMP, TIFF y SVG (rasterizado a la escala que elijas). Exporta a PNG y JPG (con los ppp guardados), WEBP, BMP, TIFF y PDF, con opción de escala o de exportar solo la capa o la selección.
- **Selección**: rectangular, elíptica, lazo, lazo poligonal, varita mágica, selección de objetos, gama de colores, sujeto o fondo automáticos; añadir, restar o intersecar; invertir, expandir, contraer, desvanecer y suavizar; mover píxeles seleccionados; copiar, cortar y pegar (también desde el portapapeles del sistema).
- **Pintura**: pincel (tamaño, dureza, opacidad y flujo), lápiz, borrador, tampón de clonar, pincel corrector, corrector puntual que elimina objetos, desenfocar, enfocar, dedo, bote de pintura, degradado lineal o radial, cuentagotas, texto y formas (rectángulo, redondeado, elipse, polígono, estrella, línea y flecha).
- **Capas**: crear, eliminar, duplicar, renombrar, reordenar arrastrando, ocultar, bloquear, opacidad, 16 modos de fusión, grupos, combinar hacia abajo o visibles, acoplar, capas de texto editables, capas de ajuste no destructivas, máscaras de capa (pintables) y estilos (sombra, resplandor, trazo y superposición de color).
- **Transformación**: escalar, rotar, inclinar, distorsionar, perspectiva, voltear, tamaño de imagen o de lienzo, resolución, rotar el lienzo a cualquier ángulo y recortar (con formatos para redes sociales).
- **Ajustes**: brillo y contraste, exposición, niveles, curvas, tono y saturación, intensidad, temperatura y matiz, equilibrio de color, sombras e iluminaciones, blanco y negro, sepia, invertir, posterizar, umbral, transparencia, color a transparencia, tono y balance de blancos automáticos.
- **Filtros**: desenfoque gaussiano, de movimiento y radial; máscara de enfoque; ruido y mediana; relieve; bordes; solarizar; pintura; resplandor difuso; pixelado; mosaico; remolino; esferizar; ondas; rizo; duotono; vintage; proceso cruzado; viñeta.
- **Extras**: quitar o cambiar el fondo, marca de agua o logotipo (también en mosaico), marcos, collage, relleno según contenido y fuentes propias (TTF, OTF o WOFF, guardadas en el proyecto).
- **Proyecto `.fotopea`**: conserva capas, máscaras, estilos, texto editable, capas de ajuste, selección y fuentes.

### General
Historial con deshacer y rehacer, autoguardado local (se puede desactivar), archivos recientes guardados solo en el navegador (se pueden borrar), confirmación antes de cerrar con cambios, atajos de teclado, tema claro y oscuro, paneles redimensionables e interfaz adaptable.

## Limitaciones
- **Quitar fondo y selección de objetos**: analizan el color desde los bordes. Van muy bien con fondos uniformes; con fondos complejos hay que afinar con la máscara.
- **Relleno según contenido**: síntesis por parches, ideal para objetos pequeños.
- **GIF animado**: solo se abre el primer fotograma. **TIFF**: no admite la variante con compresión JPEG.
- **PDF**: FOTOPEA no abre PDF (usa YO AMO EL PEDEFE), pero sí exporta imágenes a PDF.
- **Tamaño**: lo limita la memoria del navegador (unos 16 000 px por lado como máximo).

## Licencias de terceros
pdf-lib (MIT) y JSZip (MIT o GPLv3).
