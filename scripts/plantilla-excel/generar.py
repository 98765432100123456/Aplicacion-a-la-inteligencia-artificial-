"""Genera frontend/public/plantillas/tablero.xlsx, la plantilla del libro de Excel del tablero.

La plantilla trae todo lo que no cambia: diseño, fotos del proyecto, gráficos nativos de Excel,
tablas con filtros y formatos condicionales. Las celdas con datos llevan marcadores {{clave}} que
el navegador reemplaza al exportar (frontend/src/app/core/tablero/excel.ts); las filas con
marcadores {{f.*}} o {{h.*}} se repiten una vez por evaluación o por hallazgo.

Uso (desde la raíz del repositorio):  python3 scripts/plantilla-excel/generar.py
Necesita openpyxl y Pillow. Si se cambian filas o columnas, actualizar las constantes de excel.ts.
"""
from io import BytesIO
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, DoughnutChart, LineChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.layout import Layout, ManualLayout
from openpyxl.chart.series import DataPoint
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.chart.text import RichText
from openpyxl.drawing.image import Image as ImagenXl
from openpyxl.drawing.line import LineProperties
from openpyxl.drawing.text import CharacterProperties, Paragraph, ParagraphProperties, Font as FuenteDibujo
from openpyxl.formatting.rule import CellIsRule, ColorScaleRule, DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parents[2]
FOTOS = RAIZ / 'frontend/public/fotos'
SALIDA = RAIZ / 'frontend/public/plantillas/tablero.xlsx'

# Paleta del sistema de diseño (src/styles/_tokens.scss)
NOCHE, SOBRE_NOCHE, FONDO, BLANCO = '0E1210', 'A9B3AC', 'F2F3F0', 'FFFFFF'
TINTA, SUAVE, LINEA = '1A1F1C', '59625C', 'DDE1DC'
ACCION, ACENTO, ACENTO_FUERTE, ACENTO_SUAVE = '4CC77F', '1D6B40', '14502F', 'E3F3E9'
MAIZ, MAIZ_FONDO, ALERTA, ALERTA_FONDO = '8A5A00', 'FBF0D9', 'B42318', 'FBE9E7'
COLOR_NIVEL = {'Bajo': ALERTA, 'Medio': 'D99A1E', 'Alto': ACCION, 'Excelente': ACENTO}
FONDO_NIVEL = {'Bajo': (ALERTA_FONDO, '5F150F'), 'Medio': (MAIZ_FONDO, '4D3206'), 'Alto': (ACENTO_SUAVE, ACENTO_FUERTE), 'Excelente': (ACENTO, NOCHE)}
LETRA = 'Calibri'

relleno = lambda c: PatternFill('solid', start_color=c, end_color=c)
fuente = lambda tam=11, color=TINTA, negrita=False, cursiva=False: Font(name=LETRA, size=tam, color=color, bold=negrita, italic=cursiva)
fino = Side(style='thin', color=LINEA)
grueso_verde = Side(style='thick', color=ACCION)


# ---------- Imágenes ----------

def png(imagen: Image.Image) -> BytesIO:
    b = BytesIO()
    imagen.save(b, 'PNG', optimize=True)
    b.seek(0)
    return b


def jpg(imagen: Image.Image) -> BytesIO:
    b = BytesIO()
    imagen.convert('RGB').save(b, 'JPEG', quality=86, optimize=True, progressive=True)
    b.seek(0)
    return b


def recorte(nombre: str, ancho: int, alto: int, foco_y=0.5) -> Image.Image:
    """Recorta la foto al tamaño pedido sin deformarla."""
    im = Image.open(FOTOS / f'{nombre}.webp').convert('RGB')
    escala = max(ancho / im.width, alto / im.height)
    im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
    x = (im.width - ancho) // 2
    y = round((im.height - alto) * foco_y)
    return im.crop((x, y, x + ancho, y + alto))


def con_fundido(im: Image.Image, fraccion=0.45) -> Image.Image:
    """Funde el borde izquierdo de la foto con el color noche, como la portada del tablero en la aplicación."""
    noche = Image.new('RGB', im.size, '#' + NOCHE)
    mascara = Image.new('L', im.size, 255)
    d = ImageDraw.Draw(mascara)
    tramo = int(im.width * fraccion)
    for x in range(tramo):
        d.line([(x, 0), (x, im.height)], fill=int(255 * (x / tramo) ** 1.4))
    return Image.composite(im, noche, mascara)


def logo(lado=96) -> Image.Image:
    """El ícono de la aplicación (favicon.svg) dibujado a mano para no depender de un conversor de SVG."""
    k = lado / 28
    im = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, lado - 1, lado - 1], radius=5 * k, fill='#1f5135')
    d.line([(7 * k, 14.5 * k), (11.5 * k, 19 * k), (21 * k, 9 * k)], fill='white', width=round(2.6 * k), joint='curve')
    return im


def poner_imagen(ws, datos: BytesIO, celda: str, ancho_px: int, alto_px: int):
    img = ImagenXl(datos)
    img.width, img.height = ancho_px, alto_px
    ws.add_image(img, celda)


# ---------- Utilidades de hoja ----------

