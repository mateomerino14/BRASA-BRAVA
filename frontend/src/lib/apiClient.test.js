import {describe, expect, it, vi} from 'vitest';
import {ApiError, apiRequest, setUnauthorizedHandler, tokenStorage} from './apiClient';

describe('apiRequest', () => {
  it('envía JSON con el token y devuelve los datos', async () => {
    tokenStorage.set('abc');
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ok: true, status: 200, json: async () => ({ok: 1})});
    vi.stubGlobal('fetch', fetchMock);
    const data = await apiRequest('/auth/me');
    expect(data).toEqual({ok: 1});
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe('Bearer abc');
  });

  it('convierte errores HTTP en ApiError con el mensaje del servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({message: 'Datos inválidos'}),
      }),
    );
    await expect(apiRequest('/x', {method: 'POST', body: {}})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Datos inválidos',
    });
  });

  it('avisa sesión vencida en un 401 autenticado', async () => {
    tokenStorage.set('vencido');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ok: false, status: 401, json: async () => ({})}),
    );
    await expect(apiRequest('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('informa cuando el servidor no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fail')));
    await expect(apiRequest('/x')).rejects.toMatchObject({
      status: 0,
      message: 'No se pudo conectar con el servidor',
    });
  });
});
