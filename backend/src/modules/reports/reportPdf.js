import PDFDocument from 'pdfkit';
import {clock, dateTime, money, weekdayDate} from './reportFormat.js';

const MARGIN = 40;
const BRAND = '#f7931e';
const DARK = '#1a1a1a';
const MUTED = '#6b6b6b';
const LINE = '#d4d4d4';
const SOFT = '#f3f3f3';
const WHITE = '#ffffff';
const REGULAR = 'Helvetica';
const BOLD = 'Helvetica-Bold';
const CELL_PAD = 4;
const FOOTER_SPACE = 20;
const FONT_SIZE = {brand: 20, title: 11, text: 8, small: 7, saleBar: 9, empty: 10};
const HEADER = {brandSpacing: 2, metaOffset: 4, metaLineHeight: 11, minHeight: 40, ruleGap: 6, ruleHeight: 3, afterRule: 14};
const TILE = {gap: 6, height: 38, pad: 6, valueOffset: 18, afterTiles: 50, borderWidth: 0.6};
const TABLE_BORDER_WIDTH = 0.5;
const SALE = {minSpace: 90, gapBefore: 8, barHeight: 18, textOffset: 5, totalWidth: 90, pad: 6};
const FOOTER_OFFSET = 6;
const EMPTY_OFFSET = 10;
const TITLES = {resumen: 'Resumen de ventas', detalle: 'Ventas detalladas'};
const CONSUMPTION_LABELS = {local: 'Local', llevar: 'Para llevar'};

// Ancho útil de la página
const usable = (doc) => doc.page.width - MARGIN * 2;

// Salta de página si lo que sigue no entra
const ensureSpace = (doc, height) => {
  if (doc.y + height > doc.page.height - MARGIN - FOOTER_SPACE) {
    doc.addPage();
  }
};

// Cabecera con el nombre del local, el tipo de reporte, el período, el empleado y quién lo generó
const header = (doc, meta) => {
  const top = doc.y;
  doc.font(BOLD).fontSize(FONT_SIZE.brand).fillColor(DARK).text('BRASA BRAVA', MARGIN, top, {characterSpacing: HEADER.brandSpacing});
  doc.font(BOLD).fontSize(FONT_SIZE.title).text(TITLES[meta.tipo]);
  doc.font(REGULAR).fontSize(FONT_SIZE.text).fillColor(DARK);
  const lines = [`Período: ${meta.periodo}`, `Empleado: ${meta.empleado}`, `Generado: ${meta.generado}`];
  lines.forEach((line, index) => doc.text(line, MARGIN, top + HEADER.metaOffset + index * HEADER.metaLineHeight, {width: usable(doc), align: 'right'}));
  const ruleY = Math.max(doc.y, top + HEADER.minHeight) + HEADER.ruleGap;
  doc.rect(MARGIN, ruleY, usable(doc), HEADER.ruleHeight).fill(BRAND);
  doc.y = ruleY + HEADER.afterRule;
};

// Cinco recuadros con los totales del período
const tiles = (doc, resumen) => {
  const items = [['Ventas', String(resumen.cantidad)], ['Total', `Bs ${money(resumen.total)}`], ['Efectivo', `Bs ${money(resumen.efectivo)}`], ['QR', `Bs ${money(resumen.qr)}`], ['Promedio', `Bs ${money(resumen.promedio)}`]];
  const width = (usable(doc) - TILE.gap * (items.length - 1)) / items.length;
  const top = doc.y;
  items.forEach(([label, value], index) => {
    const x = MARGIN + index * (width + TILE.gap);
    const textWidth = width - TILE.pad * 2;
    doc.rect(x, top, width, TILE.height).lineWidth(TILE.borderWidth).strokeColor(LINE).stroke();
    doc.font(REGULAR).fontSize(FONT_SIZE.small).fillColor(MUTED).text(label.toUpperCase(), x + TILE.pad, top + TILE.pad, {width: textWidth});
    doc.font(BOLD).fontSize(FONT_SIZE.title).fillColor(DARK).text(value, x + TILE.pad, top + TILE.valueOffset, {width: textWidth});
  });
  doc.y = top + TILE.afterTiles;
};

// Alto de una fila según el texto más largo de sus celdas
const rowHeight = (doc, columns, cells, font) => {
  doc.font(font).fontSize(FONT_SIZE.text);
  return Math.max(...cells.map((cell, index) => doc.heightOfString(String(cell), {width: columns[index].width - CELL_PAD * 2}))) + CELL_PAD * 2;
};

// Una fila de la tabla con bordes; "fill" pinta el fondo (cabecera o total)
const row = (doc, columns, cells, {font = REGULAR, fill, color = DARK} = {}) => {
  const height = rowHeight(doc, columns, cells, font);
  ensureSpace(doc, height);
  const top = doc.y;
  let x = MARGIN;
  if (fill) {
    doc.rect(MARGIN, top, usable(doc), height).fill(fill);
  }
  columns.forEach((column, index) => {
    doc.rect(x, top, column.width, height).lineWidth(TABLE_BORDER_WIDTH).strokeColor(LINE).stroke();
    doc.font(font).fontSize(FONT_SIZE.text).fillColor(color).text(String(cells[index]), x + CELL_PAD, top + CELL_PAD, {width: column.width - CELL_PAD * 2, align: column.align ?? 'left'});
    x += column.width;
  });
  doc.y = top + height;
};

// Columnas con anchos en proporción al ancho útil
const columnsOf = (doc, specs) => {
  const total = specs.reduce((sum, spec) => sum + spec.share, 0);
  return specs.map((spec) => ({...spec, width: usable(doc) * spec.share / total}));
};

