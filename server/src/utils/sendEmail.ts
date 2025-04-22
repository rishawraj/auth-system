import nodemailer from "nodemailer";
import "dotenv/config";

export async function sendEmail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  // setup email data
  const mailOptions = {
    from: '"Rishaw Raj" <rishawraj0703@gmail.com>',
    to: "blueboss2280@gmail.com",
    subject: "Hello",
    text: "plaintext",
    html: "<b>this is an html message</b>",
  };

  // send mail
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent" + info.response);
  } catch (error) {
    console.error("Error sending mail", error);
  }
}

// sendEmail();
