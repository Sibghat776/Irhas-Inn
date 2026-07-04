import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import mongoose from "mongoose";
import { MongoStore } from "wwebjs-mongo";

const { Client, RemoteAuth } = pkg;

let isClientReady = false;
let client = null;

// ==========================================
// 🚀 INITIALIZE WHATSAPP WITH MONGOSTORE
// ==========================================
export const initWhatsAppClient = () => {
  if (mongoose.connection.readyState !== 1) {
    console.log("Waiting for MongoDB connection to initialize WhatsApp...");
    setTimeout(initWhatsAppClient, 2000);
    return;
  }

  console.log("Initializing WhatsApp Client with MongoStore...");
  const store = new MongoStore({ mongoose: mongoose });

  client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      clientId: "zeef-trendy-store", // Fixed ID taake session reload ho sake
      backupSyncIntervalMs: 300000,
    }),
    authTimeoutMs: 90000,
    qrMaxRetries: 10,
    // Web version ko latest rakhna zaroori hai
    webVersionOverride: "2.3000.1017320448-alpha",
    puppeteer: {
      headless: "new",
      executablePath:
        process.platform === "win32"
          ? undefined
          : process.env.PUPPETEER_EXECUTABLE_PATH ||
            process.env.CHROME_BIN ||
            "/usr/bin/chromium-browser",

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });

  // Events
  client.on("loading_screen", (percent, message) =>
    console.log(`⏳ Loading WhatsApp: ${percent}% - ${message}`),
  );

  client.on("authenticated", () =>
    console.log("✅ Authenticated with WhatsApp successfully!"),
  );

  client.on("remote_session_saved", () =>
    console.log("💾 WhatsApp Session successfully saved to MongoDB!"),
  );

  client.on("ready", () => {
    isClientReady = true;
    console.log("🚀 WhatsApp Client is fully ready!");
  });

  client.on("qr", (qr) => {
    isClientReady = false;
    console.log("⚠️ QR RECEIVED. Scan this or use this link:");
    qrcode.generate(qr, { small: true });
    console.log(
      `Manual Scan Link: https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}`,
    );
  });
  
  client.on("auth_failure", (msg) => {
    console.error("❌ Auth Failed! Clearing session...", msg);
    if (client) {
      client.destroy().catch(() => {});
    }
    setTimeout(() => initWhatsAppClient(), 5000);
  });

  client.on("disconnected", (reason) => {
    isClientReady = false;
    console.log("❌ Disconnected. Reason:", reason);
    // Restarting logic if disconnected
    setTimeout(() => client.initialize(), 5000);
  });

  client.initialize().catch((err) => console.error("Init Error:", err));
};
// ==========================================
// 📩 SEND OTP FUNCTION
// ==========================================
export const sendWhatsAppOTP = async (phoneNo, otp) => {
  if (!isClientReady || !client) {
    console.error("❌ WhatsApp Client is not ready.");
    return false;
  }
  try {
    let number = phoneNo.toString().replace(/\D/g, "");
    if (number.length === 10) number = "92" + number;
    else if (number.length === 11 && number.startsWith("0"))
      number = "92" + number.substring(1);

    const chatId = `${number}@c.us`;

    // 1. Number check karein
    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      console.error(`❌ Number ${number} is not registered on WhatsApp.`);
      return false;
    }

    // 2. Message bhejein
    const messageText = `Dear Valued Customer,\n\nWelcome to ZF Store! 🛍️\n\nYour OTP Code: *${otp}*\n\nValid for 10 minutes.`;
    await client.sendMessage(chatId, messageText);

    console.log(`OTP sent successfully to ${number}`);
    return true;
  } catch (error) {
    console.error("❌ WhatsApp Send Error:", error.message);
    return false;
  }
};