def fondo(ws, rango: str, color=FONDO):
    for fila in ws[rango]:
        for c in fila:
            c.fill = relleno(color)


def texto(ws, celda: str, valor, f=None, a=None, combinar: str | None = None, formato: str | None = None):
    if combinar:
        ws.merge_cells(combinar)
    c = ws[celda]
    c.value = valor
    if f:
        c.font = f
    c.alignment = a or Alignment(vertical='center')
    if formato:
        c.number_format = formato
    return c


def portada(ws, titulo: str, bajada: str, ultima_col: str, foto: str, ancho_foto_px: int, filas_alto=(14, 30, 18, 18, 10)):
    """Banda oscura con logo, título y una foto del proyecto fundida a la derecha."""
    for i, alto in enumerate(filas_alto, start=1):
        ws.row_dimensions[i].height = alto
    fondo(ws, f'A1:{ultima_col}{len(filas_alto)}', NOCHE)
    poner_imagen(ws, png(logo()), 'B2', 40, 40)
    texto(ws, 'C2', 'ICA BIENESTAR ANIMAL', fuente(9, ACCION, True), Alignment(vertical='bottom', indent=1))
    texto(ws, 'C3', titulo, fuente(22, BLANCO, True), Alignment(vertical='center', indent=1))
    texto(ws, 'C4', bajada, fuente(10.5, SOBRE_NOCHE), Alignment(vertical='center', indent=1))
    alto_px = round(sum(filas_alto) * 96 / 72)
    poner_imagen(ws, jpg(con_fundido(recorte(foto, ancho_foto_px * 2, alto_px * 2, 0.62))), f'{ultima_col_foto(ws, ultima_col, ancho_foto_px)}1', ancho_foto_px, alto_px)


def ultima_col_foto(ws, ultima_col: str, ancho_px: int) -> str:
    """Columna donde empieza la foto para que termine justo en el borde derecho de la portada."""
    from openpyxl.utils import column_index_from_string
    col = column_index_from_string(ultima_col)
    acumulado = 0
    while col > 1:
        w = ws.column_dimensions[get_column_letter(col)].width or 8.43
        acumulado += round(w * 7 + 5)
        if acumulado >= ancho_px:
            return get_column_letter(col)
        col -= 1
    return 'A'


def estilo_grafico(chart, ancho_cm: float, alto_cm: float, leyenda='b'):
    chart.width, chart.height = ancho_cm, alto_cm
    chart.style = 2
    chart.title = None
    chart.graphical_properties = GraphicalProperties(ln=LineProperties(noFill=True))
    chart.graphical_properties.noFill = True
    if leyenda:
        chart.legend.position = leyenda
        chart.legend.txPr = rich(9, SUAVE)
    else:
        chart.legend = None


def rich(tam=9, color=SUAVE, negrita=False) -> RichText:
    cp = CharacterProperties(sz=int(tam * 100), b=negrita, solidFill=color, latin=FuenteDibujo(typeface=LETRA))
    return RichText(p=[Paragraph(pPr=ParagraphProperties(defRPr=cp), endParaRPr=cp)])


def ejes(chart, minimo=None, maximo=None, formato=None, unidad=None, rejilla=True):
    for eje in (chart.x_axis, chart.y_axis):
        eje.delete = False
        eje.txPr = rich(9, SUAVE)
        eje.graphicalProperties = GraphicalProperties(ln=LineProperties(solidFill=LINEA))
    chart.x_axis.majorGridlines = None
    if rejilla:
        chart.y_axis.majorGridlines.spPr = GraphicalProperties(ln=LineProperties(solidFill='EEF1ED'))
    else:
        chart.y_axis.majorGridlines = None
    chart.y_axis.graphicalProperties = GraphicalProperties(ln=LineProperties(noFill=True))
    if minimo is not None:
        chart.y_axis.scaling.min = minimo
    if maximo is not None:
        chart.y_axis.scaling.max = maximo
    if formato:
        chart.y_axis.numFmt = formato
        chart.y_axis.number_format = formato
    if unidad:
        chart.y_axis.majorUnit = unidad


def etiquetas(serie, formato='0.0', posicion='outEnd', color=TINTA, negrita=True):
    serie.dLbls = DataLabelList()
    serie.dLbls.showVal = True
    for campo in ('showSerName', 'showCatName', 'showLegendKey', 'showPercent', 'showLeaderLines'):
        setattr(serie.dLbls, campo, False)
    serie.dLbls.numFmt = formato
    if posicion:
        serie.dLbls.position = posicion
    serie.dLbls.txPr = rich(9, color, negrita)


def color_serie(serie, color: str, linea=False):
    if linea:
        serie.graphicalProperties.line.solidFill = color
        serie.graphicalProperties.line.width = 28575
        serie.smooth = False
    else:
        serie.graphicalProperties.solidFill = color
        serie.graphicalProperties.line.noFill = True


