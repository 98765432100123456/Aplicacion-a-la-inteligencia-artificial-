// ARCHIVO GENERADO desde compartido/informes.ts. No lo edite aquí: edite el original y ejecute node scripts/compartido.mjs

import { Resultado } from "./calificacion";
import {
  NOMBRE_METODO,
  NOMBRE_RESPUESTA,
  NOMBRE_TIPO,
  Metodo,
  Respuesta,
  TipoIndicador,
} from "./lista-chequeo";
import { CodigoLibertad, LIBERTADES, NIVELES, puntajeTexto } from "./norma";
import {
  AVISO_RECOMENDACIONES,
  NOMBRE_PRIORIDAD,
  Recomendaciones,
} from "./recomendaciones";

/**
 * Plantillas de los dos informes en formato pdfmake. El servidor las convierte
 * en PDF y las guarda; el modo demostración hace lo mismo en el navegador.
 * pdfmake modifica los arreglos que recibe: toda lista se pasa como copia.
 */

export interface DatosInforme {
  predio: {
    nombre: string;
    propietario: string;
    telefono: string | null;
    ubicacion: string;
  };
  especie: string;
  inventario: { crias: number; jovenes: number; adultos: number };
  productor: string;
  muestra: number | null;
  evaluacion: {
    codigo: string;
    fecha: string;
    evaluador: string;
    observacionGeneral: string | null;
    version: string;
  };
  resultado: Resultado;
  respuestas: {
    codigo: string;
    libertad: CodigoLibertad;
    texto: string;
    tipo: TipoIndicador;
    metodo: Metodo;
    respuesta: Respuesta;
    observacion: string | null;
  }[];
  recomendaciones: Recomendaciones;
  generado: string;
}

/** Definición de documento de pdfmake; se tipa de forma abierta para no depender de la librería. */
export type DocumentoPdf = Record<string, unknown>;

const VERDE = "#1d6b40";
const TINTA = "#1a1f1c";
const SUAVE = "#59625c";
const LINEA = "#dde1dc";
const COLOR_NIVEL: Record<string, string> = {
  BAJO: "#b42318",
  MEDIO: "#8a5a00",
  ALTO: "#1d6b40",
  EXCELENTE: "#14502f",
};

/** Color de cada respuesta, para distinguir de un vistazo lo que no cumple. */
const COLOR_RESPUESTA: Record<Respuesta, { color: string; fondo: string | null }> = {
  CUMPLE: { color: "#1d6b40", fondo: "#e6f3ea" },
  PARCIAL: { color: "#8a5a00", fondo: "#fdf1d6" },
  NO_CUMPLE: { color: "#b42318", fondo: "#fbe4e1" },
  NO_APLICA: { color: SUAVE, fondo: null },
};

/** Frase sencilla para el propietario sobre cada libertad que resultó en nivel alto o excelente. */
const LOGRO_LIBERTAD: Record<CodigoLibertad, string> = {
  NUTRICION:
    "sus animales tienen agua y alimento suficientes y se mantienen en buena condición corporal.",
  SALUD:
    "sus animales se ven sanos, con pocas lesiones, cojeras o enfermedades, y el manejo sanitario va bien.",
  CONFORT:
    "los potreros, corrales y la sombra les dan a sus animales un lugar cómodo para descansar y protegerse del calor y la lluvia.",
  COMPORTAMIENTO:
    "sus animales están tranquilos frente a las personas y pueden comportarse de forma natural.",
};

const nombreNivel = (codigo: string | null) =>
  NIVELES.find((n) => n.codigo === codigo)?.nombre ?? "Sin dato";
const decimal = (n: number | null) =>
  n === null ? "—" : puntajeTexto(n);
const lineas = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0,
  hLineColor: () => LINEA,
  paddingTop: () => 5,
  paddingBottom: () => 5,
};

