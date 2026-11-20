---
name: cozy-whatif-animation
description: Create flat, cozy cartoon animations and thumbnails in the "6 hours of what-ifs" sleep/explainer style — a simple white round-headed character with thick dark outlines, saturated flat colors (purple night rooms, red blankets, blue pajamas, warm lamp glow), and chunky yellow/white title text with heavy black strokes. Use when the user asks for this cartoon style, a "what if" / sleep-story / long-form explainer animation, a YouTube thumbnail in this look, or an animated scene with a cute blank-faced character.
---

# Cozy "What If" Cartoon Animation

Produce scenes, thumbnails and short looping animations in a flat, soft, bedtime-explainer
cartoon style. Output is **SVG + CSS animation in a single HTML file**, which can be rendered
to PNG frames / MP4 with `scripts/render.js`.

Start from `templates/scene.html` — it is a complete working example (sleeping character,
bedroom, night window, lamp, title text). Copy it and change the content; don't start blank.

## 1. Visual rules (the look)

### Character
- **Head**: big, near-perfect circle (or slightly squashed ellipse), pure white `#FFFFFF`.
  The head is ~45–55% of the character's total height. No hair, no ears, no nose.
- **Face**: minimal. Eyes are short curved strokes (closed/sleepy `⌒` arcs, or small solid
  dark ovals when awake). Mouth is a small curved line. Optional pink blush ovals at 40% opacity.
- **Body**: small, soft, rounded. Clothing is a single flat color (default blue hoodie/pajamas).
  Hands are mitten blobs — no fingers.
- **Shading**: one cel-shade only — a light lavender-gray `#DCDDEB` crescent on the side
  away from the light. Never use gradients on the character.

### Line work
- Every shape has a **thick dark outline**: `stroke="#1A1A2E"`, width ≈ 0.6–0.8% of frame
  width (≈ 7–9 px at 1920 wide). Use `stroke-linejoin="round"` and `stroke-linecap="round"`.
- Background objects get thinner outlines (≈ 60% of the character's) or none, so the
  character pops forward.
- Fold / crease lines inside shapes (blanket folds, sleeves) are open strokes in a darker
  shade of the fill color, not black.

### Palette (default night-bedroom)
| Role | Hex |
|---|---|
| Outline | `#1A1A2E` |
| Character white / shade | `#FFFFFF` / `#DCDDEB` |
| Wall purple (light → dark) | `#7B6FCB` → `#5A4FA8` → `#463D8C` |
| Night sky | `#0F1B44` → `#1D2C66` |
| Stars | `#FFF6C8` |
| Blanket red / fold | `#E8433A` / `#BE2F2A` |
| Pajama blue / shade | `#2F6FE6` / `#1E52C0` |
| Wood (headboard, furniture) | `#9A5A34` / `#6E3B1F` |
| Lamp glow | `#FFE7A3` center → transparent |
| Title yellow | `#FFE53B` |
| Title white | `#FFFFFF` |

Rules: high saturation, no muddy browns/grays except the wood. Warm light source (lamp)
against cool environment (purple/navy). For daytime scenes swap to sky `#7CC6FF`,
grass `#5CCB5F`, keep the same outline and character.

### Light
- One soft radial gradient for the light source glow (lamp, sun, screen) blended over
  the wall — the **only** place gradients are allowed besides the sky.
- A subtle diagonal light wedge on the wall (lighter purple polygon, 30–40% opacity).

### Title text (thumbnails / title cards)
- Font: a chunky rounded display face — **Lilita One** (preferred), Luckiest Guy, or
  Bowlby One. All caps.
- Fill yellow `#FFE53B` for the hook line, white for the second line.
- Heavy black stroke ≈ 12–16% of font size, with `paint-order: stroke` so the stroke sits
  outside the fill, plus a hard drop shadow (offset ~4% of font size, no blur, `#1A1A2E`).
- Text is huge — top line spans ~85–95% of frame width. Lines can be slightly
  offset/staggered, may overlap the scene.

### Composition
- 16:9 (1920×1080) by default. Character in the lower-left/center third, large and cropped
  by the frame edge is fine. Title occupies the top ~40%.
- Big simple shapes, few details. Each object readable as a silhouette.

## 2. Motion rules (the animation)

This style is calm. Most motion is slow, looping and eased.

| Element | Motion | Timing |
|---|---|---|
| Sleeping character | breathing: body `scaleY 1 → 1.03`, head bobs 4–6 px | 3.5–4.5 s loop, `ease-in-out`, alternate |
| Stars | twinkle: opacity 0.3 → 1, scale 0.8 → 1.1, staggered delays | 1.5–3 s, random delays |
| Lamp glow | gentle pulse: opacity 0.85 → 1 | 3 s loop |
| "Zzz" | float up + fade, slight drift right, rotate ±10° | 3 s, staggered |
| Title (intro) | pop-in: scale 0 → 1.12 → 1 with overshoot | 0.5 s, `cubic-bezier(.34,1.56,.64,1)` |
| Camera | slow push-in: whole scene scale 1 → 1.05 | 10–20 s, linear |
| Awake character actions | squash & stretch, anticipation before moves, 2–3 frame holds | snappy (0.2–0.4 s) |

- Always `transform-box: fill-box; transform-origin: center bottom` (or center) on SVG
  groups you animate, so they scale/rotate around themselves.
- Animate `transform` and `opacity` only.
- For loops, make start = end so the MP4 loops seamlessly (use `alternate` or full cycles
  that divide evenly into the clip length).

## 3. Workflow

1. **Clarify** (only if unclear): subject of the scene, still thumbnail vs animation,
   title text, length.
2. **Copy** `templates/scene.html` to the output location and edit:
   - Swap/adjust background (room, outdoors, space…), keep layers ordered:
     sky/background → wall/environment → furniture → character → foreground (blanket) → title.
   - Pose the character by editing the `#character` group (head circle, face, body path).
   - Change the title text in `.title` elements.
3. **Preview**: open the HTML, or render a still:
   ```bash
   node .claude/skills/cozy-whatif-animation/scripts/render.js scene.html out --still 1.5
   ```
   Look at the PNG and check it against section 1 (outlines thick? colors saturated?
   title stroke heavy? character readable?). Fix and repeat.
4. **Render video** (needs ffmpeg):
   ```bash
   node .claude/skills/cozy-whatif-animation/scripts/render.js scene.html out --duration 8 --fps 30
   ```
   Produces `out/frames/*.png` and `out/video.mp4`. The renderer pauses all CSS
   animations and seeks them frame by frame, so output is smooth regardless of machine speed.

## 4. Checklist before delivering
- [ ] Character: white round head, minimal face, thick dark outline, single cel shade.
- [ ] Only the light glow and sky use gradients.
- [ ] Palette saturated, warm light vs cool environment.
- [ ] Title: chunky font, yellow/white fill, heavy outside stroke + hard shadow.
- [ ] Motion is slow and eased; loops are seamless.
- [ ] Original character and content — this is a *style*; don't copy a specific channel's
      characters, logos, or exact thumbnails.
