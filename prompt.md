Task 1: Fix horizontal scroll on Admin → Products page

The Admin Products table currently has a horizontal scrollbar (visible at the bottom) forcing the user to scroll sideways to see all columns. Please fix this so the entire table fits within one screen/viewport without horizontal scrolling, for the standard desktop admin panel width.

Requirements:
1. Make the table responsive so all columns (image, name, description, etc.) fit within the visible container width without a horizontal scrollbar.
2. This likely means truncating/limiting the description text with ellipsis (text-overflow: ellipsis, line-clamp), reducing column widths, and/or adjusting the table layout (e.g., table-fixed with defined column widths) rather than letting content overflow.
3. Do not change anything else in this page — only fix the horizontal overflow/scrollbar issue.
4. Show me the file(s) you'll modify before applying.

Task 2: Remove the "-40%" / discount badge

Please remove ONLY the "-40%" / "Save 40%" discount badge that was added earlier (as part of the strikethrough original price feature) — everywhere it currently appears.

Requirements:
1. Keep the strikethrough "original price" and the actual price display exactly as they are — do NOT remove or change those.
2. Remove only the small badge/tag element that shows "-40%" or "Save 40%" text.
3. Apply this removal everywhere the badge currently shows (product cards, product detail page, or admin panel if it appears there too).
4. Do not change anything else.