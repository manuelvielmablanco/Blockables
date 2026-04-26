# Blockables — Sistema de Diseño
*Guía para Claude Design / diseñadores UI*

---

## 1. Contexto del producto

**Blockables** (también llamado **Ingeniables Blocks**) es un editor de programación visual por bloques para Arduino dirigido a estudiantes de primaria y secundaria. Usa Google Blockly para arrastrar bloques y genera código C++ que se puede subir directamente a la placa.

### Estructura de la interfaz actual
```
┌─────────────────────────────────────────────────────────┐
│  TopBar: logo · nombre proyecto · placa · acciones      │
├────────────────┬────────────────────────────────────────┤
│                │                                        │
│  Toolbox       │  Workspace (Blockly)                   │
│  (categorías   │  (área de arrastre de bloques)         │
│   de bloques)  │                                        │
│                ├────────────────────────────────────────┤
│                │  CodeViewer (panel lateral derecho,    │
│                │  toggle, muestra código Arduino)       │
└────────────────┴────────────────────────────────────────┘
│  SerialMonitor (panel inferior, toggle)                 │
└─────────────────────────────────────────────────────────┘
```

Los componentes principales son:
- `src/components/layout/TopBar.tsx` — barra superior
- `src/components/layout/WorkspaceArea.tsx` — área Blockly
- `src/components/layout/CodeViewer.tsx` — visor de código
- `src/components/layout/FileMenu.tsx` — menú hamburguesa
- `src/components/layout/BoardSelector.tsx` — selector de placa
- `src/components/dialogs/UploadDialog.tsx` — subida a Arduino
- `src/components/dialogs/ExamplesDialog.tsx` — ejemplos
- `src/components/serial/SerialMonitor.tsx` — monitor serie

---

## 2. Identidad de marca Ingeniables

### 2.1 Logotipo
- Wordmark "Ingeniables" en **Paytone One** weight regular (display bold por diseño de la fuente)
- La "i" también funciona como ícono standalone (emblem)
- Archivo SVG: `src/logo-ingeniables.svg`
- Colores del logo: negro `#1e1e1c` sobre fondo claro, o blanco sobre fondo oscuro

### 2.2 Paleta de colores

La marca tiene **4 familias cromáticas**, cada una asociada a un área STEM y a un personaje Minin.

#### 🟡 Amarillo — Ciencia (Minin Amarillo)
| Rol | Hex | Uso sugerido |
|-----|-----|-------------|
| Contraste | `#f4951b` | Alertas, hover énfasis |
| Profundidad | `#fab511` | Bordes activos |
| **Principal** | `#ffd002` | **Color primario UI, botones, highlights** |
| Luz | `#ffef67` | Badges, chips |
| Acento suave | `#fcf8cd` | Fondos de tarjetas en hover |
| Pastel fondo | `#fffdee` | Fondos de secciones |

#### 🩵 Turquesa — Ingeniería (Minin Turquesa) ← *color identitario de Blockables*
| Rol | Hex | Uso sugerido |
|-----|-----|-------------|
| Contraste | `#003f46` | Texto sobre turquesa, sombras |
| Profundidad | `#4e9995` | Sidebar activo, iconos |
| **Principal** | `#63c0bb` | **Color secundario UI, toolbox, categorías** |
| Luz | `#99d3d7` | Estados hover sobre turquesa |
| Acento suave | `#cee9ee` | Fondos de panel |
| Pastel fondo | `#ebf5f4` | Background del workspace |

#### 🔵 Azul — Matemáticas (Minin Azul)
| Rol | Hex | Uso sugerido |
|-----|-----|-------------|
| Contraste | `#2a366b` | Texto oscuro, cabeceras |
| Profundidad | `#244b95` | Botones secundarios |
| **Principal** | `#4a7abd` | **Acciones terciarias, links** |
| Luz | `#7db1e0` | Iconos informativos |
| Acento suave | `#bde4fa` | Info chips |
| Pastel fondo | `#ecf7fe` | Fondos de diálogos |

