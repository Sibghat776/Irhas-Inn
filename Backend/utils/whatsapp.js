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
let isConnecting = false; // singleton guard

// Reconnect state
let retryCount = 0;
let conflictCount = 0;
let conflictWindowStart = 0;
let stableTimer = null;

const AUTH_FOLDER = join(tmpdir(), "baileys_auth_zeef");
const MONGO_COLLECTION = "baileys_sessions";

try {
  if (!existsSync(AUTH_FOLDER)) mkdirSync(AUTH_FOLDER, { recursive: true });
} catch (err) {
  console.warn("[WhatsApp] Could not create auth folder:", err.message);
}

// Human-readable disconnect reasons
const DISCONNECT_REASONS = {
  401: "Logged Out",
  408: "Connection Timeout",
  411: "Multi-Device Mismatch",
  428: "Connection Closed",
  440: "Stream Conflict (another session active for this account)",
  500: "Internal Server Error",
};

function getBackoffDelay(retry) {
  if (retry <= 1) return 5000;
  if (retry === 2) return 15000;
  if (retry === 3) return 30000;
  return 60000;
}

// ==========================================
// 💾 CLEAR AUTH BACKUP
// ==========================================
async function clearAuthBackup() {
  try {
    await mongoose.connection.db
      .collection(MONGO_COLLECTION)
      .deleteOne({ _id: "auth_backup" });
  } catch (err) {
    console.error("Failed to delete stale WhatsApp auth backup from MongoDB:", err.message);
  }
  if (existsSync(AUTH_FOLDER)) {
    try {
      rmSync(AUTH_FOLDER, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch (err) {
      console.warn("[WhatsApp] Could not fully clear auth folder (file lock?), continuing anyway:", err.message);
    }
  }
}

async function restoreFromMongo() {
  try {
    const collection = mongoose.connection.db.collection(MONGO_COLLECTION);
    const doc = await collection.findOne({ _id: "auth_backup" });
    if (!doc || !doc.files) return;
    if (!existsSync(AUTH_FOLDER)) mkdirSync(AUTH_FOLDER, { recursive: true });
    for (const [name, data] of Object.entries(doc.files)) {
      try {
        writeFileSync(join(AUTH_FOLDER, name), Buffer.from(data, "base64"));
      } catch (err) {
        console.error("Invalid WhatsApp auth backup file:", name, err.message);
        await clearAuthBackup();
        return;
      }
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
  // Singleton guard — never create two sockets at once
  if (isConnecting) {
    console.log("[WhatsApp] Connection already in progress, skipping duplicate init.");
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    console.log("Waiting for MongoDB connection to initialize WhatsApp...");
    setTimeout(initWhatsAppClient, 2000);
    return;
  }

  isConnecting = true;

  // Close existing socket cleanly before creating a new one
  if (sock) {
    try { sock.end(undefined); } catch (_) {}
    sock = null;
  }

  try {
    // Restore session from MongoDB ONCE per init attempt
    await restoreFromMongo();

    let state, saveCreds;
    try {
      ({ state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER));
    } catch (authErr) {
      console.warn("[WhatsApp] Auth state init failed, skipping:", authErr.message);
      isConnecting = false;
      return;
    }

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[WhatsApp] Using Baileys v${version}, isLatest: ${isLatest}`);

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      browser: ["ZeeF Trendy Store", "Chrome", "1.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      logger: pino({ level: "silent" }),
    });

    isConnecting = false; // socket created, no longer "connecting"

    sock.ev.on("creds.update", async () => {
      await saveCreds();
      await backupToMongo();
    });

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        isClientReady = false;
        console.log("⚠️ QR RECEIVED — Scan with WhatsApp");
        qrcode.generate(qr, { small: true });
        console.log(`Manual Scan: https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}`);
      }

      if (connection === "open") {
        isClientReady = true;
        retryCount = 0;
        conflictCount = 0;
        console.log("🚀 WhatsApp Client is fully ready!");
        await backupToMongo();

        // Reset retry counter after 60s of stable connection
        if (stableTimer) clearTimeout(stableTimer);
        stableTimer = setTimeout(() => { retryCount = 0; conflictCount = 0; }, 60000);
      }

      if (connection === "close") {
        isClientReady = false;
        if (stableTimer) { clearTimeout(stableTimer); stableTimer = null; }

        const reason =
          lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.output?.payload?.statusCode ||
          lastDisconnect?.reason ||
          lastDisconnect?.error?.message;

        const reasonLabel = DISCONNECT_REASONS[reason] || `Unknown (${reason})`;
        retryCount++;
        const delay = getBackoffDelay(retryCount);

        console.log(`❌ [WhatsApp] Disconnected. Reason: ${reason} — ${reasonLabel}`);
        console.log(`   Retry #${retryCount}, next attempt in ${delay / 1000}s`);

        if (reason === 440) {
          // Track conflict frequency
          const now = Date.now();
          if (now - conflictWindowStart > 120000) {
            // Reset window if last conflict was >2 min ago
            conflictCount = 1;
            conflictWindowStart = now;
          } else {
            conflictCount++;
          }

          if (conflictCount >= 3) {
            console.log(`[WhatsApp] ${conflictCount} conflicts in 2 min — clearing stale session, need fresh QR`);
            conflictCount = 0;
            await clearAuthBackup();
          } else {
            console.log(`[WhatsApp] Conflict #${conflictCount}/3 — waiting ${delay / 1000}s before retry (no session clear yet)`);
          }
          setTimeout(initWhatsAppClient, delay);
        } else if (reason === DisconnectReason.loggedOut) {
          console.log("[WhatsApp] Logged out — clearing session from MongoDB");
          await clearAuthBackup();
          // Don't auto-reconnect on logout — needs manual QR scan
        } else {
          setTimeout(initWhatsAppClient, delay);
        }
      }
    });

    sock.ev.on("messages.upsert", () => {});
  } catch (err) {
    isConnecting = false;
    console.error("❌ [WhatsApp] Init Error:", err.message);
    const delay = getBackoffDelay(++retryCount);
    console.log(`   Retry #${retryCount} in ${delay / 1000}s`);
    setTimeout(initWhatsAppClient, delay);
  }
};

// Clean shutdown — release socket so no zombie connection causes 440 on next start
const shutdown = () => {
  if (sock) {
    try { sock.end(undefined); } catch (_) {}
    sock = null;
  }
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

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
