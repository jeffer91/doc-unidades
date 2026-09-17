# Arquitectura oficial de DOC-UNIDADES

DOC-UNIDADES usa una sola base SQLite local y separa la información por contexto estable:

`PERÍODO → UNIDAD → PROCESO → DOCUMENTO → SECCIÓN / MATRIZ`.

## Capas

- `src/menu-superior/`: contexto global de unidad, período y modo Diseño.
- `src/core/periods/`: contexto y reglas de períodos.
- `src/core/fields/`: campos `system`, `simple`, `compound` e `inherited`.
- `src/core/calculations/`: cálculos canónicos y trazabilidad.
- `src/core/matrices/`: contratos comunes de matrices.
- `src/core/document-blocks/`: estructura del documento y descubrimiento de fuentes.
- `src/core/tables/`: tablas documentales.
- `src/core/charts/`: reglas deterministas para figuras y gráficos.
- `src/core/apa7/`: presentación APA 7 del cuerpo académico.
- `src/core/references/`: referencias verificadas y claves de cita.
- `src/core/cover/`: portada institucional RGI / INF.
- `src/core/toc/`: índice automático.
- `src/core/pdf/`: contratos del borrador y PDF final.
- `src/core/files/`: metadatos de archivos externos.
- `src/core/import/`: staging, validación y normalización.
- `src/core/connectors/`: contratos para fuentes externas opcionales.
- `src/core/validation/`: validación documental común.
- `src/core/diagnostics/`: diagnóstico estructural.
- `src/core/versions/`: snapshots/versiones de documentos.
- `src/core/backup/`: manifiesto de respaldos.

## Procesos

Cada proceso mantiene sus documentos dentro de su propia carpeta. Los motores comunes viven en `core`; no se duplican entre Formación, Capacitación, Gestión Curricular o UTET.

### UGPA

- `src/procesos/ugpa/capacitacion/`
- `src/procesos/ugpa/formacion/`
- `src/procesos/ugpa/gestion-curricular/`

Formación y Capacitación son procesos distintos. Pueden reutilizar motores comunes, pero nunca comparten matrices ni plantillas por error.

### UTET

- `src/procesos/utet/planificacion/`
- `src/procesos/utet/requisitos/`
- `src/procesos/utet/examen-complexivo/`
- `src/procesos/utet/trabajo-titulacion/`
- `src/procesos/utet/articulo-academico/`
- `src/procesos/utet/induccion/`
- `src/procesos/utet/informes/`

`src/procesos/utet/processes.ts` solo compone los módulos; no debe volver a concentrar la configuración completa.

## Flujo documental

`DATOS / MATRICES → VALIDACIÓN → CÁLCULOS → CAMPOS → BLOQUES → APA 7 → RGI/INF → ÍNDICE → BORRADOR / FINAL`.

Las matrices son fuente de verdad. Excel es interfaz de importación/exportación, no fuente permanente.

Un valor derivable no se captura manualmente. Una ausencia de datos no se convierte en cero. En borrador se identifica como pendiente; el PDF final se bloquea cuando un requisito obligatorio no puede resolverse.

## Base local

SQLite usa WAL, claves foráneas, timeout, índices y contexto completo. Archivos pesados permanecen fuera de SQLite; la base conserva metadatos, ruta y hash.

Tablas estructurales disponibles:

- períodos;
- contenido de secciones;
- versiones de plantillas;
- filas oficiales de matrices;
- staging de importaciones/conectores;
- metadatos de archivos;
- versiones/snapshots documentales;
- ejecuciones de conectores;
- historial e importaciones.

## PDF

Portada institucional y cuerpo académico son capas diferentes:

- RGI / INF gobiernan portada, código, firmas, versión y control documental.
- APA 7 gobierna el cuerpo cuando corresponde: texto académico, tablas, figuras, notas y referencias.
- Todos los RGI e INF incorporan índice automático.
- El borrador y el final usan la misma fuente de datos y la misma plantilla.

## Regla de extensión

Para agregar un documento nuevo se declara su configuración: secciones, matrices, campos, bloques, tablas, gráficos, referencias y reglas. No se crea un motor paralelo dentro del proceso.
