# 🌳 Talking Trees 🌿

An interactive web application that brings plants to life! Point your camera at trees or plants, and watch as faces appear on them with animated dialogue. When multiple plants are detected, they can even have conversations with each other!

## Features

- 📹 **Real-time Camera Feed**: Uses your device's camera to detect plants in real-time
- 🌿 **Smart Plant Detection**: Uses color-based detection to identify green plants and trees
- 😊 **Animated Faces**: Superimposes animated emoji faces on detected plants
- 💬 **Dynamic Dialogue**: Plants generate contextual dialogue and conversations
- 🗣️ **Multi-Plant Conversations**: When multiple plants are detected, they interact with each other
- 🎨 **Beautiful UI**: Modern, gradient-based design with smooth animations

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge)
2. Click "Start Camera" and allow camera permissions when prompted
3. Point your camera at plants, trees, or any green vegetation
4. Watch as faces appear on detected plants and they start talking!
5. Point at multiple plants to see them have conversations with each other

## Controls

- **Start Camera**: Begin detecting plants
- **Stop Camera**: Stop the camera feed
- **Auto-talk mode**: Enable/disable automatic dialogue generation
- **Sensitivity**: Adjust the detection sensitivity (higher = detects more plants, but may have false positives)

## Technical Details

- Built with vanilla JavaScript (no frameworks required)
- Uses Web Camera API for video capture
- Canvas-based image processing for plant detection
- Green color detection algorithm for identifying vegetation
- Real-time face overlay and speech bubble rendering

## Browser Requirements

- Modern browser with camera API support
- HTTPS required for camera access (or localhost for development)
- WebGL and Canvas support

## Tips for Best Results

- Use good lighting conditions
- Point camera at clearly visible green plants
- Adjust sensitivity slider if detection is too sensitive or not sensitive enough
- Works best with outdoor plants and trees with good lighting

Enjoy talking with your plants! 🌱💚
