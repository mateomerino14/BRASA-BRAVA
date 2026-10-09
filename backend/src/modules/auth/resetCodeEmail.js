// Escapa caracteres HTML para insertar texto de forma segura en el correo
const escapeHtml = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char],
  );

// Arma el HTML del correo con el código de verificación, con la paleta de la marca
export const resetCodeEmail = ({name, code, minutes}) => `
<div style="font-family:Inter,Arial,sans-serif;background:#FAF3EA;padding:32px">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #E0D7CD">
    <h1 style="margin:0 0 8px;color:#1C1A18;font-size:22px">Verificación de identidad</h1>
    <p style="color:#544435">Hola ${escapeHtml(name)}, use este código para recuperar su contraseña:</p>
    <p style="font-size:36px;letter-spacing:10px;font-weight:700;color:#F7941D;text-align:center;margin:24px 0">${escapeHtml(code)}</p>
    <p style="color:#544435;font-size:13px">Vence en ${Number(minutes)} minutos. Si no lo solicitó, ignore este correo.</p>
  </div>
</div>`;
