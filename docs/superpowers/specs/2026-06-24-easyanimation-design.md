# EasyAnimation — Design Spec

## Overview
A frame-by-frame 2D animation web app for posing stickmen and drawing objects. Built as a single HTML file using Canvas + DOM.

## Layout
```
Header: EasyAnimation | FPS control | Play | Pause | Reset
Tool Bar (left) | Canvas Stage (center) | Properties Panel (right)
Timeline (bottom): frame strip with add/duplicate/delete, onion skin toggle
```

## Stickman
7 jointed parts: Head, Neck, Torso, Upper Arms (2), Forearms (2), Thighs (2), Calves (2).
Each limb stored as `{ x, y, angle, length, thickness, color }` per frame.
**Pose tool** — click joint + drag to rotate limb. Canvas redraws from data.

## Tools
1. **Pose** — drag joints to pose stickman
2. **Select** — select drawn shapes to move/resize/delete
3. **Pencil** — freehand draw
4. **Line** — straight lines
5. **Circle** — circles
6. **Rectangle** — rectangles
7. **Eraser** — erase parts of drawings
8. **Fill** — flood fill

## Frame System
- Classic frame strip (horizontal, bottom)
- Add / Duplicate / Delete frames
- Click to select current frame
- Onion skin (previous frame ghosted)
- Frame data: stickman pose + drawing strokes per frame

## Data Model
```
Frame: {
  stickman: { head, neck, torso, upperArmL, upperArmR, ... } // limb angles/pos
  strokes: [{ type, points, color, width, fill? }]
}
Project: { frames: Frame[], fps, currentFrame }
```

## Tech
- Pure Canvas 2D rendering
- HTML/CSS for UI (dark theme)
- No libraries — vanilla JS
- Single-file app (index.html)