#### 🔴 Rojo — Tecnología (Minin Rojo)
| Rol | Hex | Uso sugerido |
|-----|-----|-------------|
| Contraste | `#c0110d` | Error crítico |
| Profundidad | `#db3815` | Botón destructivo hover |
| **Principal** | `#e94d27` | **Error, advertencia, acción peligrosa** |
| Luz | `#ef7c60` | Toast de error |
| Acento suave | `#f7bbb0` | Fondo de error suave |
| Pastel fondo | `#fef5f6` | Fondo de sección de error |

#### Neutrales
| Nombre | Hex |
|--------|-----|
| Negro marca | `#1e1e1c` |
| Gris texto | `#3d3d3b` |
| Gris medio | `#7a7a78` |
| Gris borde | `#d4d4d2` |
| Gris fondo | `#f0f0ee` |
| Blanco | `#ffffff` |

### 2.3 Tipografía

| Fuente | Uso | Archivo |
|--------|-----|---------|
| **Paytone One** | Logo, títulos hero, nombres de sección grandes | `PaytoneOne-Regular.ttf` |
| **Noto Sans** (variable) | UI general: labels, botones, cuerpo | `NotoSans-VariableFont_wdth,wght.ttf` |
| **Noto Serif** (variable) | Citas, tooltips, texto explicativo largo | `NotoSerif-VariableFont_wdth,wght.ttf` |

**Escala tipográfica sugerida:**
```
display:   Paytone One  32px / bold
h1:        Paytone One  24px / bold
h2:        Noto Sans    18px / 700
h3:        Noto Sans    15px / 600
body:      Noto Sans    14px / 400
small:     Noto Sans    12px / 400
code:      monospace    13px / 400
```

---

## 3. Los personajes Minins

Los Minins son el alma visual de la marca. Cada uno tiene una forma geométrica de cuerpo, un color y una personalidad.

### Fichas de personajes

| Personaje | Color | Forma | Personalidad | Área STEM |
|-----------|-------|-------|-------------|-----------|
| **Minin Amarillo** | `#ffd002` | Círculo | Curioso · Alegre · Paciente · Observador | Ciencia |
| **Minin Turquesa** | `#63c0bb` | Rectángulo | Perfeccionista · Práctico · Organizado · Resiliente | Ingeniería |
| **Minin Azul** | `#4a7abd` | Trapezoide | Objetivo · Pensador · Preciso · Siempre presente | Matemáticas |
| **Minin Rojo** | `#e94d27` | Triángulo | Ágil · Rápido · Moderno · Experto en comunicación | Tecnología |

### Archivos PNG disponibles (app-ready, 72ppp)

**Minin Turquesa** (el más relevante para Blockables = Ingeniería):
```
characters/004_Ilustraciones app/003_Minin turquesa/imágenes_v0/
  minin_turquesa.png               ← pose neutral / idle
  minin_turquesa_contento.png      ← feliz, éxito
  minin_turquesa_cansado.png       ← estado de espera larga
  minin_turquesa_costipado.png     ← error, algo va mal
  minin_turquesa_programando.png   ← escribiendo código ← HERO
  minin_turquesa_tablet.png        ← usando dispositivo
  minin_turquesa_leyendo.png       ← tutoriales, ayuda
  minin_tuquesa_cables.png         ← conexión hardware
  minin_turquesa_casco_protección.png ← modo seguro, advertencia
  minin_turquesa_franky_auto.png   ← con el robot Franky
  minin_turquesa_franky_control.png
  minin_turquesa_manual_app.png    ← usando la app
  minin_turquesa_tellurion.png     ← proyecto avanzado
  minin_turquesa_tellurion_libro.png
```

**Objetos decorativos disponibles:**
```
characters/004_Ilustraciones app/005_objetos/imágenes_v0/
  bombilla.png, engranajes.png, placa.png, cohete.png,
  ordenador_amarillo/azul/verde.png, tablet.png,
  libro_abierto.png, invento.png, franky_frontal.png ...
```

---

## 4. Guía de uso de los Minins en la UI

### Principios
- Los Minins **no flotan**: siempre tienen una sombra circular debajo (color oscuro de su paleta al 50% opacidad)
- Tamaño mínimo: 80×80px para que los detalles sean legibles
- Siempre PNG con transparencia, nunca recortados en cuadrado
- El Minin principal de Blockables es el **Turquesa** (Ingeniería)

