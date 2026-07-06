import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, text, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "ZeeF Trendy Store <onboarding@resend.dev>", // apna verified domain aane ke baad change karein
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Error sending email: ", error);
      throw error;
    }

    console.log("Email sent successfully to:", to, "| ID:", data?.id);
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
