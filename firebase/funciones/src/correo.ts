/** Correo con el código de verificación, en texto plano y en HTML sencillo (compatible con los clientes de correo). */
export function cuerpoCorreo(codigo: string, minutos: number) {
  const texto = [
    'ICA Bienestar Animal',
    '',
    `Su código de verificación es: ${codigo}`,
    `Vence en ${minutos} minutos y sirve para un solo ingreso.`,
    '',
    'Si usted no intentó ingresar, ignore este mensaje y cambie su contraseña: alguien más la conoce.',
    'Nunca le pediremos este código por teléfono ni por mensaje.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f4f6f3;font-family:Arial,Helvetica,sans-serif;color:#1d2b22">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px">
      <tr><td style="padding:28px 28px 8px;font-size:15px;font-weight:bold;color:#1f6b45">ICA Bienestar Animal</td></tr>
      <tr><td style="padding:8px 28px;font-size:16px;line-height:1.5">Su código de verificación es:</td></tr>
      <tr><td style="padding:8px 28px 16px">
        <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:#1d2b22;background:#eef4ef;border-radius:8px;padding:14px 0;text-align:center">${codigo}</div>
      </td></tr>
      <tr><td style="padding:0 28px 8px;font-size:14px;line-height:1.5;color:#45574b">Vence en ${minutos} minutos y sirve para un solo ingreso.</td></tr>
      <tr><td style="padding:8px 28px 28px;font-size:13px;line-height:1.5;color:#45574b">
        Si usted no intentó ingresar, ignore este mensaje y cambie su contraseña: alguien más la conoce.
        Nunca le pediremos este código por teléfono ni por mensaje.
      </td></tr>
    </table>
  </body>
</html>`;
  return { texto, html };
}
