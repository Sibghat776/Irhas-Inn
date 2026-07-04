import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();

// 🔧 FIX: Railway/Docker containers often can't reach Google's SMTP servers
// over IPv6 (ENETUNREACH). This forces Node's DNS resolver to prefer IPv4
// addresses FIRST for ALL outbound connections in this process — this is
// the setting that actually stops the IPv6 address from being picked,
// unlike passing `family: 4` to nodemailer alone.
dns.setDefaultResultOrder("ipv4first");

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for port 465
      family: 4, // extra safety net, forces IPv4 at the socket level too
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