function base(
  titulo: string,
  subtitulo: string,
  contenido: unknown[],
  generado: string,
): DocumentoPdf {
  return {
    pageSize: "LETTER",
    pageMargins: [48, 56, 48, 56],
    info: { title: titulo, author: "ICA Bienestar Animal" },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: TINTA,
      lineHeight: 1.25,
    },
    styles: {
      marca: { fontSize: 9, bold: true, color: VERDE },
      titulo: { fontSize: 20, bold: true, margin: [0, 6, 0, 2] },
      subtitulo: { fontSize: 10, color: SUAVE, margin: [0, 0, 0, 16] },
      seccion: { fontSize: 13, bold: true, margin: [0, 18, 0, 8] },
      encabezado: { fontSize: 8, bold: true, color: SUAVE },
      nota: { fontSize: 8, color: SUAVE },
    },
    footer: (pagina: number, total: number) => ({
      columns: [
        { text: `${titulo} · generado el ${generado}`, style: "nota" },
        {
          text: `Página ${pagina} de ${total}`,
          style: "nota",
          alignment: "right",
        },
      ],
      margin: [48, 16, 48, 0],
    }),
    content: [
      { text: "ICA BIENESTAR ANIMAL", style: "marca" },
      { text: titulo, style: "titulo" },
      { text: subtitulo, style: "subtitulo" },
      ...contenido,
    ],
  };
}

function ficha(filas: [string, string][]) {
  return {
    table: {
      widths: [130, "*"],
      body: filas.map(([k, v]) => [
        { text: k, color: SUAVE },
        { text: v, bold: true },
      ]),
    },
    layout: lineas,
  };
}

