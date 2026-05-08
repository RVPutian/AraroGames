# Static HTML Conversion Notes

This project has been converted from PHP pages to static HTML.

## What changed

1. The public pages now live at index.html, page/Download/index.html, page/AdminDashboard/index.html, and page/Login/index.html.
2. Server-side login and session handling were removed.
3. The admin dashboard is now a static page without Clerk authentication.

## Hosting note

This version is suitable for static hosting such as GitHub Pages or any host that serves plain HTML, CSS, and JavaScript.