def panel(ws, rango: str, titulo: str, bajada: str):
    """Fondo blanco con título para que el gráfico parezca una tarjeta, como en la aplicación."""
    fondo(ws, rango, BLANCO)
    inicio = rango.split(':')[0]
    col = ''.join(ch for ch in inicio if ch.isalpha())
    fila = int(''.join(ch for ch in inicio if ch.isdigit()))
    texto(ws, f'{col}{fila}', titulo, fuente(12.5, TINTA, True), Alignment(vertical='bottom', indent=1))
    texto(ws, f'{col}{fila + 1}', bajada, fuente(9, SUAVE), Alignment(vertical='top', indent=1))
    fin = rango.split(':')[1]
    col_fin = ''.join(ch for ch in fin if ch.isalpha())
    for c in ws[f'{col}{fila}:{col_fin}{fila}'][0]:
        c.border = Border(top=Side(style='medium', color=TINTA))


def formato_niveles(ws, rango: str):
    """Colorea las celdas según el nivel de bienestar (Bajo, Medio, Alto, Excelente)."""
    primera = rango.split(':')[0].replace('$', '')
    for nombre, (fondo_c, texto_c) in FONDO_NIVEL.items():
        ws.conditional_formatting.add(rango, FormulaRule(formula=[f'EXACT({primera},"{nombre}")'], fill=relleno(fondo_c), font=Font(color=texto_c, bold=True)))


def encabezado_tabla(ws, fila: int, columnas: list[tuple[str, float]], desde=2):
    for i, (nombre, ancho) in enumerate(columnas):
        col = get_column_letter(desde + i)
        ws.column_dimensions[col].width = ancho
        c = ws[f'{col}{fila}']
        c.value = nombre
        c.font = fuente(10, BLANCO, True)
        c.fill = relleno(NOCHE)
        c.alignment = Alignment(vertical='center', wrap_text=True)
    ws.row_dimensions[fila].height = 32


def fila_modelo(ws, fila: int, claves: list[tuple[str, str | None]], desde=2):
    """Fila con marcadores que el navegador repite por cada registro."""
    for i, (clave, formato) in enumerate(claves):
        c = ws.cell(row=fila, column=desde + i, value='{{' + clave + '}}')
        c.font = fuente(10)
        c.alignment = Alignment(vertical='center', wrap_text=clave.endswith('lista'))
        c.border = Border(bottom=fino)
        if formato:
            c.number_format = formato
    ws.row_dimensions[fila].height = 22


# ---------- Hoja Datos (alimenta los gráficos) ----------

def hoja_datos(wb):
    ws = wb.create_sheet('Datos')
    ws.sheet_properties.tabColor = SUAVE
    ws.sheet_view.showGridLines = False
    for col, ancho in zip('ABCDE', (34, 16, 16, 16, 16)):
        ws.column_dimensions[col].width = ancho
    texto(ws, 'A1', 'Datos de los gráficos', fuente(16, TINTA, True))
    texto(ws, 'A2', 'Cifras del tablero en el periodo y filtros exportados. Los gráficos de la hoja Tablero se leen de aquí.', fuente(9.5, SUAVE))

    def bloque(fila, titulo, columnas, n, claves, formatos):
        texto(ws, f'A{fila - 1}', titulo, fuente(11, ACENTO, True))
        for i, nombre in enumerate(columnas):
            c = ws.cell(row=fila, column=1 + i, value=nombre)
            c.font, c.fill = fuente(10, BLANCO, True), relleno(NOCHE)
        for k in range(n):
            for i, (clave, formato) in enumerate(zip(claves, formatos)):
                c = ws.cell(row=fila + 1 + k, column=1 + i, value='{{' + clave.format(k) + '}}')
                c.font, c.border = fuente(10), Border(bottom=fino)
                if formato:
                    c.number_format = formato

    bloque(4, 'Evaluaciones por nivel', ['Nivel', 'Evaluaciones', 'Porcentaje'], 4, ['niv.{}.nombre', 'niv.{}.cantidad', 'niv.{}.pct'], [None, '0', '0%'])
    bloque(11, 'Promedio por libertad (0 a 5)', ['Libertad', 'Peso', 'Promedio', 'Meta nivel alto'], 4, ['lib.{}.nombre', 'lib.{}.peso', 'lib.{}.promedio', 'lib.{}.meta'], [None, '0%', '0.00', '0.0'])
    bloque(18, 'Tendencia de los últimos 12 meses', ['Mes', 'Evaluaciones', 'Puntaje promedio'], 12, ['mes.{}.etiqueta', 'mes.{}.cantidad', 'mes.{}.promedio'], [None, '0', '0.00'])
    bloque(33, 'Criterios con más hallazgos', ['Criterio', 'Evaluaciones', 'Críticos'], 5, ['hal.{}.nombre', 'hal.{}.veces', 'hal.{}.criticos'], [None, '0', '0'])
    bloque(41, 'Por departamento', ['Departamento', 'Evaluaciones', 'Puntaje promedio', 'Nivel'], 8, ['dep.{}.nombre', 'dep.{}.evaluaciones', 'dep.{}.promedio', 'dep.{}.nivel'], [None, '0', '0.00', None])
    formato_niveles(ws, 'D42:D49')
    formato_niveles(ws, 'A5:A8')
    return ws


# ---------- Hoja Tablero ----------

