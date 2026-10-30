# Design Guidelines — Zen & Hiperfoco

Lineamientos de diseño del frontend de BarberPole (estética "Modo Hiperfoco" OLED).

## 1. Filosofía y Estética
- **Minimalismo Radical / Menos es Más:** Prohibido sobre-diseñar. No agregar contenedores, cajas, sombras, gradientes, bordes gruesos ni elementos decorativos innecesarios.
- **Concepto Ma (間) - Espacio Vacío Editorial:** El espacio negativo no es ausencia, es el elemento estructural principal. Usar márgenes y paddings generosos con medidas relativas (`clamp()`, `vw`, `vh`) que ocupen armónicamente todo el viewport disponible manteniendo el responsive.
- **Anti-Marketing Fluff:** Títulos estrictamente objetivos (`SERVICIOS`, `FECHA`, `HORA`, `CONTACTO`). Textos cortos, directos y funcionales. Cero párrafos promocionales o eslóganes vacíos.
- **Separadores Tipográficos:** Prohibido usar dobles barras (`//`) en títulos, pasos o metadatos. Usar exclusivamente guiones editoriales (`—` o `-`).

## 2. Paleta Monocromática (B&W Calibrado)
- **Fondo:** Negro puro (`#000000`) o carbón profundo mate (`#0A0A0A`).
- **Texto Principal:** Blanco nítido (`#FFFFFF`).
- **Metadatos y Texto Secundario:** Gris neutro (`#71717A` / `#555555`).
- **Líneas Divisorias:** Hairlines imperceptibles de 1px (`#1A1A1A` o `rgba(255,255,255,0.08)`).
- **Interacción / Foco:** Respuesta binaria táctil por inversión (fondo blanco, texto negro) o realce de borde nítido.

## 3. Arquitectura de Componentes (No-Card Layout)
- **Filas Tabulares en vez de Cards:** Listas de servicios, horarios y agendas se construyen como filas de tabla editorial con divisores de 1px (`hairline-b`), sin tarjetas individuales cerradas con border-radius gigante.
- **Inputs Tipográficos:** Formularios con campos integrados al lienzo (solo línea base inferior `hairline-b`), sin recuadros toscos de formulario tradicional.
- **Single-Task Cognition:** En el flujo de turnos, cada decisión debe ser inmediata, clara y libre de fricción.
