import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

// Martes 13 de octubre de 2026, 20:00 en La Paz
const NOW = new Date('2026-10-14T00:00:00Z');

describe('Eliminación física (solo el DIRECTORIO)', () => {
  let ctx;
  let directorio;

  const start = async () => {
    ctx = await createTestApp({clock: () => NOW});
    directorio = await loginAs(ctx.app, 'DIRECTORIO');
  };
  afterEach(() => ctx.db.close());

  const api = (method, url, session = directorio) => request(ctx.app)[method](url).set('authorization', session.authorization);
  const one = async (sql, params = []) => (await ctx.db.query(sql, params)).rows[0];
  const count = async (sql, params = []) => (await one(sql, params)).total;
  const idOf = async (table, column, name, field = 'nombre') => (await one(`SELECT ${column} AS id FROM ${table} WHERE ${field} = $1`, [name])).id;

  // c.mendoza abre y cobra la Mesa 1 con una Hamburguesa Clásica; después queda de baja
  const closedSaleBy = async (alias) => {
    const session = await loginAs(ctx.app, alias);
    const mesa = await idOf('mesa', 'id_mesa', 'Mesa 1');
    const producto = await idOf('producto', 'id_producto', 'Hamburguesa Clásica');
    await api('post', `/api/sales/tables/${mesa}/orders`, session).send({items: [{tipo: 'producto', id: producto, cantidad: 1, consumo: 'local'}]});
    await ctx.db.query('UPDATE venta_detalle SET listos = cantidad');
    const res = await api('post', `/api/sales/tables/${mesa}/checkout`, session).send({pagos: [{metodo: 'qr', monto: 35}]});
    return res.body.ticket.id;
  };

  it('solo el DIRECTORIO entra; ningún cargo puede tener este permiso', async () => {
    await start();
    const admin = await loginAs(ctx.app, 'admin');
    expect(admin.user.permissions).not.toContain('eliminacion');
    expect((await api('get', '/api/deletion/candidates/empleados', admin)).status).toBe(403);
    expect(directorio.user.permissions).toContain('eliminacion');
    const res = await api('get', '/api/deletion/candidates/empleados');
    expect(res.status).toBe(200);
    expect(res.body.registros.map((row) => row.alias)).toEqual(['j.ortiz']);
    const role = await api('post', '/api/roles', admin).send({nombre: 'Borrador', pantallas: ['eliminacion']});
    expect(role.status).toBe(400);
  });

  it('no deja borrar lo que sigue activo ni lo que tiene pedidos abiertos', async () => {
    await start();
    const mendoza = await idOf('empleado', 'id_empleado', 'c.mendoza', 'alias');
    const active = await api('post', '/api/deletion/preview').send({empleados: [mendoza]});
    expect(active.body.bloqueos).toEqual(['Carlos Mendoza sigue activo: dé de baja al empleado antes de eliminar']);
    const romero = await idOf('empleado', 'id_empleado', 'a.romero', 'alias');
    await ctx.db.query('UPDATE empleado SET activo = FALSE WHERE id_empleado = $1', [romero]);
    const open = await api('post', '/api/deletion/preview').send({empleados: [romero]});
    expect(open.body.bloqueos[0]).toMatch(/^Hay 2 pedidos abiertos que dependen de lo elegido/);
    const blocked = await api('post', '/api/deletion/execute').send({empleados: [romero], confirmacion: 'ELIMINAR'});
    expect(blocked.status).toBe(409);
    expect(await count('SELECT COUNT(*)::int AS total FROM empleado WHERE id_empleado = $1', [romero])).toBe(1);
  });

  it('borra un empleado de baja en cascada con sus ventas, después de escribir ELIMINAR', async () => {
    await start();
    const sale = await closedSaleBy('c.mendoza');
    const mendoza = await idOf('empleado', 'id_empleado', 'c.mendoza', 'alias');
    await ctx.db.query('UPDATE empleado SET activo = FALSE WHERE id_empleado = $1', [mendoza]);
    const preview = await api('post', '/api/deletion/preview').send({empleados: [mendoza]});
    expect(preview.body).toMatchObject({elegidos: {empleados: ['Carlos Mendoza']}, arrastra: {ventas: {total: 1}}, bloqueos: []});
    expect(preview.body.arrastra.ventas.ejemplos[0]).toMatchObject({id: sale, mesa: 'Mesa 1', total: 35});
    const unconfirmed = await api('post', '/api/deletion/execute').send({empleados: [mendoza], confirmacion: 'eliminar'});
    expect(unconfirmed.status).toBe(400);
    expect(unconfirmed.body).toMatchObject({message: 'Escriba ELIMINAR para confirmar', campo: 'confirmacion'});
    const res = await api('post', '/api/deletion/execute').send({empleados: [mendoza], confirmacion: 'ELIMINAR'});
    expect(res.status).toBe(200);
    expect(res.body.borrados).toMatchObject({empleados: 1, ventas: 1});
    expect(await count('SELECT COUNT(*)::int AS total FROM venta WHERE id_venta = $1', [sale])).toBe(0);
    expect(await count('SELECT COUNT(*)::int AS total FROM venta_detalle WHERE id_venta = $1', [sale])).toBe(0);
    expect(await count('SELECT COUNT(*)::int AS total FROM pago WHERE id_venta = $1', [sale])).toBe(0);
    expect(await count('SELECT COUNT(*)::int AS total FROM empleado WHERE id_empleado = $1', [mendoza])).toBe(0);
  });

  it('un cargo de baja arrastra a sus empleados y no se borra si alguno sigue activo', async () => {
    await start();
    const mesero = await idOf('cargo', 'id_cargo', 'Mesero');
    await ctx.db.query('UPDATE cargo SET activo = FALSE WHERE id_cargo = $1', [mesero]);
    const blocked = await api('post', '/api/deletion/preview').send({cargos: [mesero]});
    expect(blocked.body.bloqueos).toEqual(['Carlos Mendoza sigue activo en un cargo elegido: dé de baja al empleado o cámbielo de cargo']);
    await ctx.db.query('UPDATE empleado SET activo = FALSE WHERE id_cargo = $1', [mesero]);
    const preview = await api('post', '/api/deletion/preview').send({cargos: [mesero]});
    expect(preview.body.arrastra.empleados).toEqual(['Carlos Mendoza', 'Javier Ortiz']);
    const res = await api('post', '/api/deletion/execute').send({cargos: [mesero], confirmacion: 'ELIMINAR'});
    expect(res.body.borrados).toMatchObject({cargos: 1, empleados: 2});
    expect(await count("SELECT COUNT(*)::int AS total FROM cargo WHERE nombre = 'Mesero'")).toBe(0);
  });

  it('una sección de baja se borra con sus mesas; un producto de baja arrastra las promociones que lo incluyen', async () => {
    await start();
    const sections = (await api('get', '/api/deletion/candidates/secciones')).body.registros;
    expect(sections.length).toBeGreaterThan(0);
    const [section] = sections;
    const preview = await api('post', '/api/deletion/preview').send({secciones: [section.id]});
    expect(preview.body.arrastra.mesas).toHaveLength(section.mesas);
    const res = await api('post', '/api/deletion/execute').send({secciones: [section.id], confirmacion: 'ELIMINAR'});
    expect(res.body.borrados).toMatchObject({secciones: 1, mesas: section.mesas});
    expect(await count('SELECT COUNT(*)::int AS total FROM mesa WHERE id_seccion = $1', [section.id])).toBe(0);

    const clasica = await idOf('producto', 'id_producto', 'Doble Brava');
    await ctx.db.query('UPDATE producto SET activo = FALSE WHERE id_producto = $1', [clasica]);
    await ctx.db.query("UPDATE venta SET estado = 'cobrada', cerrada_en = $1", [NOW]);
    const product = await api('post', '/api/deletion/preview').send({productos: [clasica]});
    expect(product.body.arrastra.promociones).toContain('Combo Brava');
    expect(product.body.arrastra.ventas.total).toBeGreaterThan(0);
    const deleted = await api('post', '/api/deletion/execute').send({productos: [clasica], confirmacion: 'ELIMINAR'});
    expect(deleted.status).toBe(200);
    expect(await count("SELECT COUNT(*)::int AS total FROM promocion WHERE nombre = 'Combo Brava'")).toBe(0);
    expect(await count('SELECT COUNT(*)::int AS total FROM receta WHERE id_producto = $1', [clasica])).toBe(0);
  });

  it('borra ventas cobradas elegidas por fechas', async () => {
    await start();
    const sale = await closedSaleBy('a.romero');
    const list = await api('get', '/api/deletion/candidates/ventas?desde=2026-10-13&hasta=2026-10-13');
    expect(list.body.registros.map((row) => row.id)).toEqual([sale]);
    expect((await api('get', '/api/deletion/candidates/ventas?desde=2026-10-12&hasta=2026-10-12')).body.registros).toEqual([]);
    const res = await api('post', '/api/deletion/execute').send({ventas: [sale], confirmacion: 'ELIMINAR'});
    expect(res.body.borrados).toMatchObject({ventas: 1, empleados: 0});
    expect((await api('post', '/api/deletion/preview').send({})).body.message).toBe('Marque al menos un registro');
  });
});