ANCHO_COL, ANCHO_CANAL = 13, 2
COLS_TABLERO = 'ABCDEFGHIJKLMNOPQ'
CANALES = {'A', 'E', 'I', 'M', 'Q'}
px = lambda ancho: round(ancho * 7 + 5)
cm = lambda pixeles: pixeles * 2.54 / 96


def hoja_tablero(wb, datos):
    ws = wb.active
    ws.title = 'Tablero'
    ws.sheet_properties.tabColor = ACCION
    ws.sheet_view.showGridLines = False
    ws.sheet_view.zoomScale = 90
    for col in COLS_TABLERO:
        ws.column_dimensions[col].width = ANCHO_CANAL if col in CANALES else ANCHO_COL
    for f in range(1, 90):
        ws.row_dimensions[f].height = 15
    fondo(ws, 'A1:Q88')

    portada(ws, 'Tablero de bienestar animal', '{{alcance}}', 'Q', 'potrero', 560, (14, 34, 22, 20, 14))
    texto(ws, 'C5', 'Generado por {{quien}} el {{generado}}', fuente(9, SOBRE_NOCHE), Alignment(vertical='top', indent=1))

    # Indicadores: cuatro tarjetas con el valor grande y el detalle debajo
    tarjetas = [
        ('B', 'D', 'Evaluaciones finalizadas', 'k.evaluaciones', '0'),
        ('F', 'H', 'Predios evaluados', 'k.predios', None),
        ('J', 'L', 'Puntaje promedio (0 a 5)', 'k.puntaje', '0.00'),
        ('N', 'P', 'Nivel alto o excelente', 'k.buenas', '0%'),
    ]
    ws.row_dimensions[7].height = 10
    ws.row_dimensions[8].height = 22
    ws.row_dimensions[9].height = 40
    ws.row_dimensions[10].height = 20
    ws.row_dimensions[11].height = 10
    for ini, fin, etiqueta, clave, formato in tarjetas:
        fondo(ws, f'{ini}8:{fin}11', BLANCO)
        for c in ws[f'{ini}8:{fin}8'][0]:
            c.border = Border(top=grueso_verde)
        texto(ws, f'{ini}8', etiqueta.upper(), fuente(9, SUAVE, True), Alignment(vertical='bottom', indent=1), f'{ini}8:{fin}8')
        texto(ws, f'{ini}9', '{{' + clave + '}}', fuente(28, ACENTO_FUERTE, True), Alignment(horizontal='left', vertical='center', indent=1), f'{ini}9:{fin}9', formato)
        texto(ws, f'{ini}10', '{{' + clave + '.detalle}}', fuente(9.5, SUAVE), Alignment(vertical='top', indent=1), f'{ini}10:{fin}10')
    # Variación: verde si sube, rojo si baja
    for ini in 'BFJN':
        ws.conditional_formatting.add(f'{ini}10', FormulaRule(formula=[f'LEFT({ini}10,1)="▲"'], font=Font(color=ACENTO, bold=True)))
        ws.conditional_formatting.add(f'{ini}10', FormulaRule(formula=[f'LEFT({ini}10,1)="▼"'], font=Font(color=ALERTA, bold=True)))

    ancho_panel = sum(px(ANCHO_CANAL if c in CANALES else ANCHO_COL) for c in 'BCDEFGH')
    ancho_total = sum(px(ANCHO_CANAL if c in CANALES else ANCHO_COL) for c in 'BCDEFGHIJKLMNOP')
    alto = lambda filas: cm(filas * 20)

    # Fila 13-31: niveles (dona) y libertades (columnas con meta)
    panel(ws, 'B13:H31', 'Evaluaciones por nivel', 'Cuántas evaluaciones quedaron en cada nivel de la escala del ICA.')
    panel(ws, 'J13:P31', 'Promedio por libertad', 'Escala de 0 a 5. La línea marca la meta de nivel alto (4,0).')
    dona = DoughnutChart(holeSize=58)
    dona.add_data(Reference(datos, min_col=2, min_row=5, max_row=8), titles_from_data=False)
    dona.set_categories(Reference(datos, min_col=1, min_row=5, max_row=8))
    serie = dona.series[0]
    for i, nombre in enumerate(['Bajo', 'Medio', 'Alto', 'Excelente']):
        pt = DataPoint(idx=i)
        pt.graphicalProperties.solidFill = COLOR_NIVEL[nombre]
        pt.graphicalProperties.line.solidFill = BLANCO
        serie.dPt.append(pt)
    etiquetas(serie, '0;-0;;', None, BLANCO)
    estilo_grafico(dona, cm(ancho_panel - 16), alto(16), 'r')
    dona.legend.txPr = rich(10, TINTA, True)
    ws.add_chart(dona, 'B16')

    libertades = BarChart()
    libertades.type, libertades.gapWidth = 'col', 70
    libertades.add_data(Reference(datos, min_col=3, min_row=11, max_row=15), titles_from_data=True)
    libertades.set_categories(Reference(datos, min_col=1, min_row=12, max_row=15))
    color_serie(libertades.series[0], ACENTO)
    etiquetas(libertades.series[0], '0.0')
    meta = LineChart()
    meta.add_data(Reference(datos, min_col=4, min_row=11, max_row=15), titles_from_data=True)
    color_serie(meta.series[0], MAIZ, linea=True)
    meta.series[0].graphicalProperties.line.dashStyle = 'dash'
    meta.series[0].marker.symbol = 'none'
    estilo_grafico(libertades, cm(ancho_panel - 16), alto(16), 'b')
    ejes(libertades, 0, 5, '0', 1)
    libertades += meta
    ws.add_chart(libertades, 'J16')

    # Fila 33-51: tendencia mensual (columnas + línea en eje secundario)
    panel(ws, 'B33:P51', 'Tendencia de los últimos 12 meses', 'Columnas: evaluaciones finalizadas por mes (eje izquierdo). Línea: puntaje promedio de 0 a 5 (eje derecho).')
    columnas = BarChart()
    columnas.type, columnas.gapWidth = 'col', 55
    columnas.add_data(Reference(datos, min_col=2, min_row=18, max_row=30), titles_from_data=True)
    columnas.set_categories(Reference(datos, min_col=1, min_row=19, max_row=30))
    color_serie(columnas.series[0], 'A7DDBC')
    estilo_grafico(columnas, cm(ancho_total - 16), alto(16), 'b')
    ejes(columnas, 0, None, '0')
    linea = LineChart()
    linea.add_data(Reference(datos, min_col=3, min_row=18, max_row=30), titles_from_data=True)
    color_serie(linea.series[0], ACENTO_FUERTE, linea=True)
    linea.series[0].marker.symbol = 'circle'
    linea.series[0].marker.size = 7
    linea.series[0].marker.graphicalProperties = GraphicalProperties(solidFill=ACENTO_FUERTE)
    linea.series[0].marker.graphicalProperties.line.solidFill = BLANCO
    etiquetas(linea.series[0], '0.0', 't', ACENTO_FUERTE)
    linea.y_axis.axId = 200
    linea.y_axis.crosses = 'max'
    linea.y_axis.scaling.min, linea.y_axis.scaling.max, linea.y_axis.majorUnit = 0, 5, 1
    linea.y_axis.delete = False
    linea.y_axis.numFmt = '0'
    linea.y_axis.number_format = '0'
    linea.y_axis.majorGridlines = None
    linea.y_axis.txPr = rich(9, ACENTO_FUERTE, True)
    linea.y_axis.graphicalProperties = GraphicalProperties(ln=LineProperties(noFill=True))
    columnas += linea
    ws.add_chart(columnas, 'B36')

    # Fila 53-71: hallazgos frecuentes y departamentos
    panel(ws, 'B53:H71', 'Criterios con más hallazgos', 'Evaluaciones en que cada criterio quedó en nivel bajo o medio, y cuántas fueron críticas.')
    panel(ws, 'J53:P71', 'Puntaje por departamento', 'Promedio de 0 a 5 de las evaluaciones de cada departamento.')
    hallazgos = BarChart()
    hallazgos.type, hallazgos.gapWidth, hallazgos.overlap = 'bar', 45, -10
    hallazgos.add_data(Reference(datos, min_col=2, max_col=3, min_row=33, max_row=38), titles_from_data=True)
    hallazgos.set_categories(Reference(datos, min_col=1, min_row=34, max_row=38))
    color_serie(hallazgos.series[0], 'D99A1E')
    color_serie(hallazgos.series[1], ALERTA)
    for s in hallazgos.series:
        etiquetas(s, '0;-0;;', 'outEnd', TINTA)
    estilo_grafico(hallazgos, cm(ancho_panel - 16), alto(16), 'b')
    ejes(hallazgos, 0, None, '0', 1)
    hallazgos.x_axis.scaling.orientation = 'maxMin'
    ws.add_chart(hallazgos, 'B56')

    deptos = BarChart()
    deptos.type, deptos.gapWidth = 'bar', 55
    deptos.add_data(Reference(datos, min_col=3, min_row=41, max_row=49), titles_from_data=True)
    deptos.set_categories(Reference(datos, min_col=1, min_row=42, max_row=49))
    color_serie(deptos.series[0], ACCION)
    etiquetas(deptos.series[0], '0.00')
    estilo_grafico(deptos, cm(ancho_panel - 16), alto(16), None)
    ejes(deptos, 0, 5, '0', 1)
    deptos.x_axis.scaling.orientation = 'maxMin'
    ws.add_chart(deptos, 'J56')

    # Fila 73-80: predios que requieren atención
    panel(ws, 'B73:P81', 'Predios que requieren atención', 'Última evaluación de cada predio en nivel bajo o medio, la más baja primero. La norma pide acciones correctivas.')
    cab = [('B', 'D', 'Predio'), ('F', 'H', 'Municipio'), ('J', 'K', 'Finalizada'), ('L', 'L', 'Puntaje'), ('N', 'P', 'Nivel')]
    for ini, fin, nombre in cab:
        texto(ws, f'{ini}75', nombre.upper(), fuente(8.5, SUAVE, True), Alignment(vertical='center', indent=1), f'{ini}75:{fin}75' if ini != fin else None)
        for c in ws[f'{ini}75:{fin}75'][0]:
            c.border = Border(bottom=Side(style='thin', color=TINTA))
    claves = [('B', 'D', 'at.{}.predio', None), ('F', 'H', 'at.{}.municipio', None), ('J', 'K', 'at.{}.fecha', 'dd/mm/yyyy'), ('L', 'L', 'at.{}.puntaje', '0.00'), ('N', 'P', 'at.{}.nivel', None)]
    for k in range(5):
        fila = 76 + k
        ws.row_dimensions[fila].height = 19
        for ini, fin, clave, formato in claves:
            c = texto(ws, f'{ini}{fila}', '{{' + clave.format(k) + '}}', fuente(10, TINTA, ini == 'B'), Alignment(vertical='center', indent=1), f'{ini}{fila}:{fin}{fila}' if ini != fin else None, formato)
            for x in ws[f'{ini}{fila}:{fin}{fila}'][0]:
                x.border = Border(bottom=fino)
    formato_niveles(ws, 'N76:P80')
    texto(ws, 'B81', '{{at.nota}}', fuente(9, SUAVE, cursiva=True), Alignment(vertical='center', indent=1))

    # Fila 83-88: análisis
    fondo(ws, 'B83:P88', ACENTO_SUAVE)
    for c in ws['B83:P83'][0]:
        c.border = Border(top=Side(style='medium', color=ACENTO))
    texto(ws, 'B83', '{{an.titulo}}', fuente(12.5, ACENTO_FUERTE, True), Alignment(vertical='center', indent=1), 'B83:P83')
    ws.row_dimensions[83].height = 24
    texto(ws, 'B84', '{{an.resumen}}', fuente(10.5, TINTA), Alignment(vertical='top', wrap_text=True, indent=1), 'B84:P87')
    for f in range(84, 88):
        ws.row_dimensions[f].height = 18
    texto(ws, 'B88', 'Las observaciones y acciones completas están en la hoja «Análisis IA».', fuente(9, SUAVE, cursiva=True), Alignment(vertical='center', indent=1))

    ws.print_area = 'A1:Q88'
    ws.page_setup.orientation = 'portrait'
    ws.page_setup.paperSize = ws.PAPERSIZE_LETTER
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_options.horizontalCentered = True
    ws.page_margins.left = ws.page_margins.right = 0.3
    return ws


