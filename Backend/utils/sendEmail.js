import { SMTPClient } from "emailjs";
import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

export const sendEmail = async (to, subject, text) => {
  const client = new SMTPClient({
    user: process.env.EMAIL,
    password: process.env.PASSWORD,
    host: "smtp.gmail.com",
    ssl: true,
    port: 465,
    timeout: 15000,
  });

  try {
    const message = await client.sendAsync({
      text,
      from: `Sibghat Ullah <${process.env.EMAIL}>`,
      to,
      subject,
    });
    console.log("Email sent: ", message.header["message-id"]);
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
