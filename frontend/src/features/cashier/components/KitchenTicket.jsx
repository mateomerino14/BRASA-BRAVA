import {formatTime} from '../../../lib/format';

const styles = {
  ticket: 'font-mono text-[13px] leading-snug text-black',
  center: 'text-center',
  brand: 'text-center text-base font-bold tracking-widest',
  title: 'text-center font-bold',
  modified: 'my-1 text-center font-bold',
  rule: 'my-2 border-t border-dashed border-black',
  head: 'flex justify-between font-bold',
  line: 'flex justify-between',
  name: 'flex-1 break-words pr-2',
  qty: 'w-11 shrink-0',
  type: 'w-6 shrink-0 text-right',
  note: 'pl-11',
};

const exclusionNote = (detail) => {
  if (detail.exclusiones.length === 0) {
    return [];
  }
  if (detail.tipo !== 'promocion') {
    return [`sin: ${detail.exclusiones.map((item) => item.insumo.toLowerCase()).join(', ')}`];
  }
  const byProduct = new Map();
  for (const item of detail.exclusiones) {
    byProduct.set(item.producto, [...(byProduct.get(item.producto) ?? []), item.insumo.toLowerCase()]);
  }
  return [...byProduct.entries()].map(([producto, insumos]) => `${producto} sin: ${insumos.join(', ')}`);
};

// Comanda de cocina de un envío: solo lo nuevo de ese envío, sin precios, con L (local) o LL (para llevar)
export function KitchenTicket({mesa, venta, envio, printedAt}) {
  const comanda = venta.comandas.find((item) => item.envio === envio);
  const lines = venta.detalles.filter((item) => item.envio === envio);
  const units = lines.reduce((total, item) => total + item.cantidad, 0);
  return (
    <article aria-label={`Comanda del envío ${envio}`} className={styles.ticket}>
      <p className={styles.brand}>BRASA BRAVA</p>
      <p className={styles.title}>COMANDA DE COCINA</p>
      {envio > 1 && <p className={styles.modified}>*** MODIFICADO POR: {comanda?.cajero.toUpperCase()} ***</p>}
      <div className={styles.rule} />
      <p>Pedido Nº {venta.numero} · Envío {envio}</p>
      <p>{mesa.nombre} · {mesa.seccion.nombre}</p>
      {comanda && <p>Mesero: {comanda.mesero.nombre}</p>}
      {comanda && <p>Cajero: {comanda.cajero}</p>}
      {comanda && <p>Pedido: {formatTime(comanda.creadoEn)} · Impreso: {formatTime(printedAt)}</p>}
      <div className={styles.rule} />
      <p className={styles.head}><span className={styles.qty}>CANT</span><span className={styles.name}>PRODUCTO</span><span className={styles.type}>T</span></p>
      {lines.map((detail) => (
        <div key={detail.id}>
          <p className={styles.line}>
            <span className={styles.qty}>{detail.cantidad}</span>
            <span className={styles.name}>{detail.nombre}</span>
            <span className={styles.type}>{detail.consumo === 'llevar' ? 'LL' : 'L'}</span>
          </p>
          {(detail.productos ?? []).map((product) => <p key={product.nombre} className={styles.note}>· {product.cantidad} {product.nombre}</p>)}
          {exclusionNote(detail).map((note) => <p key={note} className={styles.note}>{note}</p>)}
        </div>
      ))}
      <div className={styles.rule} />
      <p>Unidades: {units}</p>
      <p className={styles.center}>L = local · LL = para llevar</p>
    </article>
  );
}
