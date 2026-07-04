import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from:  `Sibghat Ullah ${process.env.EMAIL}`, // temporary sender until you verify your own domain
      to,
      subject,
      text,
    });

    if (error) {
      console.error("Error sending email: ", error);
      throw new Error(error.message || "Email send failed");
    }

    console.log("Email sent: ", data.id);
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
