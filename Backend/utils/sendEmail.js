import { SMTPClient } from "emailjs";
import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

// Client ko bar bar create karne ki bajaye ek hi baar banayein (connection reuse)
const client = new SMTPClient({
  user: process.env.EMAIL,
  password: process.env.PASSWORD,
  host: "smtp.gmail.com",
  ssl: true,
  port: 465,
  timeout: 15000,
});

/**
 * sendEmail - ab HTML support ke sath multipart (text + html) email bhejta hai
 * @param {string} to
 * @param {string} subject
 * @param {string} text - plain text fallback (hamesha zaroori hai)
 * @param {string} [html] - optional HTML version
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const message = await client.sendAsync({
      text,
      from: `ZeeF Trendy Store <${process.env.EMAIL}>`,
      to,
      subject,
      "reply-to": process.env.EMAIL,
      // Agar html diya gaya hai to proper multipart/alternative bana ke bhejo
      attachment: html
        ? [
            { data: text, alternative: false },
            { data: html, alternative: true },
          ]
        : undefined,
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