### Dónde aparecen y con qué pose

| Ubicación | Minin | Pose | Cuándo |
|-----------|-------|------|--------|
| **Pantalla de bienvenida / splash** | Turquesa | `programando.png` | Siempre |
| **Estado vacío del workspace** | Turquesa | `minin_turquesa.png` (idle) | Workspace sin bloques |
| **Compilación en progreso** | Turquesa | `cansado.png` + spinner | Durante build/upload |
| **Upload exitoso** | Turquesa | `contento.png` | Código subido con éxito |
| **Error de compilación** | Turquesa | `costipado.png` | Error en código |
| **Sección de ejemplos** | Turquesa | `manual_app.png` | Diálogo de ejemplos |
| **Conexión a hardware** | Turquesa | `cables.png` | Dialog de conexión serie |
| **Tooltip / ayuda** | Turquesa | `leyendo.png` | Tooltips de bloques complejos |
| **Esquina del toolbox** (decorativo) | Turquesa pequeño | cualquiera | Estático, decorativo |

### Animaciones sugeridas (CSS)

```css
/* Idle float — workspace vacío */
@keyframes minin-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

/* Happy bounce — upload exitoso */
@keyframes minin-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  30%       { transform: translateY(-16px) scale(1.05); }
  60%       { transform: translateY(-6px) scale(0.98); }
}

/* Thinking — compilando */
@keyframes minin-think {
  0%, 100% { transform: rotate(0deg); }
  25%       { transform: rotate(-3deg); }
  75%       { transform: rotate(3deg); }
}

/* Shake — error */
@keyframes minin-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
```

---

## 5. Componentes UI — Especificación

### 5.1 TopBar

**Estado actual:** barra blanca plana con logo, nombre de proyecto, selector de placa, botones de acción.

**Diseño propuesto:**
- Fondo: `#1e1e1c` (negro marca) o degradado sutil `#003f46 → #1e1e1c`
- Logo Ingeniables en blanco + "Blocks" en turquesa `#63c0bb`
- Nombre del proyecto: input inline con borde turquesa al enfocar
- Separadores sutiles entre grupos de botones
- Altura: 52px
- Minin Turquesa pequeño (32px) como favicon animado cuando compila

**Botones principales:**
```
[Conectar]   bg:#63c0bb  text:white   hover:bg:#4e9995   icon: USB plug
[Monitor]    bg:transparent  border:#63c0bb  text:#63c0bb  (toggle)
[Subir]      bg:#ffd002  text:#1e1e1c  hover:bg:#f4951b  icon: upload arrow
```

**Botón "Conectar" estados:**
- Desconectado: `#63c0bb` — "Conectar"
- Conectando: spinner + `#4e9995` — "Conectando…"
- Conectado: `#4e9995` con punto verde ● — "Conectado"
- Error: `#e94d27` — "Error"

### 5.2 Toolbox (panel lateral izquierdo)

**Estado actual:** lista de categorías con colores de Blockly.

**Diseño propuesto:**
- Ancho: 160px (actual) → considerar 180px con iconos
- Fondo: `#ebf5f4` (pastel turquesa)
- Categoría activa: fondo `#63c0bb`, texto blanco, borde izquierdo 4px `#003f46`
- Categoría hover: fondo `#cee9ee`
- Texto categorías: Noto Sans 13px / 600
- Cada categoría lleva un pequeño icono SVG a su izquierda (ya existen algunos)
- Borde derecho sutil: `1px solid #d4d4d2`

### 5.3 Workspace (área Blockly)

- Fondo: `#f8fafa` (casi blanco con tinte turquesa muy leve) o cuadrícula de puntos sutiles `#e0ebe9`
- Botones de zoom: estilo redondeado, fondo blanco, sombra `0 2px 8px rgba(0,63,70,0.12)`
- Bloques de Arduino: mantener los estilos actuales de Blockly (ya están bien configurados)

