import nodemailer from 'nodemailer';

// Создаем транспортер для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.jino.ru",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER, // notifications@chesson.me
    pass: process.env.SMTP_PASS,
  },
  requireTLS: true,
});

/**
 * Отправляет email с подтверждением регистрации
 */
export async function sendVerificationEmail(
  email: string,
  login: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Chesson" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Подтверждение регистрации на Chesson',
    text: `
      Добро пожаловать на Chesson!
      
      Привет, ${login}!
      
      Спасибо за регистрацию на Chesson. Для завершения регистрации, пожалуйста, подтвердите ваш email адрес, перейдя по ссылке:
      
      ${verificationUrl}
      
      Если вы не регистрировались на Chesson, просто проигнорируйте это письмо.
      
      © ${new Date().getFullYear()} Chesson. Все права защищены.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Отправляет email с токеном для восстановления пароля
 */
export async function sendPasswordResetEmail(
  email: string,
  login: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Chesson" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Восстановление пароля на Chesson',
    text: `
      Восстановление пароля
      
      Привет, ${login}!
      
      Вы запросили восстановление пароля для вашего аккаунта на Chesson.
      
      Для сброса пароля перейдите по ссылке:
      
      ${resetUrl}
      
      Важно: Эта ссылка действительна в течение 1 часа. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
      
      © ${new Date().getFullYear()} Chesson. Все права защищены.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Отправляет тестовое сообщение на указанный email
 * и логирует ВСЮ важную информацию от SMTP
 */
export async function sendTestEmail(email: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  console.log("📨 sendTestEmail called");
  console.log("➡️ to:", email);
  console.log("➡️ from:", process.env.SMTP_USER);
  console.log("➡️ smtp host:", process.env.SMTP_HOST || "smtp.jino.ru");
  console.log("➡️ smtp port:", 587);
  console.log("➡️ smtp user present:", Boolean(process.env.SMTP_USER));
  console.log(
    "➡️ smtp pass length:",
    (process.env.SMTP_PASS || "").length
  );

  const mailOptions = {
    from: `"Chesson" <${process.env.SMTP_USER}>`,
    to: email,

    // 👇 ВАЖНО
    replyTo: "notifications@chesson.me",

    headers: {
      // Сигнал почтовикам, что это легитимные уведомления
      "List-Unsubscribe": "<mailto:notifications@chesson.me>",
      "X-Mailer": "Chesson Mailer",
    },

    subject: "У нас обновление! Заходите чтобы проверить",
    text: `
У нас обновление!

Отличной игры!

${frontendUrl}

© ${new Date().getFullYear()} Chesson
`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ SMTP sendMail resolved");
    console.log("📩 messageId:", info.messageId);
    console.log("📩 accepted:", info.accepted);
    console.log("📩 rejected:", info.rejected);
    console.log("📩 response:", info.response);
    console.log("📩 envelope:", info.envelope);

    if (!info.accepted || info.accepted.length === 0) {
      console.warn("⚠️ No accepted recipients — email may not be delivered");
    }

    console.log(`🎉 Test email processing finished for ${email}`);
  } catch (error) {
    console.error("❌ Error sending test email");

    if (error instanceof Error) {
      console.error("name:", error.name);
      console.error("message:", error.message);
      // @ts-ignore
      console.error("code:", (error as any).code);
      // @ts-ignore
      console.error("response:", (error as any).response);
      // @ts-ignore
      console.error("responseCode:", (error as any).responseCode);
      // @ts-ignore
      console.error("command:", (error as any).command);
    } else {
      console.error(error);
    }

    throw new Error("Failed to send test email");
  }
}



/**
 * Проверяет подключение к SMTP серверу
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP server connection verified');
    return true;
  } catch (error) {
    console.error('SMTP server connection failed:', error);
    return false;
  }
}