# ---------- Hojas con tablas ----------

def hoja_evaluaciones(wb):
    ws = wb.create_sheet('Evaluaciones')
    ws.sheet_properties.tabColor = ACENTO
    ws.sheet_view.showGridLines = False
    ws.column_dimensions['A'].width = 2
    columnas = [
        ('Código', 11), ('Predio', 24), ('Departamento', 15), ('Municipio', 15), ('Especie', 10), ('Sistema productivo', 16),
        ('Tipo de productor', 15), ('Animales', 10), ('Evaluador', 20), ('Fecha de visita', 12), ('Finalizada', 12),
        ('Puntaje (0 a 5)', 11), ('Nivel', 11), ('{{lib.0.encabezado}}', 13), ('{{lib.1.encabezado}}', 13), ('{{lib.2.encabezado}}', 13),
        ('{{lib.3.encabezado}}', 13), ('Criterios con hallazgos', 11), ('Hallazgos críticos', 11), ('Criterios con hallazgo', 50), ('Recomendaciones', 20),
    ]
    portada(ws, 'Evaluaciones finalizadas', '{{alcance}} · una fila por evaluación, con filtros en cada columna.', 'V', 'cria', 520, (14, 34, 22, 14))
    encabezado_tabla(ws, 6, columnas)
    fila_modelo(ws, 7, [
        ('f.codigo', None), ('f.predio', None), ('f.departamento', None), ('f.municipio', None), ('f.especie', None), ('f.sistema', None),
        ('f.productor', None), ('f.animales', '#,##0'), ('f.evaluador', None), ('f.visita', 'dd/mm/yyyy'), ('f.finalizada', 'dd/mm/yyyy'),
        ('f.puntaje', '0.00'), ('f.nivel', None), ('f.lib0', '0.00'), ('f.lib1', '0.00'), ('f.lib2', '0.00'), ('f.lib3', '0.00'),
        ('f.criterios', '0'), ('f.criticos', '0'), ('f.lista', None), ('f.origen', None),
    ])
    ws['B7'].font = fuente(10, ACENTO, True)
    tabla = Table(displayName='Evaluaciones', ref='B6:V7')
    tabla.tableStyleInfo = TableStyleInfo(name='TableStyleLight1', showRowStripes=True)
    ws.add_table(tabla)
    ws.freeze_panes = 'D7'
    formato_niveles(ws, 'N7:N5000')
    ws.conditional_formatting.add('M7:M5000', DataBarRule(start_type='num', start_value=0, end_type='num', end_value=5, color=ACCION, showValue=True))
    ws.conditional_formatting.add('O7:R5000', ColorScaleRule(start_type='num', start_value=2, start_color='F4C7C3', mid_type='num', mid_value=3.5, mid_color='FBF0D9', end_type='num', end_value=5, end_color='BFE8CF'))
    ws.conditional_formatting.add('T7:T5000', CellIsRule(operator='greaterThan', formula=['0'], font=Font(color=ALERTA, bold=True)))
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = '6:6'


