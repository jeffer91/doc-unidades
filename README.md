# DOC-UNIDADES v0.1

Aplicación Electron local para gestión documental institucional por **Unidad → Proceso → Documento → Sección**.

## Incluye

- Menú superior en carpeta independiente.
- Selector UGPA / UTET.
- Períodos locales con inicio vacío y creación mediante `+`.
- SQLite local única, con WAL, índices y aislamiento por período/unidad/proceso/documento.
- Procesos organizados por carpetas.
- Documentos organizados dentro de cada proceso.
- Textos editables por período.
- **Modo Diseño** para modificar plantillas sin tocar código.
- Versionado básico de plantillas en SQLite.
- Motor genérico de matrices.
- Importación y exportación Excel.
- Validación básica por columnas obligatorias/opciones.
- Registro de importaciones e historial.
- Estructura inicial de UGPA: Capacitación, Formación, Gestión Curricular.
- Estructura inicial de UTET: Planificación, Requisitos, Complexivo, Trabajo de Titulación, Artículo Académico, Inducción e Informes.

## Ejecución

Requiere Node.js LTS.

```bash
npm install
npm run dev
```

Para compilar:

```bash
npm run build
npm start
```

Para generar instalador de Windows:

```bash
npm run package
```

> `better-sqlite3` es un módulo nativo. Si Electron solicita recompilarlo para su versión, utiliza `electron-rebuild` o instala nuevamente las dependencias con la versión de Electron del proyecto.

## Datos locales

La app crea automáticamente en **Documentos/DOC-UNIDADES**:

- `data/doc-unidades.sqlite`
- `archivos/`
- `plantillas/`
- `exportaciones/`
- `respaldos/`

Los documentos y matrices quedan aislados por `period_id + unit_id + process_id + document_id`.

## Arquitectura

```text
src/
├── menu-superior/
├── core/
│   ├── database/
│   ├── matrices/
│   ├── templates/
│   └── registry/
└── procesos/
    ├── ugpa/
    │   ├── capacitacion/
    │   ├── formacion/
    │   └── gestion-curricular/
    └── utet/
```

## Alcance de esta primera versión

El núcleo funcional está implementado. **Formación** tiene el flujo piloto más desarrollado (DNF, Plan e Informe), mientras los demás procesos están registrados con estructuras iniciales listas para ampliar con sus matrices, reglas y plantillas definitivas.

La generación PDF institucional completa, diagnóstico avanzado, conectores externos y respaldos ZIP están previstos en el `ROADMAP.md` y deben añadirse sobre este núcleo sin mezclar módulos.
