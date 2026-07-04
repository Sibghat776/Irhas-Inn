// ==========================================
// ⚠️ OLD whatsapp-web.js CODE (chromium-based)
// ==========================================
// import pkg from "whatsapp-web.js";
// import { MongoStore } from "wwebjs-mongo";
// 
// const { Client, RemoteAuth } = pkg;
// 
// let isClientReady = false;
// let client = null;
// 
// export const initWhatsAppClient = () => {
//   if (mongoose.connection.readyState !== 1) {
//     console.log("Waiting for MongoDB connection to initialize WhatsApp...");
//     setTimeout(initWhatsAppClient, 2000);
//     return;
//   }
// 
//   console.log("Initializing WhatsApp Client with MongoStore...");
//   const store = new MongoStore({ mongoose: mongoose });
// 
//   client = new Client({
//     authStrategy: new RemoteAuth({
//       store: store,
//       clientId: "zeef-trendy-store",
//       backupSyncIntervalMs: 300000,
//     }),
//     authTimeoutMs: 90000,
//     qrMaxRetries: 10,
//     webVersion: "2.3000.1042626022",
//     webVersionCache: { type: "local" },
//     puppeteer: {
//       headless: "new",
//       executablePath:
//         process.platform === "win32"
//           ? undefined
//           : process.env.PUPPETEER_EXECUTABLE_PATH ||
//             process.env.CHROME_BIN ||
//             "/usr/bin/chromium-browser",
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--no-first-run",
//         "--no-zygote",
//         "--disable-gpu",
//       ],
//     },
//   });
// 
//   client.on("loading_screen", (percent, message) =>
//     console.log(`⏳ Loading WhatsApp: ${percent}% - ${message}`),
//   );
//   client.on("authenticated", () =>
//     console.log("✅ Authenticated with WhatsApp successfully!"),
//   );
//   client.on("remote_session_saved", () =>
//     console.log("💾 WhatsApp Session successfully saved to MongoDB!"),
//   );
//   client.on("ready", () => {
//     isClientReady = true;
//     console.log("🚀 WhatsApp Client is fully ready!");
//   });
//   client.on("qr", (qr) => {
//     isClientReady = false;
//     console.log("⚠️ QR RECEIVED. Scan this or use this link:");
//     qrcode.generate(qr, { small: true });
//     console.log(
//       `Manual Scan Link: https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}`,
//     );
//   });
//   client.on("auth_failure", (msg) => {
//     console.error("❌ Auth Failed! Clearing session...", msg);
//     if (client) client.destroy().catch(() => {});
//     setTimeout(() => initWhatsAppClient(), 5000);
//   });
//   client.on("disconnected", (reason) => {
//     isClientReady = false;
//     console.log("❌ Disconnected. Reason:", reason);
//     setTimeout(() => initWhatsAppClient(), 5000);
//   });
// 
//   client.initialize().catch((err) => console.error("Init Error:", err));
// };
// 
// export const sendWhatsAppOTP = async (phoneNo, otp) => {
//   if (!isClientReady || !client) {
//     console.error("❌ WhatsApp Client is not ready.");
//     return false;
//   }
//   try {
//     let number = phoneNo.toString().replace(/\D/g, "");
//     if (number.length === 10) number = "92" + number;
//     else if (number.length === 11 && number.startsWith("0"))
//       number = "92" + number.substring(1);
// 
//     const chatId = `${number}@c.us`;
//     const isRegistered = await client.isRegisteredUser(chatId);
//     if (!isRegistered) {
//       console.error(`❌ Number ${number} is not registered on WhatsApp.`);
//       return false;
//     }
//     const messageText = `Dear Valued Customer,\n\nWelcome to ZF Store! 🛍️\n\nYour OTP Code: *${otp}*\n\nValid for 10 minutes.`;
//     await client.sendMessage(chatId, messageText);
//     console.log(`OTP sent successfully to ${number}`);
//     return true;
//   } catch (error) {
//     console.error("❌ WhatsApp Send Error:", error.message);
//     return false;
//   }
// };

// ==========================================
// 🚀 NEW Baileys Implementation (No Chromium)
// ==========================================
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import mongoose from "mongoose";
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import pino from "pino";

let isClientReady = false;
let sock = null;

const AUTH_FOLDER = join(tmpdir(), "baileys_auth_zeef");
const MONGO_COLLECTION = "baileys_sessions";

