Task 1 is done. Now proceed with Task 2, Task 3, and Task 4 in order, giving me a 
checkpoint summary after each before moving to the next.

===========================================================
TASK 2: Fix Product Update Error
===========================================================
Here is the EXACT error from a real reproduction attempt:

"Cannot destructure property 'name' of 'req.body' as it is undefined"

This confirms req.body is completely undefined when the update request reaches the 
controller. This is almost always caused by a missing or misconfigured body-parsing 
middleware on that specific route — most likely because the product update form 
submits as multipart/form-data (since it includes image uploads), and Express's 
built-in express.json() does NOT parse multipart form data — it needs multer (or 
similar) to parse both the files AND the text fields into req.body.

1. Open Backend/Routes/productRoute.js (or wherever the update product route is 
   defined) and check the exact middleware chain for the update route (likely PUT or 
   PATCH /api/v1/product/updateProduct/:id or similar).
2. Compare it against the CREATE product route's middleware chain — the create route 
   presumably works fine (since new products can be added), so check what middleware 
   (multer upload, etc.) is applied there that might be MISSING from the update route.
3. Fix the update route to use the same multer/upload middleware as the create route, 
   so req.body and req.files are both correctly populated before reaching the 
   updateProduct controller function.
4. Also check Backend/Controllers/productController.js's updateProduct function 
   itself — confirm the destructuring line matches what multer actually provides 
   (text fields go to req.body, files go to req.files, not req.body.images or similar).
5. Run a syntax check on any touched files.

TEST: Since you cannot reach the live browser, describe clearly to me what changed and 
why it fixes this specific error. I will personally test updating a real product in 
the browser and report back the exact result (success or new error).

===========================================================
TASK 3: Show Brand Name in Admin Orders List
===========================================================
GOAL: In the superadmin's Orders page, each order should display which brand(s) the 
ordered product(s) belong to.

1. Confirm the Product model has a `brand` field that's actually populated on real 
   products (not just present in schema).
2. In Backend/Controllers/orderController.js's getAllOrders (admin order list 
   endpoint), ensure the response includes each order item's product brand — either 
   by populating the product reference to include brand, or by confirming order items 
   already snapshot enough product info and adding brand to that snapshot if not 
   already there.
3. On Frontend/src/app/Admin/Orders/page.tsx, add a "Brand" column/label showing the 
   brand name(s) for items in each order row.
4. Run a syntax/TypeScript check.

===========================================================
TASK 4: Add Filter Dropdowns Across Admin Panel
===========================================================
GOAL: Add filter dropdowns to 3 Admin pages for the superadmin to narrow down what 
they're viewing. All filters are CLIENT-SIDE on already-fetched data, default to 
"All", and update the visible list instantly on change (no Apply button needed).

A. Users Page (Frontend/src/app/Admin/Users/page.tsx):
   - Dropdown: "All", "User", "Reseller Admin", "Super Admin" — filters by role field.

B. Products Page (Frontend/src/app/Admin/Products/page.tsx):
   - Dropdown: "All Categories" + every real category fetched dynamically (reuse 
     however the product form already fetches categories) — filters by category.

C. Orders Page (Frontend/src/app/Admin/Orders/page.tsx):
   - Dropdown: "All", "Pending", "Processing", "Shipped", "Out for Delivery", 
     "Delivered", "Cancelled" — filters by order status (match exact values from the 
     Order model's status pipeline).

D. For all 3:
   - Place the dropdown at the top of each table, styled consistently with existing 
     admin dropdowns (reuse the role-change dropdown's styling from the Users page 
     for visual consistency).
   - Must not break existing reseller-scoped visibility (if a reseller views their 
     own restricted Products/Orders, these new filters narrow further within 
     whatever they're already allowed to see — they don't bypass or replace that 
     existing scoping).

Run a syntax/TypeScript check after each page is updated.

===========================================================
CONSTRAINTS (ALL TASKS):
===========================================================
- Do NOT touch login, JWT, payment, WhatsApp, or email logic.
- Do NOT break Task 1's reseller notification work, or any previously working 
  features (reseller scoping, role dropdown, default tags, etc.).
- Since you cannot reach the live browser or MongoDB from this sandbox, be explicit 
  every time you cannot personally verify something live — I will test in the 
  browser myself and report results back to you for any follow-up fixes needed.
- Give me a clear checkpoint summary after EACH task, listing exactly what files 
  changed and what to expect when I test it myself.

Start with Task 2 right now.