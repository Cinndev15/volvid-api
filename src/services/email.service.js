import nodemailer from 'nodemailer';
import config from '../config/config.js';

// Create Nodemailer transport
let transporter = null;

const getTransporter = () => {
  // If SMTP configuration is missing or incomplete, return null to activate fallback logging
  if (!config.email.host || !config.email.user || !config.email.pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // Hostinger SSL SMTP port 465
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }
  return transporter;
};

/**
 * Sends a welcome email to the newly registered veterinary clinic administrator.
 * 
 * @param {string} email Receiver's email
 * @param {string} adminName Name of the administrator
 * @param {string} clinicName Name of the clinic
 * @param {Date|string} trialEndDate Trial end date
 */
export const sendWelcomeEmail = async (email, adminName, clinicName, trialEndDate) => {
  const formattedDate = new Date(trialEndDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: '¡Te damos la bienvenida a Volvid Mascotas! - Inicio de Prueba de 14 Días',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
      color: #132c25;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(19, 44, 37, 0.03);
    }
    .header {
      background-color: #132c25;
      padding: 40px 20px;
      text-align: center;
      border-bottom: 4px solid #00d97e;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header h1 span {
      color: #00d97e;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 20px;
      color: #132c25;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      font-size: 16px;
      color: #475569;
      margin-bottom: 20px;
    }
    .trial-box {
      background-color: #f0fdf4;
      border-left: 4px solid #00d97e;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .trial-title {
      font-size: 14px;
      text-transform: uppercase;
      font-weight: 700;
      color: #047857;
      margin-bottom: 6px;
      letter-spacing: 0.05em;
    }
    .trial-date {
      font-size: 18px;
      font-weight: 700;
      color: #132c25;
    }
    .cta-container {
      text-align: center;
      margin: 35px 0 15px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #00d97e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(0, 217, 126, 0.25);
    }
    .footer {
      background-color: #f8fafc;
      padding: 25px 20px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>VÖLVÏD<span>MASCOTAS</span></h1>
    </div>
    
    <div class="content">
      <h2>¡Hola, Dr. ${adminName}!</h2>
      <p>Te damos una cálida bienvenida a Volvid Mascotas. Tu cuenta como administrador de la clínica <strong>${clinicName}</strong> ha sido creada exitosamente.</p>
      
      <p>Queremos recordarte que tu prueba gratuita de 14 días ha comenzado. Tendrás acceso sin restricciones a todas las funcionalidades del sistema para agilizar la gestión de tu veterinaria.</p>
      
      <div class="trial-box">
        <div class="trial-title">Tu prueba gratis finaliza el</div>
        <div class="trial-date">${formattedDate}</div>
      </div>
      
      <p>Puedes acceder a tu panel de administración en cualquier momento haciendo clic en el siguiente enlace:</p>
      
      <div class="cta-container">
        <a href="https://app.volvidmascotas.com/login" class="cta-button" target="_blank">Acceder a mi panel</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este correo electrónico fue enviado a ${email} como parte de su registro en Volvid.</p>
      <p>&copy; 2026 Volvid. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.log('========================================================================');
    console.log('⚠️ [MOCK EMAIL SERVICE] SMTP credentials not set. Logging email content:');
    console.log(`To: ${email}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Body excerpt: Hola Dr. ${adminName}, bienvenida a la clínica ${clinicName}. Tu prueba de 14 días vence el ${formattedDate}.`);
    console.log('========================================================================');
    return { success: true, mock: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email through SMTP:', error.message);
    throw error;
  }
};
