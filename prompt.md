Fix ONLY the update functionality for Products and Categories. Do not modify, redesign, or change any unrelated functionality, UI, styling, authentication, database schema, or existing features.

Current issue during UPDATE:

Category Update Error:
"Cannot destructure property 'description' of 'req.body' as it is undefined."

Product Update:
The product update is not working at all.

Your task is to debug and fix the complete end-to-end UPDATE flow for both Products and Categories.

Requirements:

1. CATEGORY UPDATE
- Find the exact frontend API request/function used when updating a category.
- Find the exact backend controller/route handling category update.
- Ensure the frontend sends the update payload correctly in the request body.
- Ensure the request uses the correct HTTP method (PUT/PATCH as already intended by the existing architecture).
- Ensure the request includes the correct Content-Type header when sending JSON.
- Fix the issue where req.body is undefined.
- Make sure the backend safely reads the request body and correctly updates the category.
- Preserve existing category fields and update only the fields intended to be changed.
- After successful update, refresh/update the frontend state so the updated category is immediately visible.
- Handle validation and errors properly without crashing the server.

2. PRODUCT UPDATE
- Trace the complete product update flow from the Admin Panel UI → frontend handler → API request → backend route → controller → database.
- Identify why the product update is currently not working.
- Fix the actual root cause instead of adding a workaround.
- Ensure the frontend sends all required product update data correctly.
- Ensure multipart/form-data is handled correctly if product images/files are involved.
- If no new image is selected, preserve the existing product image(s).
- If new images are selected, correctly process and save them according to the existing project architecture.
- Ensure the backend correctly handles req.body and uploaded files.
- Ensure the product is actually updated in the database.
- Return a proper success response.
- Update the frontend state/UI immediately after successful update.

3. IMPORTANT DEBUGGING RULES
- Inspect the existing codebase first and understand the current architecture.
- Do NOT rewrite the entire project.
- Do NOT change unrelated code.
- Do NOT change the existing API response structure unless absolutely necessary.
- Do NOT change database models/schema unless the existing implementation is genuinely broken and the change is required.
- Do NOT hide the error with optional chaining or dummy fallback values. Fix the actual request/route/controller mismatch.
- Check whether the frontend is accidentally sending FormData, JSON, or no body at all, and make the backend/frontend consistent.
- Check route parameters, IDs, HTTP methods, headers, body parsing/middleware, and controller logic.
- Verify that the frontend API endpoint exactly matches the backend route.
- Verify that the correct category/product ID is being sent during update.

4. FINAL VERIFICATION
After fixing:
- Test Category Update end-to-end.
- Test Product Update end-to-end.
- Confirm Category Update no longer throws:
  "Cannot destructure property 'description' of 'req.body' as it is undefined."
- Confirm Product Update successfully updates the database and UI.
- Check browser console and backend logs for any remaining errors.
- Make sure Create/Add functionality continues working exactly as before.
- Make sure Delete functionality continues working exactly as before.
- Make sure no unrelated functionality is changed.

ONLY fix the Product Update and Category Update issues described above. Do not make any other changes.