**Estado vacío (empty state):**
```
[Minin Turquesa - programando.png, 200px, animación float]
      "Arrastra bloques para empezar"
      Noto Serif italic, 18px, color #4e9995
```

### 5.4 CodeViewer (panel de código)

- Ancho: 380px (panel derecho toggle)
- Fondo: `#1e1e1c`
- Header: "Código Arduino" en Noto Sans 13px / 600, color `#63c0bb`
- Botón "Copiar": pequeño, esquina superior derecha
- Código: fuente monospace, syntax highlighting (ya usa Prism)
- Borde izquierdo: `1px solid #003f46`

### 5.5 Diálogos (Ejemplos, Upload)

- Overlay: `rgba(0,63,70,0.4)` backdrop blur 4px
- Panel: fondo blanco, border-radius 16px, sombra `0 24px 48px rgba(0,63,70,0.2)`
- Header del diálogo: fondo `#ebf5f4`, con Minin pequeño a la derecha
- Botón primario: `#ffd002` texto `#1e1e1c`
- Botón secundario: borde `#63c0bb` texto `#63c0bb`
- Botón de cierre: ×, esquina superior derecha, 32×32px

**Diálogo de ejemplos:**
- Cards de ejemplos en grid 2×N
- Card: fondo blanco, borde `1px solid #d4d4d2`, radius 12px
- Card hover: borde `#63c0bb`, sombra suave, elevación
- Minin Turquesa `manual_app.png` en cabecera del diálogo (100px)

**Diálogo de subida (Upload):**
- Progreso: barra con fondo `#cee9ee` y relleno `#63c0bb`
- Éxito: Minin `contento.png` con animación bounce
- Error: Minin `costipado.png` con animación shake
- Texto de estado: Noto Serif italic

### 5.6 SerialMonitor (panel inferior)

- Fondo: `#1e1e1c` (igual que CodeViewer, coherencia "terminal")
- Header: "Monitor Serie" en `#63c0bb`
- Texto entrante: `#d4d4d2` (blanco suave)
- Texto enviado: `#ffd002` (amarillo)
- Input: fondo `#2d2d2b`, borde `#4e9995`, texto blanco
- Botón enviar: `#63c0bb`

### 5.7 FileMenu (menú hamburguesa)

- Dropdown con fondo blanco, sombra, radius 12px
- Items: 44px de alto, icono a la izquierda
- Separadores entre grupos
- Hover: fondo `#ebf5f4`

---

## 6. Espaciado y radios

```
Espaciado base: 4px (grid de 4)
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px

Border radius:
sm:   6px   (inputs, chips)
md:   10px  (botones, cards pequeñas)
lg:   16px  (diálogos, paneles)
full: 9999px (pills, badges)
```

---

## 7. Sombras

```css
/* Elevación baja — cards, botones */
shadow-sm: 0 2px 8px rgba(0, 63, 70, 0.10);

/* Elevación media — dropdowns, tooltips */
shadow-md: 0 8px 24px rgba(0, 63, 70, 0.14);

/* Elevación alta — diálogos modales */
shadow-lg: 0 24px 48px rgba(0, 63, 70, 0.20);
```

---

## 8. Estados de interacción

| Estado | Transformación |
|--------|---------------|
| hover | brightness(0.92) + sombra suave |
| active/pressed | scale(0.97) + brightness(0.85) |
| focus | outline 2px `#63c0bb` offset 2px |
| disabled | opacity 0.4, cursor not-allowed |
| loading | spinner + opacity 0.7 |

---

## 9. Iconos

Usar iconos de línea (stroke), no rellenos, para coherencia con el estilo flat de los Minins.
Tamaño estándar: 20×20px en TopBar, 16×16px inline.

Fuente de iconos recomendada: **Lucide Icons** (ya compatible con React/Tailwind).

Iconos clave:
- Conectar: `plug-zap`
- Monitor: `terminal`
- Subir: `upload`
- Nuevo: `file-plus`
- Abrir: `folder-open`
- Guardar: `download`
- Ejemplos: `book-open`
- Código: `code-2`
- Placa: `cpu`

---

## 10. Responsive / breakpoints

La app es principalmente de escritorio (requiere Blockly + conexión USB), pero debe ser usable en tablets grandes.

