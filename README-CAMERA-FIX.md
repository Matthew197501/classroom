# Camera fix

The meeting's **Start camera** button now requests real camera access through `navigator.mediaDevices.getUserMedia()` and renders the local camera stream in the self tile. Camera tracks are stopped when the camera is turned off, when leaving the class, and when the app unmounts.

## Requirements
- Use `localhost` during development or deploy over HTTPS. Browsers block camera access on ordinary insecure HTTP origins.
- Click **Start camera** and grant permission in the browser prompt.
- If permission was denied earlier, allow camera access from the browser's site settings and reload.
- Camera video is local preview only; it is not streamed to other people or uploaded to a meeting server.
