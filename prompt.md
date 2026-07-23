CONTEXT

The current Carousel UI (the large left slide + two stacked right cards layout) is correct and should stay exactly as-is — keep the same structure, sizing, navigation arrows, text overlays, and card proportions. The only problem is how each image fills its slide/card: right now images appear stretched or oddly cropped to fill the frame. Fix this using the well-known "Snapchat/Instagram Story" technique: the actual image is fully visible and properly proportioned (not stretched or cropped) centered in the frame, while the empty space around it (top/bottom or left/right, wherever the aspect ratio doesn't perfectly match the frame) is filled with a blurred, zoomed-in, duplicate copy of that same image, so there's never any blank/empty background — it just looks like a soft blurred continuation of the photo itself.

IMPLEMENTATION

Apply this to every image slot in the Carousel component — the large hero slide on the left AND both stacked promo cards on the right (and any other carousel-style image slot if there are more than these three, e.g. if the carousel rotates through additional slides beyond the initial two side cards).

For each image container:

Give the container a fixed/defined size (matching the current slide/card dimensions already in place — don't change these) with overflow: hidden and position: relative.
Inside it, render TWO copies of the same image, stacked:
Background layer: the same image, set to fully cover the entire container (object-fit: cover, width: 100%, height: 100%), scaled up slightly (e.g. transform: scale(1.15) or similar) and blurred (filter: blur(20px) — tune the blur radius so it reads as a soft, out-of-focus color wash rather than a sharp secondary image), positioned absolutely behind the foreground layer, at slightly reduced opacity/brightness if needed so it doesn't compete visually with the sharp foreground image (e.g. a subtle dark overlay on top of the blurred layer if the current dark-themed slide design calls for it, consistent with the existing black-and-gold aesthetic).
Foreground layer: the same image, set to object-fit: contain (not cover), width: 100%, height: 100%, so the full image is always visible without cropping or stretching, centered within the container, sitting on top of the blurred background layer via z-index.
Make sure any existing text overlays (titles, category labels, "Shop Now"/"Learn More" buttons, badges) still render correctly on top of both image layers with good contrast/legibility — you may need a subtle dark gradient overlay between the image layers and the text (already likely present in the current design) to keep text readable regardless of the underlying image's colors.
Use Next.js <Image> for both the background and foreground copies (reusing the same src) rather than plain <img>, so image optimization still applies — just be mindful that you're intentionally rendering the same image twice per slide (once blurred/cover, once sharp/contain), which is expected and correct for this effect, not a bug.
Apply this same two-layer technique consistently to EVERY image currently used in the Carousel — the main hero slide and both side promo cards — so the whole carousel has a unified, polished look with no image ever appearing stretched, awkwardly cropped, or sitting on a hard/flat empty-color background.
Keep this efficient — don't add unnecessary re-renders or duplicate network requests beyond the intentional two-copy rendering (Next.js <Image> with the same src should be cached/reused efficiently by the browser).
VERIFICATION
npm run build — zero errors.
Visually inspect the Carousel with several different images (differing aspect ratios/orientations — portrait, landscape, square if any exist among the actual carousel images) and confirm: every image is fully visible without stretching or awkward cropping, and any empty space around it is filled with a smooth blurred continuation of that same image — never a flat/empty background color or hard edge.
Confirm the layout/structure/sizing of the carousel itself (large left slide, two stacked right cards, arrows, dots, autoplay) is completely unchanged from before — only the internal image rendering changed.
Confirm all text overlays, buttons, and badges on top of the images remain fully legible with good contrast on every slide.
Test on mobile width too and confirm the effect still looks clean and proportioned, not distorted.
Confirm this same treatment carries through to any additional carousel images beyond the first three (if the carousel cycles through more slides than just the initial view).