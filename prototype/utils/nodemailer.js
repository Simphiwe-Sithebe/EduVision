const nodemailer = require("nodemailer");
const emailTemplateRegistration = require("./emailTemplate");

async function sendMessage(
  first_name,
  last_name,
  identification_number,
  email,
  user_role,
  subject
) {
  try {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.APP_USER, // email
        pass: process.env.APP_PASSWORD, // app password
      },
    });

    // Send user's message
    let info = await transporter.sendMail({
      sender: `${email}`,
      from: `${email}`, // sender address
      to: process.env.APP_USER,
      replyTo: `${email}`,
      subject: `${subject}`, // Subject line
    });

    // Generate and send confirmation email with student number

    info = await transporter.sendMail({
      sender: process.env.APP_USER,
      from: process.env.APP_USER, // sender address
      to: `${email}`,
      replyTo: process.env.APP_USER,
      subject: `${subject}`, // Subject line
      html: `${emailTemplateRegistration(
        first_name,
        last_name,
        identification_number,
        user_role
      )}`, // html body
    });

    return true; // Return true if email was sent successfully
  } catch (error) {
    console.error("Error sending email:", error);
    return false; // Return false if an error occurred while sending email
  }
}

module.exports = { sendMessage };
