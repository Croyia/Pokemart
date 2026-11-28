# Pickup-point render

Real OpenStreetMap data around a pickup point -> isometric flat-3D video (the style of the reference reel).

```
place name ──Nominatim──> lat/lon ──(optional bus-stop snap)──> Overpass query ──> osm.py convert ──> map.json ──> scene/iso-town.html ──> render.mjs ──> mp4
```

* `osm.py`    fetch (several Overpass mirrors, retries) and convert to the scene's map spec (metres, x east, z south).
* `scene/iso-town.html`   the renderer. Reads `SPEC.map`; with none it shows a built-in demo town.
* `render.mjs`   steps the page's timeline frame by frame (Playwright + ffmpeg).
* `run.py`   the whole pipeline in one command.

Run in GitHub: Actions -> **Render pickup point** -> Run workflow. Locally (needs network access to Overpass):

```bash
cd .claude/kit && npm ci && npx playwright install chromium && cd ../..
python3 pickup/run.py --place "SM Mall of Asia, Pasay" --stop-name "Mall of Asia" --out out/moa.mp4
```

Offline test with the synthetic fixture (invented geometry, not real data): `python3 pickup/run.py --from-osm pickup/tests/synthetic_osm.json --lat 14.5365 --lon 120.9830 --out out/test.mp4`

Data: (c) OpenStreetMap contributors, ODbL. Respect Nominatim's usage policy (one request per second, identify the app).
