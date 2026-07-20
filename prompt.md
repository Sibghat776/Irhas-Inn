I need 3 fixes across the ZeeF Trendy Store project:

### FIX 1: AI Chat Window Position — Anchor Near Icon, Not Centered
File: Frontend/src/app/Components/AIProductChat.tsx

Current problem: When the chat opens, it appears centered in the middle of the screen (using something like `fixed inset-0 flex items-center justify-center` on larger screens). This looks bad — it should NOT open in the center of the page.

Required fix:
- The chat window must open anchored right next to its trigger icon at the bottom-right corner — NOT centered on the screen
- On desktop/tablet: the chat window should appear as a floating panel positioned just above the trigger button (e.g. `fixed bottom-24 right-6`), same corner as the icon itself
- On mobile: it's okay for the chat to expand larger (near-fullscreen or a bottom sheet), but it should still slide up FROM the bottom-right icon's position, not pop up centered in the middle of the screen
- Remove any `inset-0` + `items-center justify-center` wrapper that centers the modal — replace with proper corner-anchored positioning using `fixed bottom-24 right-6` (adjust z-index so it stays above other content)
- Keep the open/close animation smooth (scale/fade or slide from bottom-right corner, not from center)

### FIX 2: Navbar Not Visible on AI Search Results Page
File: Frontend/src/app/ai-search/page.tsx

Currently when navigating to /ai-search, the site's Navbar does not show up.

Please check:
1. Is there a pathname check somewhere (in layout.tsx or elsewhere) that's accidentally hiding the Navbar on /ai-search — similar to the pathname check used to hide AIProductChat on /Admin routes?
2. Fix it so the Navbar renders normally on this page, exactly like on the homepage and other product pages
3. Add a background gradient to this page's main container:
   className="bg-gradient-to-b from-gray-400 via-gray-200 to-white"
   (or bg-gradient-to-br if that better matches the site's existing gradient convention — check other pages like the homepage hero for consistency)

### FIX 3: Use the REAL ProductCard Component (Not the Placeholder Stub)
File: Frontend/src/app/ai-search/page.tsx and Frontend/src/app/Components/ProductCard.tsx

Currently the ai-search page uses a bare-bones stub ProductCard.tsx (just image, name, price, link) that does NOT match the real product cards used elsewhere on the site.

Please:
1. Find the REAL product card UI/functionality used on the main site (likely inside Frontend/src/app/Components/Products.tsx or similar — the one already used on the homepage/collection section with proper styling, hover effects, ratings, discount pricing, add-to-cart button, etc.)
2. Extract that real product card into a reusable component (if not already modular) OR reuse it directly if it's already a separate component
3. Replace the stub ProductCard usage on the ai-search page with this REAL component, so AI search results look and behave EXACTLY like product cards shown elsewhere (same design, same click behavior, same add-to-cart, same rating stars, etc.)
4. Match props correctly (check the real component's prop types/interface before wiring it up)
5. Keep the grid responsive: 2 columns on mobile, scaling up on larger screens

After all 3 fixes:
1. Run TypeScript check: npx tsc --noEmit
2. Verify build: npm run build
3. Confirm: chat opens anchored near its icon (not centered), Navbar is visible on /ai-search, gradient background is applied, and product cards match the real site design
4. Summarize exactly which files were changed and what the real product card component's source file was