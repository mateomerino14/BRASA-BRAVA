import {formatDate, formatDays, normalizeText} from '../../../lib/format';
import {ALL, LOW_PORTIONS} from '../constants/family';

// Estado de un producto en el catálogo: agotado (lo marcó el local), sin stock, quedan pocas o disponible
export const productStatus = (product) => {
  if (!product.disponible) {
    return {tone: 'neutral', label: 'Agotado'};
  }
  if (product.porciones === 0) {
    return {tone: 'danger', label: 'Sin stock'};
  }
  if (product.porciones !== null && product.porciones <= LOW_PORTIONS) {
    return {tone: 'warning', label: `Quedan ${product.porciones}`};
  }
  return null;
};

// Cuándo aplica una promoción: hoy, en sus días o desde su fecha de inicio
export const promotionWhen = (promotion) => {
  if (promotion.vigencia === 'vigente') {
    return {tone: 'success', label: 'Hoy'};
  }
  if (promotion.vigencia === 'programada') {
    return {tone: 'warning', label: `Desde ${formatDate(promotion.fechaInicio)}`};
  }
  return {tone: 'neutral', label: formatDays(promotion.dias)};
};

// Filtra los productos por categoría, subcategoría y texto (sin tildes)
export const filterProducts = (products, {categoria, subcategoria, search}) => {
  const text = normalizeText(search ?? '');
  return products.filter((product) => (
    (categoria === ALL || String(product.idCategoria) === categoria)
    && (subcategoria === ALL || String(product.idSubcategoria) === subcategoria)
    && (!text || normalizeText(`${product.nombre} ${product.descripcion ?? ''}`).includes(text))
  ));
};

// Filtra las promociones por nombre o por los productos que incluyen
export const filterPromotions = (promotions, search) => {
  const text = normalizeText(search ?? '');
  if (!text) {
    return promotions;
  }
  return promotions.filter((promotion) => normalizeText(`${promotion.nombre} ${promotion.productos.map((item) => item.nombre).join(' ')}`).includes(text));
};
