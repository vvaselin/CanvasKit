# CanvasKit

CanvasKit is a small TypeScript Canvas 2D drawing library inspired by OpenSiv3D's immediate drawing style.

It is intended for drawing simple shapes, emoji, and lightweight animation effects on websites with a compact API. It is not a game engine and does not try to be compatible with all Siv3D features.

## Target

- Website decorations and visual sketches
- Diagrams, simple animated accents, and emoji effects
- Framework-independent Canvas 2D drawing
- Code that feels close to immediate-mode drawing

## Non-Goals

- Full game engine features
- PixiJS-style scene management
- Vue / React / Nuxt / Astro component wrappers
- WebGL rendering
- Physics simulation
- Image editing tools
- Replacing normal UI controls with Canvas UI

## Basic Policy

- TypeScript first
- ESM output
- Canvas 2D only
- No runtime dependencies
- Framework independent core
- Immediate drawing style
- Small API surface before abstraction
- No silent fallback behavior

CanvasKit intentionally throws when an important operation fails. For example, `createCanvasApp()` throws if a 2D context cannot be created. Unsupported drawing features are not replaced with different rendering methods behind the scenes.

`createCanvasApp()` accepts either an `HTMLCanvasElement` or a CSS selector string. Passing a selector is a convenience API for canvas lookup, not a fallback. If the selector does not match an element, or if it matches a non-canvas element, CanvasKit throws.

## Local Usage

This project is currently meant to be used locally, not installed from npm.

```sh
npm install
npm run build
```

Then open the example through a local HTTP server:

```txt
examples/basic.html
```

The example imports from `../dist/index.js`, so run `npm run build` after changing files in `src/`.

## Minimal Example

```ts
import {
  createCanvasApp,
  Palette,
} from "./dist/index.js";

createCanvasApp("#canvas", ({ draw, size }) => {
  draw.clear("#0f1117");

  draw.circle(size.center, 40, {
    fill: Palette.Skyblue,
  });
}, {
  autoStart: true,
  maxDpr: 2,
});
```

## Style Objects

Shape styles are object-based so calls stay readable as the options grow:

```ts
draw.circle(pos, 32, {
  fill: Palette.White,
});

draw.circle(pos, 32, {
  stroke: Palette.Red,
  width: 2,
});
```

Only solid fill has a short form:

```ts
draw.circle(pos, 32, Palette.White);
```

CanvasKit does not provide unclear variable-length argument forms such as `fill, stroke, width` in separate positional parameters.

## Emoji Rendering

`draw.emoji()` currently uses Canvas text rendering with `fillText()`.

Emoji appearance depends on the browser, OS, and installed emoji fonts. CanvasKit does not load emoji image assets, does not rasterize emoji by itself, and does not draw replacement shapes when emoji fonts are unavailable.

## Fallback Policy

Fallbacks are intentionally not added at this stage.

- No fallback when `CanvasRenderingContext2D` cannot be created
- No canvas creation fallback when a selector does not match
- No fallback from a matched non-canvas element to another element
- No automatic replacement for unsupported drawing features
- No `OffscreenCanvas` to normal Canvas fallback
- No emoji image asset fallback
- No transparent placeholder for failed image loading
- No complex browser compatibility layer

If an alternative path becomes necessary later, it should be added deliberately and documented. Temporary fallback behavior should remain a TODO until the API design is clear.

## Current API

- `createCanvasApp(canvasOrSelector, frame, options?)`
- `Palette`
- `deg()`
- `rad()`
- `clamp()`
- `lerp()`
- `inverseLerp()`
- `mapRange()`
- `smoothstep()`
- `pingPong()`
- `easeOutCubic()`
- `easeInOutCubic()`

Drawing methods are available from the `draw` object passed to the frame callback:

- `draw.clear(color?)`
- `draw.circle(pos, radius, style?)`
- `draw.rect(rect, style?)`
- `draw.roundRect(rect, radius, style?)`
- `draw.line(from, to, style?)`
- `draw.text(text, pos, style?)`
- `draw.emoji(emoji, pos, style?)`

## Roadmap

### v0.1

- createCanvasApp
- draw.clear
- draw.circle
- draw.rect
- draw.roundRect
- draw.line
- draw.text
- draw.emoji
- Palette
- math helpers
- mouse input
- EffectManager

### v0.2

- Vec2 / Rect / Circle helper
- contains
- intersects
- ellipse
- triangle
- polygon
- polyline
- arc

### v0.3

- draw.image
- transform helper
- withTransform
- pauseWhenHidden
- pauseWhenOffscreen
- respectReducedMotion

### v0.4

- RenderState
- withState
- RenderTarget
- Camera2D
