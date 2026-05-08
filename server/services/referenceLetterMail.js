const nodemailer = require("nodemailer");
const { ADMIN_EMAIL } = require("../config/constants");

async function sendReferenceLetterAdminNotification({ employeeName, employeeId, purpose, addressedTo, details, createdAt }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.MAIL_FROM || smtpUser || "no-reply@basirah.local";
  const toEmail = process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(
      `[ReferenceLetter][EmailSkipped] Configure SMTP_* env vars to enable email notifications. Request by ${employeeName} (${employeeId}) for ${purpose}.`
    );
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transport.sendMail({
    from: fromEmail,
    to: toEmail,
    subject: `New Reference Letter Request - ${employeeName} (${employeeId})`,
    text: [
      "A new reference letter request was submitted.",
      `Employee: ${employeeName} (${employeeId})`,
      `Purpose: ${purpose}`,
      `Addressed To: ${addressedTo || "-"}`,
      `Details: ${details || "-"}`,
      `Submitted At: ${createdAt}`,
    ].join("\n"),
  });
}

module.exports = { sendReferenceLetterAdminNotification };
