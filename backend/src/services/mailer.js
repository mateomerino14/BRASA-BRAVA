const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

// Mailer de desarrollo: guarda los correos en memoria y los muestra en consola
export const createConsoleMailer = (logger = console) => {
  const outbox = [];
  return {
    outbox,
    send: async (message) => {
      outbox.push(message);
      logger.info?.(`[mail] Para: ${message.to} | ${message.subject} | ${message.preview ?? ''}`);
    },
  };
};

// Mailer de producción que envía mediante la API transaccional de Brevo
export const createBrevoMailer = ({apiKey, fromEmail, fromName}, fetchImpl = fetch) => ({
  send: async ({to, toName, subject, html}) => {
    const response = await fetchImpl(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {email: fromEmail, name: fromName},
        to: [{email: to, name: toName}],
        subject,
        htmlContent: html,
      }),
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