def hoja_hallazgos(wb):
    ws = wb.create_sheet('Hallazgos')
    ws.sheet_properties.tabColor = 'D99A1E'
    ws.sheet_view.showGridLines = False
    ws.column_dimensions['A'].width = 2
    portada(ws, 'Hallazgos por evaluación', 'Criterios en nivel bajo o medio, por evaluación.', 'I', 'bebedero', 380, (14, 34, 22, 14))
    encabezado_tabla(ws, 6, [('Código', 11), ('Predio', 24), ('Departamento', 15), ('Finalizada', 12), ('Nombre del criterio', 46), ('Identificador', 24), ('Crítico', 10), ('Nivel de la evaluación', 14)])
    fila_modelo(ws, 7, [('h.codigo', None), ('h.predio', None), ('h.departamento', None), ('h.finalizada', 'dd/mm/yyyy'), ('h.nombre', None), ('h.criterio', None), ('h.critico', None), ('h.nivel', None)])
    tabla = Table(displayName='Hallazgos', ref='B6:I7')
    tabla.tableStyleInfo = TableStyleInfo(name='TableStyleLight1', showRowStripes=True)
    ws.add_table(tabla)
    ws.freeze_panes = 'B7'
    ws.conditional_formatting.add('H7:H5000', FormulaRule(formula=['EXACT(H7,"Sí")'], fill=relleno(ALERTA_FONDO), font=Font(color='5F150F', bold=True)))
    formato_niveles(ws, 'I7:I5000')
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True