// ==========================================
// 💾 RESTORE AUTH FROM MONGO
// ==========================================
async function restoreFromMongo() {
  try {
    const collection = mongoose.connection.db.collection(MONGO_COLLECTION);
    const doc = await collection.findOne({ _id: "auth_backup" });
    if (!doc || !doc.files) return;

    if (!existsSync(AUTH_FOLDER)) mkdirSync(AUTH_FOLDER, { recursive: true });

    for (const [name, data] of Object.entries(doc.files)) {
      writeFileSync(join(AUTH_FOLDER, name), Buffer.from(data, "base64"));
    }
    console.log("💾 WhatsApp session restored from MongoDB");
  } catch (err) {
    console.log("No saved session found in MongoDB, will need QR scan");
  }
}

// ==========================================
// 💾 BACKUP AUTH TO MONGO
// ==========================================
async function backupToMongo() {
  try {
    if (!existsSync(AUTH_FOLDER)) return;
    const files = {};
    for (const f of readdirSync(AUTH_FOLDER)) {
      files[f] = readFileSync(join(AUTH_FOLDER, f)).toString("base64");
    }
    await mongoose.connection.db.collection(MONGO_COLLECTION).updateOne(
      { _id: "auth_backup" },
      { $set: { files, updatedAt: new Date() } },
      { upsert: true },
    );
  } catch (err) {
    console.error("Failed to backup session to MongoDB:", err.message);
  }
}

// ==========================================
// 🚀 INITIALIZE WHATSAPP CLIENT (Baileys)
// ==========================================
export const initWhatsAppClient = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log("Waiting for MongoDB connection to initialize WhatsApp...");
    setTimeout(initWhatsAppClient, 2000);
    return;
  }

  try {
    // Restore session from MongoDB first
    await restoreFromMongo();

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys v${version}, isLatest: ${isLatest}`);

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      browser: ["ZeeF Trendy Store", "Chrome", "1.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      logger: pino({ level: "silent" }),
    });

    sock.ev.on("creds.update", async () => {
      await saveCreds();
      await backupToMongo();
    });

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        isClientReady = false;
        console.log("⚠️ QR RECEIVED — Scan with WhatsApp");
        qrcode.generate(qr, { small: true });
        console.log(
          `Manual Scan: https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}`,
        );
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;
        console.log(
          `❌ Disconnected. Reason: ${reason}. Reconnect: ${shouldReconnect}`,
        );
        isClientReady = false;

        if (reason === 440) {
          console.log("Bad session — clearing stale session, need fresh QR");
          await mongoose.connection.db
            .collection(MONGO_COLLECTION)
            .deleteOne({ _id: "auth_backup" });
          if (existsSync(AUTH_FOLDER)) {
            rmSync(AUTH_FOLDER, { recursive: true, force: true });
          }
          setTimeout(() => initWhatsAppClient(), 3000);
        } else if (shouldReconnect) {
          setTimeout(() => initWhatsAppClient(), 5000);
        } else {
          console.log("Logged out — clearing session from MongoDB");
          await mongoose.connection.db
            .collection(MONGO_COLLECTION)
            .deleteOne({ _id: "auth_backup" });
        }
      }

      if (connection === "open") {
        isClientReady = true;
        console.log("🚀 WhatsApp Client is fully ready!");
        await backupToMongo();
      }
    });

    sock.ev.on("messages.upsert", () => {});
  } catch (err) {
    console.error("❌ WhatsApp Init Error:", err.message);
    setTimeout(() => initWhatsAppClient(), 10000);
  }
};

// ==========================================
// 📩 SEND OTP FUNCTION
// ==========================================
export const sendWhatsAppOTP = async (phoneNo, otp) => {
  if (!isClientReady || !sock) {
    console.error("❌ WhatsApp Client is not ready.");
    return false;
  }
  try {
    let number = phoneNo.toString().replace(/\D/g, "");
    if (number.length === 10) number = "92" + number;
    else if (number.length === 11 && number.startsWith("0"))
      number = "92" + number.substring(1);

    const chatId = `${number}@s.whatsapp.net`;

    const [presence] = await sock.onWhatsApp(chatId);
    if (!presence?.exists) {
      console.error(`❌ Number ${number} is not registered on WhatsApp.`);
      return false;
    }

    const messageText = `Dear Valued Customer,\n\nWelcome to ZF Store! 🛍️\n\nYour OTP Code: *${otp}*\n\nValid for 10 minutes.`;
    await sock.sendMessage(chatId, { text: messageText });

    console.log(`OTP sent successfully to ${number}`);
    return true;
  } catch (error) {
    console.error("❌ WhatsApp Send Error:", error.message);
    return false;
  }
};
