# FOTOPEA 1.0.0

Editor de PDF e imágenes que funciona en el navegador. Los archivos se procesan en tu equipo y no se suben a ningún servidor.

## Cómo usarlo

**En tu ordenador:** descomprime la carpeta y abre `index.html` con Chrome o Edge (doble clic). Funciona sin conexión, salvo el OCR, que la primera vez descarga los modelos de idioma.

**En Internet (gratis):** sube la carpeta completa a cualquier alojamiento de webs estáticas, por ejemplo:
- **Netlify Drop** (app.netlify.com/drop): arrastra la carpeta y obtienes una URL al momento.
- **GitHub Pages**: sube la carpeta a un repositorio y activa Pages.
- **Cloudflare Pages** o cualquier servidor web.

No hace falta instalar Node, Python ni nada más.

## Estructura

```
index.html               Página principal (lo único que se carga al principio)
css/app.css              Estilos (tema oscuro y claro)
js/core/core.js          Núcleo: interfaz común, diálogos, carga diferida, IndexedDB, detección de formatos
js/home.js               Pantalla de inicio
js/pdf/pdf-ops.js        Motor PDF: exportación, conversión, compresión, páginas, OCR, imágenes
js/pdf/pdf-editor.js     Interfaz del editor PDF
js/pdf/pdfcrypt.js       Cifrado AES-256 y descifrado RC4/AES (propio, probado con qpdf)
js/img/img-core.js       Documento de imagen: capas, máscaras, selección, historial, composición, deformaciones
js/img/filters.js        Ajustes y filtros
js/img/img-editor.js     Interfaz del editor de imágenes y herramientas
js/img/img-dialogs.js    Menús, diálogos, exportación y proyectos
js/img/tiff.js           Lector y escritor de TIFF
vendor/                  PDF.js 6.2, pdf-lib 1.17, JSZip 3.10 (incluidas: no dependen de CDN)
```

Cada editor se carga solo cuando se usa. Tesseract.js (OCR) se descarga del CDN jsDelivr únicamente al lanzar un OCR.

## Qué incluye

### Editor PDF
- **Visor**: miniaturas, zoom, ajustar a página o ancho, navegación, búsqueda (también en texto OCR), pantalla completa, rotación.
- **Contenido añadido**: texto (Helvetica, Times o Courier; negrita, cursiva y subrayado; tamaño, color y alineación), imágenes (mover, redimensionar, recortar, girar o sustituir), rectángulos, elipses, líneas, flechas, mano alzada, corrector blanco, resaltado, subrayado, tachado, notas adhesivas (anotación PDF real), enlaces (web o a página), firma visual (dibujada, escrita o importada, con eliminación del fondo).
- **Edición de texto existente**: sustitución visual, que tapa el original y escribe encima. Se indica siempre como superposición.
- **Imágenes existentes**: extraer en calidad original (los JPEG salen tal cual), y **sustituir o eliminar de verdad** en el contenido del PDF cuando son XObjects directos de la página.
- **Sellos**: marca de agua (texto o imagen), numeración de páginas (con número y página inicial), encabezado y pie, aplicables por rangos.
- **Formularios**: rellenar campos existentes y crear campos AcroForm reales (texto, casilla, botón de opción y lista desplegable).
- **Páginas**: añadir en blanco, eliminar, duplicar, reordenar arrastrando (también soltando archivos), extraer, dividir, combinar, insertar desde otro PDF, rotar, cambiar el tamaño, recortar márgenes (CropBox), detectar páginas en blanco y vista Organizar.
- **Conversión**: PDF a JPG, PNG o WEBP (resolución y calidad, en ZIP); imágenes (JPG, PNG, WEBP, GIF, BMP, TIFF y SVG) y TXT a PDF.
- **Optimización y seguridad**: compresión sin pérdida, recompresión de imágenes (el texto sigue siendo texto) o rasterización; metadatos (ver, editar o eliminar, XMP incluido); contraseña y permisos con **AES-256 real**; apertura de PDF cifrados conociendo la contraseña; aplanado de formularios y de anotaciones vectoriales; reparación; extracción de texto e imágenes.
- **OCR** con Tesseract.js: varios idiomas (español por defecto), multipágina, exportación del texto y capa de texto invisible al guardar, para que el escaneado sea seleccionable y buscable.
- **Proyecto `.fpdf`**: guarda el PDF original y todas las modificaciones sin aplanar.

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
Historial con deshacer y rehacer en ambos editores, autoguardado local (se puede desactivar), archivos recientes guardados solo en el navegador (se pueden borrar), confirmación antes de cerrar con cambios, atajos de teclado, tema claro y oscuro, paneles redimensionables e interfaz adaptable.

## Limitaciones (explicadas con honestidad)
- **Texto original de un PDF**: no se reescribe el flujo de contenido, porque las fuentes incrustadas suelen ser parciales y no contienen las letras nuevas. Se ofrece la sustitución visual.
- **Fuentes del texto nuevo en PDF**: se usan las 14 estándar. Los caracteres fuera de Latin-1 (por ejemplo, emojis) se sustituyen por «?».
- **Firma**: es visual. Una firma electrónica cualificada o criptográfica (PAdES) necesita un certificado y software como AutoFirma.
- **Quitar fondo y selección de objetos**: funcionan analizando el color desde los bordes. Van muy bien con fondos uniformes; con fondos complejos hay que afinar con la máscara.
- **Relleno según contenido**: síntesis por parches, ideal para objetos pequeños.
- **GIF animado**: solo se abre el primer fotograma. **TIFF**: no admite la variante con compresión JPEG.
- **Tamaño**: lo limita la memoria del navegador (unos 16 000 px por lado como máximo; documentos de cientos de MB pueden ir lentos).

## Licencias de terceros
PDF.js (Apache 2.0), pdf-lib (MIT), JSZip (MIT o GPLv3) y Tesseract.js (Apache 2.0, se carga desde CDN).
