# EasyAnimation Redesign — Full App Overhaul

## Overview
Complete redesign of EasyAnimation from a single-screen stickman animator to a multi-screen, mobile-responsive animation app with built-in sprites, layers, tweening, export, and project management.

## Architecture
- Vanilla JS modular SPA with `ScreenManager` and hash routing
- IndexedDB for project persistence via `ProjectStore`
- CSS Grid + Flexbox with mobile-first responsive breakpoints
- Same canvas 2D rendering, extended for layers and sprites

### Modules
| Module | Responsibility |
|--------|---------------|
| `screen-manager.js` | Hash routing (`#start`, `#project`, `#editor/:id`), screen transitions |
| `project-store.js` | IndexedDB CRUD for projects (name, canvas size, fps, frames, layers) |
| `sprite-library.js` | Built-in characters (8) and objects (12) as SVG path data |
| `canvas-engine.js` | Canvas rendering, zoom/pan, layer compositing, grid |
| `tools.js` | Drawing tools (pencil, line, circle, rect, eraser, fill, text) |
| `layers.js` | Layer management (add, delete, reorder, hide, lock) |
| `timeline.js` | Frame management, onion skin, tweening between frames |
| `exporter.js` | Export to GIF (gif.js), WebM (MediaRecorder), PNG spritesheet |
| `undo-manager.js` | History stack (50 actions), undo/redo |
| `app.js` | Bootstrap and wire everything together |

## Screens

### Start Screen (`#start`)
- Centered layout: app logo + tagline, "New Animation" button, "Open Project" button
- Subtle animated demo preview (cycling through a sample project's frames)

### Project Screen (`#project`)
- Header with app name + "New Project" button
- Grid of project cards with thumbnail, name, date, frame count
- Context menu: rename, duplicate, delete
- Empty state with CTA

### New Project Dialog
- Modal with: project name, canvas presets (480x360 / 800x500 / 1024x576 / 1920x1080) or custom, FPS, background color
- "Create" button

### Editor Screen (`#editor/:id`)
The main workspace with:

**Toolbar (left, collapsible on mobile):**
- Tools: select, pencil, line, circle, rect, eraser, fill, text
- Active tool highlighted

**Sprite Library Panel (left sidebar, below toolbar, collapsible):**
- Two tabs: Characters (8 pre-made), Objects (12 pre-made)
- Draggable sprites that drop onto canvas

**Canvas (center):**
- Resizable, zoomable (`ctrl+scroll` / pinch), pannable (`space+drag`)
- Grid overlay toggle
- Layer display: each layer rendered in order

**Layers Panel (right, collapsible):**
- Layer list with visibility/lock toggles
- Add, delete, reorder buttons
- Active layer selection

**Timeline (bottom):**
- Frame strip with thumbnails
- Play, pause, reset, FPS controls
- Add, duplicate, delete frame
- Onion skin toggle
- Tween button (interpolates between 2 selected frames)

## Data Model

### Project
```
{
  id, name, width, height, fps, bgColor, createdAt, updatedAt,
  frames: [ Frame, ... ]
}
```

### Frame
```
{
  layers: [ Layer, ... ]
}
```

### Layer
```
{
  id, name, visible, locked,
  strokes: [ Stroke, ... ],
  sprites: [ SpriteInstance, ... ],
  texts: [ TextElement, ... ]
}
```

### Sprite
```
{
  id, name, category: 'character'|'object',
  paths: [ { d: 'SVG path', fill, stroke } ]
}
```

### SpriteInstance
```
{
  spriteId, x, y, scaleX, scaleY, rotation, layer
}
```

## Built-in Sprites
- **Characters (8):** boy, girl, robot, cat, monster, bird, fish, alien
- **Objects (12):** ball, star, heart, cloud, tree, house, car, sun, moon, arrow, box, flower
- Stored as compact SVG path data in `sprite-library.js`
- Styled consistently with flat colors

## Mobile Responsive
- **Breakpoints:** 480px, 768px, 1024px
- **<480px (phone):** Toolbar becomes bottom horizontal strip; panels become bottom sheets/drawers; canvas fills width; timeline thumbs smaller
- **480-768px (tablet):** Collapsible side panels with hamburger toggle; toolbar slim vertical
- **768px+ (desktop):** Full layout as designed
- Touch: pointer events already used, no extra work needed
- Fullscreen button on mobile

## Export
- **GIF:** Uses `gif.js` library — all frames, configurable delay, quality
- **WebM:** Uses `MediaRecorder` API capturing canvas at FPS
- **Spritesheet:** Renders all frames side-by-side as single PNG
- Export dialog with format selection and quality options

## Undo/Redo
- Command pattern: each action pushes state to undo stack
- Stack capped at 50 entries
- Keyboard shortcuts: Ctrl+Z / Ctrl+Y
- Undo/redo buttons in editor header

## Future Considerations (out of scope for v1)
- Audio import and sound timelines
- Onion skin with multiple previous frames
- Community sprite sharing
- SVG export
