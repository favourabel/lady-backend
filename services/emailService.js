// ============================================
// services/emailService.js
// Nodemailer email service (optional - can be disabled)
// ============================================
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ============================================
// Check if email is configured
// ============================================
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

// ============================================
// Create reusable transporter
// ============================================
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

// ============================================
// Base email HTML template
// ============================================
const baseTemplate = (content, title = 'My-Lady') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #FFF5F7; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #EC4899, #1E3A8A); padding: 40px; text-align: center; color: white; }
    .body { padding: 40px 30px; color: #374151; line-height: 1.7; }
    .btn { display: inline-block; background: linear-gradient(135deg, #EC4899, #1E3A8A); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; margin: 20px 0; }
    .footer { background: #F9FAFB; padding: 24px; text-align: center; font-size: 12px; color: #9CA3AF; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌸 My-Lady</h1>
      <p>Track. Care. Thrive.</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} My-Lady. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// Core send function
// ============================================
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    logger.warn('Email not configured — skipping send');
    return { success: false, reason: 'Email not configured' };
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'My-Lady <noreply@my-lady.app>',
    to,
    subject,
    html,
    text: text || 'Please view this email in an HTML-capable email client.',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ============================================
// Template: Welcome email
// ============================================
const sendWelcomeEmail = async (user) => {
  const content = `
    <h2>Welcome to My-Lady, ${user.firstName}! 🌸</h2>
    <p>We're so happy you're here. My-Lady is your personal menstrual health companion.</p>
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard</a>
    </div>
    <p>With love,<br>The My-Lady Team 💕</p>
  `;
  return sendEmail({
    to: user.email,
    subject: '🌸 Welcome to My-Lady!',
    html: baseTemplate(content),
  });
};

// ============================================
// Template: Period reminder
// ============================================
const sendPeriodReminderEmail = async (user, daysUntil, nextPeriodDate) => {
  const content = `
    <h2>Period Reminder 🌸</h2>
    <p>Hi ${user.firstName},</p>
    <p>Your period is expected in <strong>${daysUntil} day(s)</strong>.</p>
    <p>Expected date: ${new Date(nextPeriodDate).toLocaleDateString()}</p>
  `;
  return sendEmail({
    to: user.email,
    subject: `🌸 Period in ${daysUntil} day(s)`,
    html: baseTemplate(content),
  });
};

// ============================================
// Template: Ovulation reminder
// ============================================
const sendOvulationReminderEmail = async (user, ovulationDate) => {
  const content = `
    <h2>Ovulation Reminder 🥚</h2>
    <p>Hi ${user.firstName},</p>
    <p>Your ovulation is predicted for <strong>${new Date(ovulationDate).toLocaleDateString()}</strong>.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: '🥚 Ovulation Reminder',
    html: baseTemplate(content),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPeriodReminderEmail,
  sendOvulationReminderEmail,
  isEmailConfigured,
};