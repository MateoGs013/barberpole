# 📚 Material de estudio para la defensa

Carpeta con todo lo necesario para defender el proyecto en el oral.

## Contenido

| Archivo | Qué tiene | Cuándo usarlo |
|---|---|---|
| [01-banco-preguntas.md](01-banco-preguntas.md) | ~44 preguntas típicas de oral con respuesta lista, de fácil a difícil. Las ⭐ son las más probables. | Para practicar respondiendo en voz alta. |
| [02-guia-flujos.md](02-guia-flujos.md) | Los 3 flujos clave (crear turno, login, ruta protegida) paso a paso con archivo y línea. | Para saber señalar el código mientras explicás. |
| [03-diagramas.md](03-diagramas.md) | 6 diagramas Mermaid (arquitectura, request, JWT, roles, modelo de datos, solapamiento). | Para fijar el modelo mental. Renderizan en GitHub/VS Code. |
| [04-definiciones-clave.md](04-definiciones-clave.md) | Glosario de los conceptos del código (Context API en profundidad, hooks, JS moderno, conceptos del backend) con la frase para el oral. | Para nombrar y definir con propiedad lo que no se vio en clase. |
| [05-criollo.md](05-criollo.md) | Los mismos términos técnicos pero explicados en criollo, con analogías. | Para entender de verdad qué es cada cosa antes de memorizar la definición formal. |
| [06-flujo-backend-completo.md](06-flujo-backend-completo.md) | El recorrido de un request por las capas del backend + qué archivo tocar para cada tipo de cambio. | Para entender el backend de una vez y saber dónde meter mano si te piden modificar algo. |

## Plan de estudio sugerido (≈2 horas)

1. **(15 min)** Leé la sección "Decisiones técnicas" del [README principal](../../README.md) — es el guion base.
2. **(30 min)** Seguí el **Flujo 1 (crear turno)** de [02-guia-flujos.md](02-guia-flujos.md) con el código abierto al lado.
3. **(20 min)** Mirá los [diagramas](03-diagramas.md) y reproducí 2 de ellos en una hoja sin mirar.
4. **(40 min)** Respondé en voz alta todas las ⭐ del [banco de preguntas](01-banco-preguntas.md).
5. **(15 min)** Repasá los 3 puntos "trampa": regla de solapamiento, por qué JWT es seguro, por qué la autorización va en el backend.

## Los 3 conceptos que NO podés dudar

1. **Regla de solapamiento de turnos:** `[a1,a2]` y `[b1,b2]` se superponen ⟺ `a1 < b2 && b1 < a2`.
2. **JWT firma, no encripta:** el payload se lee pero no se falsifica sin el `JWT_SECRET`.
3. **La seguridad vive en el backend:** el front (`ProtectedRoute`) es solo UX; el middleware `requireRol` es la barrera real.
