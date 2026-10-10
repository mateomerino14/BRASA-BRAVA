import pg from 'pg';

// Devuelve BIGINT y NUMERIC como número en vez de string (ids y montos caben en Number)
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));
// Devuelve DATE como texto YYYY-MM-DD: una fecha de calendario no tiene zona horaria
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

const maxConnections = 10;

// Crea el pool de conexiones a PostgreSQL
export const createPool = (connectionString) => new pg.Pool({connectionString, max: maxConnections});

// Envuelve un pool en la interfaz mínima que usan los repositorios
export const createDb = (pool) => ({
  query: (text, params = []) => pool.query(text, params),
  transaction: async (work) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work({query: (text, params = []) => client.query(text, params)});
      await client.query('COMMIT');
      return result;
    }
    catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    finally {
      client.release();
    }
  },
  close: () => pool.end(),
});