// Tabla de días con la fila del total
const daysTable = (doc, report, timeZone) => {
  const columns = columnsOf(doc, [{label: 'Día', share: 3}, {label: 'Ventas', share: 1.2, align: 'right'}, {label: 'Efectivo Bs', share: 2, align: 'right'}, {label: 'QR Bs', share: 2, align: 'right'}, {label: 'Total Bs', share: 2, align: 'right'}]);
  row(doc, columns, columns.map((column) => column.label), {font: BOLD, fill: DARK, color: WHITE});
  for (const day of report.dias) {
    row(doc, columns, [weekdayDate(day.fecha, timeZone), day.ventas, money(day.efectivo), money(day.qr), money(day.total)]);
  }
  const {resumen} = report;
  row(doc, columns, ['Total del período', resumen.cantidad, money(resumen.efectivo), money(resumen.qr), money(resumen.total)], {font: BOLD, fill: SOFT});
};

// Cómo se pagó una venta: "Efectivo Bs 100,00 + QR Bs 95,00 · Recibido Bs 100,00 · Cambio Bs 0,00"
const paymentText = (sale) => {
  const parts = [];
  if (sale.efectivo > 0) {
    parts.push(`Efectivo Bs ${money(sale.efectivo)}`);
  }
  if (sale.qr > 0) {
    parts.push(`QR Bs ${money(sale.qr)}`);
  }
  let text = parts.join(' + ');
  if (sale.recibido !== null) {
    text = `${text} · Recibido Bs ${money(sale.recibido)} · Cambio Bs ${money(sale.cambio)}`;
  }
  return text;
};

// "1 vez" o "3 veces"
const timesText = (count) => {
  if (count === 1) {
    return '1 vez';
  }
  return `${count} veces`;
};

// Cada venta con su barra de título, quién la abrió y cobró, cómo se pagó y sus líneas por envío
const salesDetail = (doc, report, timeZone) => {
  const columns = columnsOf(doc, [{label: 'Envío', share: 1.6}, {label: 'Cant.', share: 0.7, align: 'right'}, {label: 'Producto', share: 4}, {label: 'Consumo', share: 1.4}, {label: 'Sin', share: 3}, {label: 'Subtotal', share: 1.4, align: 'right'}]);
  for (const sale of report.ventas) {
    ensureSpace(doc, SALE.minSpace);
    doc.y += SALE.gapBefore;
    const top = doc.y;
    doc.rect(MARGIN, top, usable(doc), SALE.barHeight).fill(DARK);
    doc.font(BOLD).fontSize(FONT_SIZE.saleBar).fillColor(WHITE)
      .text(`Venta Nº ${sale.numero} · ${dateTime(sale.cerradaEn, timeZone)} · ${sale.mesa} · ${sale.seccion}`, MARGIN + SALE.pad, top + SALE.textOffset, {width: usable(doc) - SALE.totalWidth})
      .text(`Bs ${money(sale.total)}`, MARGIN, top + SALE.textOffset, {width: usable(doc) - SALE.pad, align: 'right'});
    doc.y = top + SALE.barHeight;
    let info = `Abrió: ${sale.abrio} · Cobró: ${sale.cobrador ?? '—'} · ${paymentText(sale)} · Ticket impreso ${timesText(sale.impresiones)}`;
    for (const item of sale.autorizaciones) {
      info = `${info} · la ${item.numero}.ª la autorizó ${item.autorizadoPor}`;
    }
    row(doc, [{width: usable(doc)}], [info], {color: MUTED});
    row(doc, columns, columns.map((column) => column.label), {font: BOLD, fill: SOFT});
    for (const envio of sale.envios) {
      for (const line of envio.lineas) {
        let product = line.nombre;
        if (line.productos) {
          product = `${line.nombre}\n${line.productos}`;
        }
        row(doc, columns, [`${envio.numero} · ${clock(envio.creadoEn, timeZone)}\n${envio.cajero}`, line.cantidad, product, CONSUMPTION_LABELS[line.consumo], line.sin || '—', money(line.subtotal)]);
      }
    }
  }
};

// Número de página al pie de cada hoja
const footers = (doc) => {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    // Sin margen inferior mientras se escribe el pie, para que no abra otra hoja
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font(REGULAR).fontSize(FONT_SIZE.small).fillColor(MUTED)
      .text(`Página ${index + 1} de ${range.count} · Brasa Brava · Sistema de gestión`, MARGIN, doc.page.height - MARGIN + FOOTER_OFFSET, {width: usable(doc), align: 'center', lineBreak: false});
    doc.page.margins.bottom = bottom;
  }
};

// Genera el PDF del reporte (resumen o detallado) y lo devuelve como Buffer
export const renderReportPdf = (report, meta, timeZone) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({size: 'A4', margin: MARGIN, bufferPages: true, info: {Title: `${TITLES[meta.tipo]} · ${meta.periodo}`, Author: 'Brasa Brava'}});
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  header(doc, meta);
  tiles(doc, report.resumen);
  if (report.resumen.cantidad === 0) {
    doc.font(REGULAR).fontSize(FONT_SIZE.empty).fillColor(MUTED).text('No hubo ventas cobradas en este período.', MARGIN, doc.y + EMPTY_OFFSET, {width: usable(doc), align: 'center'});
  }
  else if (meta.tipo === 'detalle') {
    salesDetail(doc, report, timeZone);
  }
  else {
    daysTable(doc, report, timeZone);
  }
  footers(doc);
  doc.end();
});
