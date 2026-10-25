import {formatClock, formatDate, formatDays, formatHours, normalizeText} from '../../../lib/format';
import {ALL, LOW_PORTIONS} from '../constants/family';

export const productStatus = (product) => {
  if (!product.disponible) {
    return {key: 'agotado', tone: 'danger', label: 'Agotado'};
  }
  if (product.porciones === 0) {
    return {key: 'sinStock', tone: 'danger', label: 'Sin stock'};
  }
  if (product.porciones !== null && product.porciones <= LOW_PORTIONS) {
    return {key: 'pocas', tone: 'warning', label: `Quedan ${product.porciones}`};
  }
  return null;
};

const whenHint = (promotion) => [formatDays(promotion.dias), formatHours(promotion.horaInicio, promotion.horaFin)].filter(Boolean).join(' · ');

export const promotionBand = (promotion) => {
  if (!promotion.disponible) {
    let hint = 'Tiene un producto agotado';
    if (promotion.agotados?.length > 0) {
      hint = `Sin ${promotion.agotados.join(', ')}`;
    }
    return {key: 'noSeVende', label: 'No se vende hoy', hint};
  }
  if (promotion.vigencia === 'vigente') {
    let label = 'Hoy';
    if (promotion.horaFin) {
      label = `Ahora, hasta las ${formatClock(promotion.horaFin)}`;
    }
    return {key: 'hoy', label, hint: formatDays(promotion.dias)};
  }
  if (promotion.vigencia === 'mas_tarde') {
    return {key: 'programada', label: `Hoy desde las ${formatClock(promotion.horaInicio)}`, hint: whenHint(promotion)};
  }
  if (promotion.vigencia === 'termino_hoy') {
    return {key: 'otroDia', label: 'Terminó por hoy', hint: whenHint(promotion)};
  }
  if (promotion.vigencia === 'programada') {
    return {key: 'programada', label: `Desde el ${formatDate(promotion.fechaInicio)}`, hint: whenHint(promotion)};
  }
  return {key: 'otroDia', label: formatDays(promotion.dias), hint: 'Hoy no aplica'};
};

export const withSoldOut = (promotions, products) => {
  const soldOut = new Set(products.filter((product) => !product.disponible).map((product) => product.id));
  return promotions.map((promotion) => ({
    ...promotion,
    agotados: promotion.productos.filter((item) => soldOut.has(item.id)).map((item) => item.nombre.toLowerCase()),
  }));
};

export const filterProducts = (products, {categoria, subcategoria, search}) => {
  const text = normalizeText(search ?? '');
  return products.filter((product) => (
    (categoria === ALL || String(product.idCategoria) === categoria)
    && (subcategoria === ALL || String(product.idSubcategoria) === subcategoria)
    && (!text || normalizeText(`${product.nombre} ${product.descripcion ?? ''}`).includes(text))
  ));
};

export const filterPromotions = (promotions, search) => {
  const text = normalizeText(search ?? '');
  if (!text) {
    return promotions;
  }
  return promotions.filter((promotion) => normalizeText(`${promotion.nombre} ${promotion.productos.map((item) => item.nombre).join(' ')}`).includes(text));
};