/** Informe técnico: criterios, resultados y observaciones con la terminología de la norma. */
export function informeTecnico(d: DatosInforme): DocumentoPdf {
  const r = d.resultado;
  const total =
    d.inventario.crias + d.inventario.jovenes + d.inventario.adultos;
  const contenido: unknown[] = [
    { text: "Identificación", style: "seccion" },
    ficha([
      ["Predio", d.predio.nombre],
      [
        "Propietario",
        d.predio.propietario +
          (d.predio.telefono ? ` · ${d.predio.telefono}` : ""),
      ],
      ["Ubicación", d.predio.ubicacion],
      ["Especie evaluada", d.especie],
      [
        "Inventario",
        `${total} animales: ${d.inventario.crias} crías, ${d.inventario.jovenes} jóvenes y ${d.inventario.adultos} adultos`,
      ],
      ["Tipo de productor", d.productor],
      [
        "Muestra mínima",
        d.muestra === null ? "—" : `${d.muestra} animales`,
      ],
      ["Evaluación", `${d.evaluacion.codigo} · ${d.evaluacion.fecha}`],
      ["Evaluador", d.evaluacion.evaluador],
    ]),

    { text: "Resultado por libertad", style: "seccion" },
    {
      table: {
        headerRows: 1,
        widths: ["*", 50, 50, 70],
        body: [
          ["Libertad", "Peso", "Puntaje", "Nivel"].map((t) => ({
            text: t,
            style: "encabezado",
          })),
          ...r.libertades.map((l) => [
            l.nombre,
            `${l.peso} %`,
            decimal(l.puntaje),
            {
              text: nombreNivel(l.nivel),
              bold: true,
              color: COLOR_NIVEL[l.nivel ?? ""] ?? SUAVE,
            },
          ]),
          [
            { text: "Calificación del predio", bold: true },
            "100 %",
            { text: decimal(r.puntaje), bold: true },
            {
              text: nombreNivel(r.nivel),
              bold: true,
              color: COLOR_NIVEL[r.nivel],
            },
          ],
        ],
      },
      layout: lineas,
    },
    r.libertadesBajas.length
      ? {
          text: `Alerta: nivel bajo en ${r.libertadesBajas.map((c) => LIBERTADES.find((l) => l.codigo === c)!.corto.toLowerCase()).join(", ")}. La metodología exige acciones correctivas urgentes cuando cualquier libertad resulta en nivel bajo.`,
          color: COLOR_NIVEL["BAJO"],
          bold: true,
          margin: [0, 10, 0, 0],
        }
      : {
          text: "Ninguna libertad resultó en nivel bajo.",
          color: SUAVE,
          margin: [0, 10, 0, 0],
        },

    { text: "Hallazgos que requieren atención", style: "seccion" },
    r.hallazgos.length
      ? {
          ul: r.hallazgos.map((h) => ({
            text: [
              {
                text: `${h.codigo} ${h.critico ? "(crítico) " : ""}`,
                bold: true,
              },
              `${h.texto} — `,
              {
                text: `${NOMBRE_RESPUESTA[h.respuesta].toLowerCase()}.`,
                bold: true,
                color: COLOR_RESPUESTA[h.respuesta].color,
              },
              h.observacion
                ? { text: ` Observación: ${h.observacion}`, color: SUAVE }
                : "",
            ],
            margin: [0, 0, 0, 4],
          })),
        }
      : { text: "No se registraron incumplimientos.", color: SUAVE },

    {
      text: "Detalle de indicadores evaluados",
      style: "seccion",
    },
    ...LIBERTADES.flatMap((l) => [
      {
        // El nombre de la libertad va como primera fila de encabezado para que no
        // quede solo al final de una página.
        table: {
          headerRows: 2,
          keepWithHeaderRows: 1,
          widths: [24, "*", 120, 74],
          body: [
            [
              { text: l.nombre, bold: true, fontSize: 10, colSpan: 4, margin: [0, 6, 0, 0] },
              {},
              {},
              {},
            ],
            ["Cód.", "Indicador", "Tipo y método", "Resultado"].map((t) => ({
              text: t,
              style: "encabezado",
            })),
            ...d.respuestas
              .filter((x) => x.libertad === l.codigo)
              .map((x) => [
                x.codigo,
                x.observacion
                  ? {
                      stack: [
                        x.texto,
                        { text: `Observación: ${x.observacion}`, style: "nota" },
                      ],
                    }
                  : x.texto,
                {
                  text: `${NOMBRE_TIPO[x.tipo]}. ${NOMBRE_METODO[x.metodo]}.`,
                  style: "nota",
                },
                {
                  text: NOMBRE_RESPUESTA[x.respuesta],
                  bold: true,
                  color: COLOR_RESPUESTA[x.respuesta].color,
                  fillColor: COLOR_RESPUESTA[x.respuesta].fondo,
                },
              ]),
          ],
        },
        layout: lineas,
        fontSize: 9,
      },
    ]),

    { text: "Observación general", style: "seccion" },
    {
      text: d.evaluacion.observacionGeneral || "Sin observaciones generales.",
      color: d.evaluacion.observacionGeneral ? TINTA : SUAVE,
    },

    {
      unbreakable: true,
      stack: [
        { text: "Nota metodológica", style: "seccion" },
        {
          text:
            "Cada libertad se califica de 0 a 5 promediando sus indicadores según su peso (cumple = 1, cumple en parte = 0,5, no cumple = 0; los indicadores que no aplican se excluyen). " +
            "La calificación del predio pondera las libertades con los pesos de la Metodología para evaluar el bienestar animal en las especies bovina y bufalina del ICA (versión 2.0, 2023): " +
            "hambre y sed 20 %, dolor, lesión y enfermedad 50 %, molestias físicas y térmicas 15 %, temor, angustia y comportamiento natural 15 %. " +
            `Escala: bajo menos de 3,0; medio 3,0 a 3,9; alto 4,0 a 4,5; excelente 4,6 a 5,0. Lista de chequeo de referencia, versión ${d.evaluacion.version}.`,
          style: "nota",
        },
        {
          text: "\n\n______________________________\nFirma del evaluador",
          margin: [0, 16, 0, 0],
        },
      ],
    },
  ];
  return base(
    "Informe técnico de evaluación de bienestar animal",
    `${d.predio.nombre} · ${d.especie} · ${d.evaluacion.fecha}`,
    contenido,
    d.generado,
  );
}

