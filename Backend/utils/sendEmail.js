import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const password = process.env.PASSWORD.replace(/\s/g, "");
    
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

export const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `ZeeF Trendy Store <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
    return true;
  } catch (err) {
    console.error("Error sending email: ", err.message || err);
    throw err;
  }
};

export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
};