def ajustar_pagina(ws, orientacion):
    ws.page_setup.orientation = orientacion
    ws.page_setup.paperSize = ws.PAPERSIZE_LETTER
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True


def hoja_analisis(wb):
    ws = wb.create_sheet('Análisis IA')
    ws.sheet_properties.tabColor = ACENTO_FUERTE
    ws.sheet_view.showGridLines = False
    ws.column_dimensions['A'].width = 2
    ws.column_dimensions['B'].width = 5
    ws.column_dimensions['C'].width = 64
    ws.column_dimensions['D'].width = 40
    ws.column_dimensions['E'].width = 2
    portada(ws, 'Análisis del tablero', '{{an.titulo}}', 'E', 'veterinaria', 300, (14, 34, 22, 14))
    texto(ws, 'B6', 'Resumen', fuente(13, ACENTO, True))
    texto(ws, 'B7', '{{an.resumen}}', fuente(11.5, TINTA), Alignment(vertical='top', wrap_text=True), 'B7:D7')
    ws.row_dimensions[7].height = 78
    texto(ws, 'B9', 'Lo que muestran las cifras', fuente(13, ACENTO, True))
    for k in range(5):
        texto(ws, f'B{10 + k}', '{{an.obs.' + str(k) + '.n}}', fuente(11, ACCION, True), Alignment(vertical='top', horizontal='center'))
        texto(ws, f'C{10 + k}', '{{an.obs.' + str(k) + '}}', fuente(11), Alignment(vertical='top', wrap_text=True), f'C{10 + k}:D{10 + k}')
        ws.row_dimensions[10 + k].height = 34
    texto(ws, 'B16', 'Acciones sugeridas', fuente(13, ACENTO, True))
    for k in range(5):
        fila = 17 + k
        texto(ws, f'B{fila}', '{{an.acc.' + str(k) + '.n}}', fuente(11, BLANCO, True), Alignment(vertical='top', horizontal='center'))
        texto(ws, f'C{fila}', '{{an.acc.' + str(k) + '}}', fuente(11), Alignment(vertical='top', wrap_text=True), f'C{fila}:D{fila}')
        ws.row_dimensions[fila].height = 34
        ws.conditional_formatting.add(f'B{fila}', FormulaRule(formula=[f'LEN(B{fila})>0'], fill=relleno(ACENTO)))
    texto(ws, 'B23', '{{an.aviso}}', fuente(9, SUAVE, cursiva=True), Alignment(vertical='top', wrap_text=True), 'B23:D23')
    ws.row_dimensions[23].height = 40
    texto(ws, 'B25', 'Privacidad: al modelo de IA solo se envían cifras agregadas del tablero, nunca nombres de predios ni de personas.', fuente(9, SUAVE, cursiva=True), combinar='B25:D25')
    texto(ws, 'B26', '{{an.origen}}', fuente(9, SUAVE, cursiva=True), combinar='B26:D26')
    ajustar_pagina(ws, 'portrait')


