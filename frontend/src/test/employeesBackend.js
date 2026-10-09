export const ROLES = [
  {id: 1, nombre: 'Administrador'},
  {id: 2, nombre: 'Cajero'},
  {id: 4, nombre: 'Mesero'},
];

export const EMPLOYEES = [
  {id: 2, nombre: 'Andrea', apellido: 'Romero', ci: '6812903 LP', alias: 'a.romero', correo: 'a.romero@brasabrava.bo', telefono: '76543210', fotoUrl: null, activo: true, cargo: {id: 2, nombre: 'Cajero'}},
  {id: 1, nombre: 'Carlos', apellido: 'Mendoza', ci: '4920114 LP', alias: 'c.mendoza', correo: 'c.mendoza@brasabrava.bo', telefono: null, fotoUrl: null, activo: true, cargo: {id: 4, nombre: 'Mesero'}},
  {id: 5, nombre: 'Javier', apellido: 'Ortiz', ci: '5912440 LP', alias: 'j.ortiz', correo: 'j.ortiz@brasabrava.bo', telefono: '78901234', fotoUrl: null, activo: false, cargo: {id: 4, nombre: 'Mesero'}},
];

// Backend falso en memoria para las pruebas de la pantalla de empleados
export const createEmployeesBackend = () => {
  const store = EMPLOYEES.map((employee) => ({...employee}));
  const calls = [];
  const matches = (employee, query) => {
    const text = `${employee.nombre} ${employee.apellido} ${employee.alias} ${employee.ci}`.toLowerCase();
    if (query.search && !text.includes(query.search.toLowerCase())) {
      return false;
    }
    if (query.idCargo && employee.cargo.id !== Number(query.idCargo)) {
      return false;
    }
    if (query.estado === 'activos' && !employee.activo) {
      return false;
    }
    if (query.estado === 'inactivos' && employee.activo) {
      return false;
    }
    return true;
  };
  return {
    store,
    calls,
    handlers: {
      'GET /roles': () => [200, {roles: ROLES}],
      'GET /employees': (_body, query) => {
        calls.push(query);
        const items = store.filter((employee) => matches(employee, query));
        return [200, {items, total: items.length, page: Number(query.page), pageSize: Number(query.pageSize)}];
      },
      'POST /employees': (body) => {
        if (store.some((employee) => employee.alias === body.alias)) {
          return [409, {message: 'Ese nombre de usuario ya está en uso'}];
        }
        const employee = {...body, id: 99, fotoUrl: null, activo: true, cargo: ROLES.find((role) => role.id === body.idCargo)};
        store.push(employee);
        return [201, {employee}];
      },
      'PUT /employees/1': (body) => {
        const employee = Object.assign(store.find((item) => item.id === 1), body, {cargo: ROLES.find((role) => role.id === body.idCargo)});
        return [200, {employee}];
      },
      'PATCH /employees/2/status': (body) => {
        const employee = store.find((item) => item.id === 2);
        employee.activo = body.activo;
        return [200, {employee}];
      },
    },
  };
};
