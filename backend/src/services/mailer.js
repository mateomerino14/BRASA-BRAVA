const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

// Mailer de desarrollo: guarda los correos en memoria y los muestra en consola
export const createConsoleMailer = (logger = console) => {
  const outbox = [];
  return {
    outbox,
    // Guarda el correo y lo muestra en consola
    send: async (message) => {
      outbox.push(message);
      logger.info?.(`[mail] Para: ${message.to} | ${message.subject} | ${message.preview ?? ''}`);
    },
  };
};

// Mailer de producción que envía mediante la API transaccional de Brevo
export const createBrevoMailer = ({apiKey, fromEmail, fromName}, fetchImpl = fetch) => ({
  // Envía el correo con la API de Brevo
  send: async ({to, toName, subject, html, attachments = []}) => {
    const payload = {
      sender: {email: fromEmail, name: fromName},
      to: [{email: to, name: toName}],
      subject,
      htmlContent: html,
    };
    // Adjuntos (por ejemplo el PDF de un reporte) en base64, como los pide Brevo
    if (attachments.length > 0) {
      payload.attachment = attachments.map((item) => ({name: item.name, content: item.content.toString('base64')}));
    }
    const response = await fetchImpl(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Brevo respondió ${response.status}`);
    }
  },
});

// Elige el mailer según la configuración (consola o Brevo)
export const createMailer = (config, logger = console) => {
  if (config.MAIL_DRIVER === 'brevo') {
    return createBrevoMailer({
      apiKey: config.BREVO_API_KEY,
      fromEmail: config.MAIL_FROM_EMAIL,
      fromName: config.MAIL_FROM_NAME,
    });
  }
  return createConsoleMailer(logger);
};