```
md:  768px  — ocultar CodeViewer por defecto, toolbox colapsable
lg:  1024px — layout completo con CodeViewer toggle
xl:  1280px — layout óptimo
```

---

## 11. Estilo de movimiento (Motion Design)

### Principios
- **Rápido y directo**: transiciones de UI en 150-200ms
- **Orgánico para los Minins**: animaciones de 600-1200ms con easing suave
- **Nunca bloquear**: las animaciones decorativas no interfieren con la interacción

### Curvas de easing
```css
--ease-ui:     cubic-bezier(0.2, 0, 0, 1);      /* transiciones rápidas UI */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* bounce para Minins */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);     /* fade, slide */
```

### Transiciones de componentes
```
Dropdown abrir:  200ms ease-smooth, slide-down + fade
Dialog abrir:    250ms ease-spring, scale 0.95→1 + fade
Toast:           300ms ease-spring, slide-up + fade
Panel toggle:    200ms ease-ui, slide-left/right
```

---

## 12. Tokens CSS (variables)

```css
:root {
  /* Colores primarios */
  --color-primary:        #ffd002;
  --color-primary-dark:   #f4951b;
  --color-primary-light:  #ffef67;
  --color-primary-bg:     #fffdee;

  /* Turquesa (identidad Blockables) */
  --color-teal:           #63c0bb;
  --color-teal-dark:      #003f46;
  --color-teal-mid:       #4e9995;
  --color-teal-light:     #99d3d7;
  --color-teal-soft:      #cee9ee;
  --color-teal-bg:        #ebf5f4;

  /* Azul */
  --color-blue:           #4a7abd;
  --color-blue-dark:      #2a366b;
  --color-blue-bg:        #ecf7fe;

  /* Rojo/Error */
  --color-error:          #e94d27;
  --color-error-dark:     #c0110d;
  --color-error-bg:       #fef5f6;

  /* Neutros */
  --color-ink:            #1e1e1c;
  --color-ink-mid:        #3d3d3b;
  --color-ink-light:      #7a7a78;
  --color-border:         #d4d4d2;
  --color-bg-subtle:      #f0f0ee;
  --color-white:          #ffffff;

  /* Tipografía */
  --font-display:  'Paytone One', sans-serif;
  --font-ui:       'Noto Sans', sans-serif;
  --font-serif:    'Noto Serif', serif;
  --font-mono:     'JetBrains Mono', 'Fira Code', monospace;

  /* Espaciado */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;

  /* Radios */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 2px 8px rgba(0,63,70,0.10);
  --shadow-md: 0 8px 24px rgba(0,63,70,0.14);
  --shadow-lg: 0 24px 48px rgba(0,63,70,0.20);
}
```

---

## 13. Notas de implementación técnica

- El proyecto usa **React + Tailwind CSS v4 + Vite**
- Los bloques de Blockly tienen su propio sistema de temas (configurado en `src/blockly/`)
- Las fuentes deben copiarse a `public/fonts/` y cargarse con `@font-face` en `src/styles/`
- Los PNG de los Minins van a `public/characters/` para que sean accesibles como URLs estáticas
- Tailwind v4 usa CSS variables nativas — ideal para el sistema de tokens definido arriba
- No usar `!important` en estilos que afecten al canvas de Blockly

---

## 14. Assets de referencia disponibles

```
design-assets/
├── brand/
│   ├── 001_Logo/SVG/Logotipo Ingeniables.svg   ← logo vectorial
│   ├── 002_Paleta/paleta_v2.jpg                ← paleta visual
│   └── 004_Tipografías/                        ← fuentes TTF
│       ├── Paytone_One/PaytoneOne-Regular.ttf
│       ├── Noto_Sans/NotoSans-VariableFont_wdth,wght.ttf
│       └── Noto_Serif/NotoSerif-VariableFont_wdth,wght.ttf
└── characters/
    └── 004_Ilustraciones app/
        ├── 003_Minin turquesa/imágenes_v0/     ← PNGs del personaje
        └── 005_objetos/imágenes_v0/            ← objetos decorativos
```
