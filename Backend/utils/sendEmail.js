import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      family: 4,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Sibghat Ullah" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
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
