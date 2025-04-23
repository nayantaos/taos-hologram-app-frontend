
# Porto Hologram Slide Player

A slide player application designed for the Porto Hologram device, capable of displaying a sequence of 3D models and videos in portrait orientation.

## Features

- Displays 3D .glb models using Three.js with auto-rotation and lighting
- Plays video files in full-screen portrait mode
- Automatically transitions between slides based on configured timings
- Loops through content indefinitely
- Full-screen experience with no UI controls
- Portrait orientation support (1080x1920)
- Configurable via a simple JSON file

## Setup Instructions

1. Clone the repository
2. Install dependencies with `npm install`
3. Add your content:
   - Place .glb model files in the `public/models/` directory
   - Place video files in the `public/videos/` directory
4. Configure your slide sequence by editing `public/config.json`
5. Run the application with `npm run dev`

## Important: Adding 3D Models

**To fix the "Could not load models" error:**

You must add actual GLB format 3D model files to the `public/models/` directory. The application is currently configured to use placeholder files, but these aren't actual 3D models.

To add your own 3D models:
1. Export 3D models from Blender, Maya, or other 3D software in GLB format
2. Place the .glb files in the `public/models/` directory
3. Update `public/config.json` to reference your model files

For example:
```
{
  "files": [
    { "file": "/models/your-actual-model.glb", "rotation_time": 20, "type": "3d" },
    { "file": "/videos/your-actual-video.mp4", "rotation_time": 30, "type": "video" }
  ]
}
```

## Configuration

Edit the `public/config.json` file to define your slides:

```json
{
  "files": [
    { "file": "/models/your-model.glb", "rotation_time": 20, "type": "3d" },
    { "file": "/videos/your-video.mp4", "rotation_time": 30, "type": "video" }
  ]
}
```

Each slide entry has the following properties:

- `file`: Path to the media file (relative to the public directory)
- `rotation_time`: Duration to display the slide in seconds
- `type`: Either "3d" for GLB models or "video" for video files

## Running in Kiosk Mode

For a dedicated display setup, you can run the application in kiosk mode using a Chromium-based browser:

```
chromium-browser --kiosk http://localhost:3000
```

## Technical Notes

- 3D models are loaded using Three.js and displayed with appropriate lighting
- Videos are displayed using HTML5 video elements with autoplay and muted settings
- The player automatically transitions between slides based on the rotation_time setting
- Smooth fade transitions are used between slides
