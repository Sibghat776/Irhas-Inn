Task 1: Free Shipping (all products) + Free Shipping Badge

Please find and update all places in the codebase where shipping cost/fee is calculated, displayed, or charged, including:
1. Backend order/cart calculation logic (e.g., where order total is computed — check Controllers/orderController.js or similar, and any shipping fee field in the Order model).
2. Frontend cart and checkout pages (e.g., cart/page.tsx, checkout/page.tsx) — any place showing a "Shipping" or "Delivery Fee" line item in the price breakdown.
3. Any product detail page or listing that displays a shipping cost or "+ shipping charges" text.

Requirements:
- Set shipping cost to 0 everywhere it's calculated, so the final order total no longer includes any shipping charge.
- Instead of just hiding the shipping line, update it to explicitly show "Free Shipping" in the cart/checkout price breakdown.
- Don't remove the shipping field/logic entirely — just default it to 0 and update the label.
- Add a small "Free Shipping" badge/tag on every product card (in all product grids/listings) and on the product detail page, so customers see it while browsing, not just at checkout.

Task 2: Mobile responsive grid — 2 products per row

Currently on mobile screens, the product listing/grid (wherever products are displayed — home page, productsPage, category pages, etc.) doesn't show exactly 2 products per row. Please update the responsive grid/Tailwind classes so that:
1. On mobile (small screens), exactly 2 product cards are shown per row (not 1, not 3+).
2. Tablet and desktop breakpoints should keep their current or a sensible number of columns (e.g., 3-4 on tablet, 4+ on desktop) — only mobile needs to change to 2.
3. Product cards should resize/adjust text and image sizing gracefully to still look clean and readable at the smaller 2-per-row mobile width (not cramped or overflowing).
4. Apply this consistently across every page that displays a product grid.

Task 3: Modern, eye-catching loading indicator on page navigation

Currently there's no visible loading state when navigating between pages in the app. Please add a modern, eye-catching loader that:
1. Shows automatically whenever the user navigates to a new page/route (using Next.js navigation — e.g., a top progress bar like NProgress/nprogress-style, or a custom animated loader tied to route change events).
2. Has a polished, modern look — smooth animation, matches the site's existing color scheme/branding (check the theme's primary colors used elsewhere in the app), not a generic plain spinner.
3. Automatically disappears once the new page has fully loaded.
4. Works across all pages (both customer-facing site and Admin panel).
5. Is lightweight and doesn't noticeably slow down actual page load performance.

Task 4: Display a struck-through "original price" on product cards (frontend display only)

On every product card and product detail page, in addition to the real price, display a second, higher "original price" calculated as the real price + 40%, shown with strikethrough styling next to/above the actual price, to create a visual "discount" effect.

Requirements:
1. This is a FRONTEND-ONLY display change — do not modify the actual price stored in the database, the cart total, checkout total, or anything used for payment. The real price remains what's actually charged.
2. Calculate the displayed "original price" as: realPrice + (realPrice * 0.4), rounded appropriately (e.g., to nearest whole number or 2 decimals, matching how prices are formatted elsewhere).
3. Style it clearly: original price in a muted gray color with strikethrough, actual price in bold/accent color next to it, and optionally a small "-40%" or "Save 40%" badge for visual impact.
4. Apply this consistently across every place a product price is shown: product grids/listings, product detail page, cart, and anywhere else prices appear.
5. Keep it visually clean and not cluttered given the existing card design.

Before implementing any of these four tasks:
1. Show me the exact files you'll modify for each task, and any new npm packages needed (e.g., "nprogress" or similar for the loader).
2. Wait for my approval before making changes.