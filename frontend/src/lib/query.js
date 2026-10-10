// Arma un query string omitiendo valores vacíos
export const toQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });
  return query.toString();
};
