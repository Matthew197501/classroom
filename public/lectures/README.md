# Bundled lecture recordings

Put your prerecorded MP4 videos in this folder and update `playlist.json` to match their filenames and display titles.

Example: if you add `week-1.mp4`, add an entry like:

```json
{
  "id": "week-1",
  "title": "Week 1 — Introduction",
  "src": "/lectures/week-1.mp4",
  "course": "CS101"
}
```

Keep entries in the order you want them to play. When one ends, the next begins automatically; after the final entry, the playlist restarts. Use MP4 encoded with H.264 video and AAC audio for the broadest Android browser compatibility.

The app does not include copyrighted lecture videos by default. Add recordings you own or have permission to use before building/deploying.