def hoja_metodologia(wb):
    ws = wb.create_sheet('Metodología')
    ws.sheet_properties.tabColor = MAIZ
    ws.sheet_view.showGridLines = False
    for col, ancho in zip('ABCDEFG', (2, 38, 12, 36, 3, 30, 30)):
        ws.column_dimensions[col].width = ancho
    portada(ws, 'Cómo se calcula', 'Metodología ICA, bovinos y bufalinos, v2.0 (2023).', 'G', 'sombra', 420, (14, 34, 22, 14))
    texto(ws, 'B6', 'Las cinco libertades y su peso en el puntaje', fuente(13, ACENTO, True))
    for i, n in enumerate(['Libertad', 'Peso', 'Bloque en la aplicación']):
        c = ws.cell(row=7, column=2 + i, value=n)
        c.font, c.fill = fuente(10, BLANCO, True), relleno(NOCHE)
    for k in range(4):
        ws.cell(row=8 + k, column=2, value='{{met.lib.' + str(k) + '.nombre}}').font = fuente(10.5)
        c = ws.cell(row=8 + k, column=3, value='{{met.lib.' + str(k) + '.peso}}')
        c.font, c.number_format = fuente(10.5, ACENTO, True), '0%'
        ws.cell(row=8 + k, column=4, value='{{met.lib.' + str(k) + '.corto}}').font = fuente(10.5)
        for col in range(2, 5):
            ws.cell(row=8 + k, column=col).border = Border(bottom=fino)
            ws.cell(row=8 + k, column=col).alignment = Alignment(vertical='center', wrap_text=True)
        ws.row_dimensions[8 + k].height = 30
    ws.conditional_formatting.add('C8:C11', DataBarRule(start_type='num', start_value=0, end_type='num', end_value=1, color=ACCION, showValue=True))

    texto(ws, 'B14', 'Escala de niveles (puntaje de 0 a 5)', fuente(13, ACENTO, True))
    for i, n in enumerate(['Nivel', 'Rango', 'Qué significa']):
        c = ws.cell(row=15, column=2 + i, value=n)
        c.font, c.fill = fuente(10, BLANCO, True), relleno(NOCHE)
    significados = ['Requiere acciones correctivas urgentes.', 'Cumple parcialmente; hay que mejorar.', 'Buenas prácticas de bienestar.', 'Bienestar sobresaliente.']
    for k in range(4):
        ws.cell(row=16 + k, column=2, value='{{met.niv.' + str(k) + '.nombre}}').font = fuente(10.5, negrita=True)
        ws.cell(row=16 + k, column=3, value='{{met.niv.' + str(k) + '.rango}}').font = fuente(10.5)
        ws.cell(row=16 + k, column=4, value=significados[k]).font = fuente(10.5)
        for col in range(2, 5):
            ws.cell(row=16 + k, column=col).border = Border(bottom=fino)
            ws.cell(row=16 + k, column=col).alignment = Alignment(vertical='center', wrap_text=True)
        ws.row_dimensions[16 + k].height = 30
    formato_niveles(ws, 'B16:B19')

    pasos = [
        ('1. Muestra', 'El tamaño de la muestra de animales depende del inventario del predio (20, 30, 40 animales o el 5 %).'),
        ('2. Criterios', 'Se responden los 23 criterios que aplican según el sistema productivo y el tamaño del predio.'),
        ('3. Árboles de escenarios', '17 criterios se califican con los diagramas de decisión del ICA: cada respuesta suma puntos.'),
        ('4. Libertades', 'Cada libertad se califica de 0 a 5 y pesa en el total según la tabla de arriba.'),
        ('5. Nivel y hallazgos', 'El puntaje total da el nivel; los criterios en nivel bajo o medio quedan como hallazgos.'),
    ]
    texto(ws, 'B22', 'El cálculo paso a paso', fuente(13, ACENTO, True))
    for k, (t, d) in enumerate(pasos):
        texto(ws, f'B{23 + k}', t, fuente(10.5, TINTA, True))
        texto(ws, f'C{23 + k}', d, fuente(10.5), Alignment(vertical='center', wrap_text=True), f'C{23 + k}:D{23 + k}')
        ws.row_dimensions[23 + k].height = 46
        for col in 'BCD':
            ws[f'{col}{23 + k}'].border = Border(bottom=fino)

    # Fotos del proyecto, como en la página de inicio
    poner_imagen(ws, jpg(recorte('bebedero', 420, 300)), 'F6', 210, 150)
    poner_imagen(ws, jpg(recorte('cria', 420, 300)), 'G6', 210, 150)
    poner_imagen(ws, jpg(recorte('veterinaria', 420, 300)), 'F15', 210, 150)
    poner_imagen(ws, jpg(recorte('potrero', 420, 300)), 'G15', 210, 150)
    texto(ws, 'F25', 'Fotos del proyecto ICA Bienestar Animal.', fuente(9, SUAVE, cursiva=True))
    ajustar_pagina(ws, 'landscape')


def main():
    wb = Workbook()
    wb.properties.title = 'Tablero de bienestar animal'
    wb.properties.creator = 'ICA Bienestar Animal'
    wb.properties.subject = 'Tablero exportado desde la aplicación'
    tablero = wb.active
    datos = hoja_datos(wb)
    hoja_tablero(wb, datos)
    hoja_evaluaciones(wb)
    hoja_hallazgos(wb)
    hoja_analisis(wb)
    hoja_metodologia(wb)
    # Orden de las pestañas: Tablero primero, Datos casi al final
    wb._sheets = [tablero] + [wb[n] for n in ('Evaluaciones', 'Hallazgos', 'Análisis IA', 'Metodología', 'Datos')]
    wb.active = 0
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    wb.save(SALIDA)
    print(f'Plantilla escrita en {SALIDA.relative_to(RAIZ)} ({SALIDA.stat().st_size // 1024} kB)')


if __name__ == '__main__':
    main()
