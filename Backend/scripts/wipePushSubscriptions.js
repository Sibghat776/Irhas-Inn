// One-time script: wipes ALL stale PushSubscription documents.
// These were signed with the old mismatched VAPID key and can never work again.
// After running, revisit the site on each device to create fresh subscriptions.
//
// Usage:  cd Backend && node scripts/wipePushSubscriptions.js
// This is a DESTRUCTIVE one-time operation — remove or avoid re-running in production.

import dotenv from "dotenv";
import mongoose from "mongoose";
import { PushSubscription } from "../Models/PushSubscription.js";

dotenv.config();

const MONGO = process.env.MONGO;
if (!MONGO) {
  console.error("❌ MONGO URI not found in .env");
  process.exit(1);
}

const main = async () => {
  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected to DB");

  const before = await PushSubscription.find(
    {},
    { endpoint: 1, userId: 1, createdAt: 1 }
  ).lean();

  console.log(`\n📊 Current PushSubscription count: ${before.length}`);

  const withUser = before.filter((s) => s.userId).length;
  const guests = before.length - withUser;
  console.log(`   - Linked to a user: ${withUser}`);
  console.log(`   - Guest (no userId): ${guests}`);

  if (before.length > 0) {
    const sample = before.slice(0, 5);
    console.log("\n   Sample endpoints:");
    for (const s of sample) {
      console.log(
        `   • ${s.endpoint}  (userId: ${s.userId ?? "guest"}, created: ${s.createdAt ?? "n/a"})`
      );
    }
    if (before.length > 5) console.log(`   • ...and ${before.length - 5} more`);
  }

  console.log("\n⚠️  Deleting ALL push subscriptions...");
  const result = await PushSubscription.deleteMany({});
  console.log(`🗑️  Deleted ${result.deletedCount} document(s)`);

  const after = await PushSubscription.countDocuments();
  console.log(`✅ Remaining PushSubscription count: ${after}`);

  if (after === 0) {
    console.log("\n✅ Collection is now EMPTY. Stale subscriptions wiped successfully.");
    console.log("➡️  Revisit the site on each device/browser to re-subscribe with the correct VAPID key.");
  } else {
    console.warn(`⚠️  Collection still has ${after} document(s) — deletion may have failed.`);
  }

  await mongoose.disconnect();
  console.log("👋 Disconnected. Script complete.");
  process.exit(0);
};

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
