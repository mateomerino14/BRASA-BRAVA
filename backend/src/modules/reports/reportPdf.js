import PDFDocument from 'pdfkit';
import {clock, dateTime, money, weekdayDate} from './reportFormat.js';

const MARGIN = 40;
const BRAND = '#f7931e';
const DARK = '#1a1a1a';
const MUTED = '#6b6b6b';
const LINE = '#d4d4d4';
const SOFT = '#f3f3f3';
const CELL_PAD = 4;
const TITLES = {resumen: 'Resumen de ventas', detalle: 'Ventas detalladas'};
const CONSUMO = {local: 'Local', llevar: 'Para llevar'};

// Ancho útil de la página
const usable = (doc) => doc.page.width - MARGIN * 2;

// Salta de página si lo que sigue no entra
const ensureSpace = (doc, height) => {
  if (doc.y + height > doc.page.height - MARGIN - 20) {
    doc.addPage();
  }
};

// Cabecera con el nombre del local, el tipo de reporte, el período, el empleado y quién lo generó
const header = (doc, meta) => {
  const top = doc.y;
  doc.font('Helvetica-Bold').fontSize(20).fillColor(DARK).text('BRASA BRAVA', MARGIN, top, {characterSpacing: 2});
  doc.font('Helvetica-Bold').fontSize(11).text(TITLES[meta.tipo]);
  doc.font('Helvetica').fontSize(8).fillColor(DARK);
  const lines = [`Período: ${meta.periodo}`, `Empleado: ${meta.empleado}`, `Generado: ${meta.generado}`];
  lines.forEach((line, index) => doc.text(line, MARGIN, top + 4 + index * 11, {width: usable(doc), align: 'right'}));
  const ruleY = Math.max(doc.y, top + 40) + 6;
  doc.rect(MARGIN, ruleY, usable(doc), 3).fill(BRAND);
  doc.y = ruleY + 14;
};

// Cinco recuadros con los totales del período
const tiles = (doc, resumen) => {
  const items = [['Ventas', String(resumen.cantidad)], ['Total', `Bs ${money(resumen.total)}`], ['Efectivo', `Bs ${money(resumen.efectivo)}`], ['QR', `Bs ${money(resumen.qr)}`], ['Promedio', `Bs ${money(resumen.promedio)}`]];
  const gap = 6;
  const width = (usable(doc) - gap * (items.length - 1)) / items.length;
  const top = doc.y;
  items.forEach(([label, value], index) => {
    const x = MARGIN + index * (width + gap);
    doc.rect(x, top, width, 38).lineWidth(0.6).strokeColor(LINE).stroke();
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(label.toUpperCase(), x + 6, top + 6, {width: width - 12});
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text(value, x + 6, top + 18, {width: width - 12});
  });
  doc.y = top + 50;
};

// Alto de una fila según el texto más largo de sus celdas
const rowHeight = (doc, columns, cells, font) => {
  doc.font(font).fontSize(8);
  return Math.max(...cells.map((cell, index) => doc.heightOfString(String(cell), {width: columns[index].width - CELL_PAD * 2}))) + CELL_PAD * 2;
};

// Una fila de la tabla con bordes; "fill" pinta el fondo (cabecera o total)
const row = (doc, columns, cells, {font = 'Helvetica', fill, color = DARK} = {}) => {
  const height = rowHeight(doc, columns, cells, font);
  ensureSpace(doc, height);
  const top = doc.y;
  let x = MARGIN;
  if (fill) {
    doc.rect(MARGIN, top, usable(doc), height).fill(fill);
  }
  columns.forEach((column, index) => {
    doc.rect(x, top, column.width, height).lineWidth(0.5).strokeColor(LINE).stroke();
    doc.font(font).fontSize(8).fillColor(color).text(String(cells[index]), x + CELL_PAD, top + CELL_PAD, {width: column.width - CELL_PAD * 2, align: column.align ?? 'left'});
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
  row(doc, columns, columns.map((column) => column.label), {font: 'Helvetica-Bold', fill: DARK, color: '#ffffff'});
  for (const day of report.dias) {
    row(doc, columns, [weekdayDate(day.fecha, timeZone), day.ventas, money(day.efectivo), money(day.qr), money(day.total)]);
  }
  const {resumen} = report;
  row(doc, columns, ['Total del período', resumen.cantidad, money(resumen.efectivo), money(resumen.qr), money(resumen.total)], {font: 'Helvetica-Bold', fill: SOFT});
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
    ensureSpace(doc, 90);
    doc.y += 8;
    const top = doc.y;
    doc.rect(MARGIN, top, usable(doc), 18).fill(DARK);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
      .text(`Venta Nº ${sale.numero} · ${dateTime(sale.cerradaEn, timeZone)} · ${sale.mesa} · ${sale.seccion}`, MARGIN + 6, top + 5, {width: usable(doc) - 90})
      .text(`Bs ${money(sale.total)}`, MARGIN, top + 5, {width: usable(doc) - 6, align: 'right'});
    doc.y = top + 18;
    let info = `Abrió: ${sale.abrio} · Cobró: ${sale.cobrador ?? '—'} · ${paymentText(sale)} · Ticket impreso ${timesText(sale.impresiones)}`;
    for (const item of sale.autorizaciones) {
      info = `${info} · la ${item.numero}.ª la autorizó ${item.autorizadoPor}`;
    }
    row(doc, [{width: usable(doc)}], [info], {color: MUTED});
    row(doc, columns, columns.map((column) => column.label), {font: 'Helvetica-Bold', fill: SOFT});
    for (const envio of sale.envios) {
      for (const line of envio.lineas) {
        let product = line.nombre;
        if (line.productos) {
          product = `${line.nombre}\n${line.productos}`;
        }
        row(doc, columns, [`${envio.numero} · ${clock(envio.creadoEn, timeZone)}\n${envio.cajero}`, line.cantidad, product, CONSUMO[line.consumo], line.sin || '—', money(line.subtotal)]);
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
    doc.font('Helvetica').fontSize(7).fillColor(MUTED)
      .text(`Página ${index + 1} de ${range.count} · Brasa Brava · Sistema de gestión`, MARGIN, doc.page.height - MARGIN + 6, {width: usable(doc), align: 'center', lineBreak: false});
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
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('No hubo ventas cobradas en este período.', MARGIN, doc.y + 10, {width: usable(doc), align: 'center'});
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