/** Informe para el propietario: recomendaciones en lenguaje sencillo. */
export function informePropietario(d: DatosInforme): DocumentoPdf {
  const r = d.resultado;
  const rec = d.recomendaciones;
  const bien = r.libertades.filter(
    (l) => l.nivel === "ALTO" || l.nivel === "EXCELENTE",
  );
  const contenido: unknown[] = [
    { text: `Hola, ${d.predio.propietario}.`, fontSize: 12, bold: true },
    {
      text: `El ${d.evaluacion.fecha} se revisó el bienestar de los ${d.especie.toLowerCase()} de ${d.predio.nombre}. Aquí le contamos qué encontramos y qué puede hacer para mejorar.`,
      margin: [0, 4, 0, 0],
    },
    {
      table: {
        widths: ["*", "auto"],
        body: [
          [
            {
              text: [
                { text: "Resultado de su finca\n", style: "encabezado" },
                {
                  text: nombreNivel(r.nivel),
                  fontSize: 22,
                  bold: true,
                  color: COLOR_NIVEL[r.nivel],
                },
              ],
            },
            {
              text: [
                { text: "Puntaje\n", style: "encabezado" },
                {
                  text: `${decimal(r.puntaje)} de 5`,
                  fontSize: 22,
                  bold: true,
                },
              ],
              alignment: "right",
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        fillColor: () => "#f0f8f3",
        paddingLeft: () => 14,
        paddingRight: () => 14,
        paddingTop: () => 12,
        paddingBottom: () => 12,
      },
      margin: [0, 14, 0, 0],
    },
    { text: rec.resumen, margin: [0, 12, 0, 0] },
  ];

  if (bien.length) {
    contenido.push(
      { text: "Lo que está haciendo bien", style: "seccion" },
      {
        ul: bien.map((l) => ({
          text: [
            {
              text: `${LIBERTADES.find((x) => x.codigo === l.codigo)!.corto} (nivel ${nombreNivel(l.nivel).toLowerCase()}): `,
              bold: true,
            },
            LOGRO_LIBERTAD[l.codigo],
          ],
          margin: [0, 0, 0, 4],
        })),
      },
    );
  }

  contenido.push({
    text: rec.recomendaciones.length
      ? "Lo que debe mejorar"
      : "Recomendaciones",
    style: "seccion",
  });
  if (!rec.recomendaciones.length)
    contenido.push({
      text: "No encontramos aspectos por mejorar. Mantenga las buenas prácticas.",
    });
  rec.recomendaciones.forEach((x, i) => {
    contenido.push({
      stack: [
        {
          columns: [
            {
              text: `${i + 1}. ${x.problema}`,
              bold: true,
              fontSize: 11,
              width: "*",
            },
            {
              text: NOMBRE_PRIORIDAD[x.prioridad],
              bold: true,
              color:
                x.prioridad === "ALTA"
                  ? COLOR_NIVEL["BAJO"]
                  : x.prioridad === "MEDIA"
                    ? COLOR_NIVEL["MEDIO"]
                    : VERDE,
              width: "auto",
            },
          ],
        },
        {
          text: [{ text: "Por qué importa: ", bold: true }, x.porque],
          margin: [0, 4, 0, 2],
        },
        { text: "Qué puede hacer:", bold: true },
        { ul: [...x.acciones], margin: [0, 2, 0, 0] },
      ],
      margin: [0, 0, 0, 12],
      unbreakable: true,
    });
  });

  contenido.push({
    unbreakable: true,
    stack: [
      { text: "Importante", style: "seccion" },
      { text: AVISO_RECOMENDACIONES },
      {
        text:
          rec.origen === "IA"
            ? "Estas recomendaciones se prepararon con ayuda de inteligencia artificial a partir de los resultados de la evaluación y los lineamientos del ICA, y pueden ser revisadas por el evaluador."
            : "Estas recomendaciones se prepararon a partir de los resultados de la evaluación y los lineamientos del ICA.",
        style: "nota",
        margin: [0, 8, 0, 0],
      },
    ],
  });
  return base(
    "Recomendaciones para su finca",
    `${d.predio.nombre} · ${d.especie} · ${d.evaluacion.fecha}`,
    contenido,
    d.generado,
  );
}
