Add a "Share on WhatsApp" feature to the Admin Products page, available to both 
Super Admin and Reseller Admin, for sharing product details to any WhatsApp contact.

===========================================================
GOAL
===========================================================
On the Admin Products page (Frontend/src/app/Admin/Products/page.tsx), add a WhatsApp 
share icon/button on each product row/card (both in the table view and the create/
edit modal if there's a product preview there). Clicking it should:
1. Build a nicely formatted text message containing the product's key details.
2. Open WhatsApp (mobile app if on phone, WhatsApp Web if on desktop) with that 
   message pre-filled, ready for the admin/reseller to choose ANY contact to send it 
   to (not a fixed number — this is a general share action, like sharing to any 
   contact or group, similar to how social share buttons work on other e-commerce 
   sites).

===========================================================
IMPLEMENTATION
===========================================================

1. Create a small reusable helper function (e.g., in 
   Frontend/src/app/utils/commonFunctions.ts, or a new small utils file), something 
   like buildWhatsAppShareUrl(product), that:
   - Takes a product object as input.
   - Builds a formatted, readable text message including:
     * Product name (as a bold-style heading using WhatsApp's *text* bold syntax, 
       e.g. `*${product.name}*`)
     * A short excerpt of the description (first ~100-150 characters, with "..." if 
       truncated — don't dump the entire long description into the share text, keep 
       it scannable)
     * Price (formatted clearly, e.g. "💰 Price: Rs [price]")
     * Brand (e.g. "🏷️ Brand: [brand]")
     * Available colors/sizes if present (e.g. "🎨 Colors: Red, White" / "📏 Sizes: S, M, L")
     * A direct link to the product's public page on the store, using the same 
       FRONTEND_URL + /product/[id] pattern already used elsewhere in this project 
       (check Backend/utils/socialMedia.js's postToFacebook function for the exact 
       existing pattern used to build product links, and mirror it for consistency)
     * A short call-to-action line, e.g. "👉 Check it out and order now!"
   - URL-encodes this entire message properly (WhatsApp share URLs require 
     encodeURIComponent on the message text).
   - Returns a WhatsApp share URL in the format: 
     https://wa.me/?text=${encodedMessage}
     (Note: using wa.me/?text= with NO phone number means WhatsApp opens the contact 
     picker, letting the user choose who to send it to — this is exactly the 
     "share anywhere" behavior needed, not sending to one fixed number.)

2. In the Admin Products page:
   - Add a WhatsApp icon button (use the existing lucide-react icon library already 
     used throughout the admin — check for a MessageCircle or similar icon already 
     used elsewhere in this project like the WhatsApp API key field mentioned in 
     Settings page, and reuse that same icon for visual consistency) next to the 
     existing Edit/Delete action buttons on each product row.
   - Style it consistently with the existing action button styling (same size, 
     rounded style, hover effects as the Edit/Delete buttons already there).
   - On click, call buildWhatsAppShareUrl(product) and open the resulting URL in a 
     new tab: window.open(shareUrl, "_blank").
   - Add a tooltip/aria-label like "Share on WhatsApp" for accessibility.

3. Ensure this works correctly for BOTH Super Admin viewing all products AND Reseller 
   Admin viewing their own scoped products — since both use the same Products page 
   component with role-based data scoping already built, this share button should 
   just work automatically for whichever products are visible to each role, no 
   additional role-checking needed for the button itself.

4. Test the message format renders correctly when actually opened in WhatsApp — 
   confirm bold text (*text*) works, emojis display correctly, and the link is 
   clickable/valid.

===========================================================
EXAMPLE OUTPUT MESSAGE FORMAT
===========================================================
The shared WhatsApp message should look roughly like:

*Leather Jacket*

This leather jacket is an absolute game-changer 🔥 It's got that vintage vibe...

💰 Price: Rs 4,500
🏷️ Brand: ZeeF Collection
🎨 Colors: Red, White
📏 Sizes: S, M, L

👉 Check it out and order now: https://zeeftrendystore.vercel.app/product/[productId]

===========================================================
CONSTRAINTS:
===========================================================
- Do NOT touch login, JWT, payment, WhatsApp OTP (Baileys) integration, or email 
  logic — this is a completely separate, simple client-side share feature using 
  WhatsApp's public wa.me share URL scheme, no backend/API involvement needed at all.
- Do NOT require any new environment variables, API keys, or backend changes for 
  this — it's purely a frontend link-building + window.open() feature.
- Do NOT break the existing Edit/Delete/other action buttons already on the product 
  rows — just add this as an additional button alongside them.
- After implementing, run a TypeScript check on touched files.

===========================================================
TEST:
===========================================================
1. As Super Admin, go to Admin Products, click the WhatsApp share icon on any 
   product, confirm WhatsApp (or WhatsApp Web) opens with a properly formatted 
   message ready to send to any contact.
2. As a Reseller Admin, go to their scoped Admin Products page, confirm the same 
   WhatsApp share button works correctly for their own products.
3. Confirm the shared message includes name, price, brand, colors/sizes (if present), 
   a short description excerpt, and a working product link.
4. Confirm this works both on desktop (opens WhatsApp Web) and mobile (opens the 
   WhatsApp app directly) — wa.me links handle this automatically, but confirm no 
   extra code broke that behavior.

Give me a summary of files changed after completion.