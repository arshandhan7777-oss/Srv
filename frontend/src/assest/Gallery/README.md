This folder is no longer wired into the public gallery build.

Supported formats:
- .jpg
- .jpeg
- .png
- .webp
- .avif

How it works now:
- The main public gallery fetches images from Cloudinary through the backend
- The frontend fallback uses a few remote placeholder images instead of bundling local files
- Keeping many photos in this folder will not help the live gallery anymore

Naming tip:
- Use clean file names like `annual-day-01.jpg` or `sports-meet-2026.webp`

If you want an image to appear in the live gallery, upload it through the admin media flow so it lands in the Cloudinary gallery folder.
