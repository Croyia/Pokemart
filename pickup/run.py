#!/usr/bin/env python3
"""One command: place -> real map data -> isometric pickup-point video.

    python3 pickup/run.py --place "SM Mall of Asia" --stop-name "Mall of Asia" --out out/moa.mp4
    python3 pickup/run.py --lat 14.5353 --lon 120.9827 --lines "your bus" "is here" --out out/x.mp4
    python3 pickup/run.py --from-osm pickup/tests/synthetic_osm.json --lat .. --lon .. --stills 0.2,1.6,4.5 --out out/test.mp4
"""
import argparse, json, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / '.claude' / 'kit'
sys.path.insert(0, str(KIT)); sys.path.insert(0, str(ROOT / 'pickup'))
import osm  # noqa: E402
import shutil


def prepare(template, spec, dur, work):
    """render folder: index.html with the spec filled in, fonts and three.js (this scene needs nothing else)"""
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    data = json.dumps(spec, ensure_ascii=False).replace('</', '<\\/')
    (work / 'index.html').write_text(Path(template).read_text().replace('__SPEC__', data).replace('__DURATION__', f'{dur:.3f}'))
    shutil.copytree(KIT / 'fonts', work / 'fonts')
    t = KIT / 'node_modules' / 'three'
    (work / 'vendor' / 'three').mkdir(parents=True)
    shutil.copy(t / 'build' / 'three.module.js', work / 'vendor' / 'three' / 'three.module.js')
    shutil.copy(t / 'build' / 'three.core.js', work / 'vendor' / 'three' / 'three.core.js') if (t / 'build' / 'three.core.js').exists() else None


def main():
    ap = argparse.ArgumentParser()
    for k in ('--place', '--stop-name', '--from-osm', '--stills'): ap.add_argument(k)
    ap.add_argument('--lat', type=float); ap.add_argument('--lon', type=float); ap.add_argument('--radius', type=float, default=140)
    ap.add_argument('--lines', nargs='*', default=['your ride is', 'almost here']); ap.add_argument('--out', default='out/pickup.mp4'); ap.add_argument('--frames', default='0')
    a = ap.parse_args(); out = Path(a.out).resolve(); out.parent.mkdir(parents=True, exist_ok=True); name = a.place or ''
    if a.lat is None:
        if not a.place: sys.exit('give --place or --lat/--lon')
        a.lat, a.lon, name = osm.geocode(a.place)
    pick = (a.lat, a.lon)
    if a.stop_name and not a.from_osm:
        pick = osm.find_stop(a.lat, a.lon, a.stop_name) or pick
    data = json.load(open(a.from_osm)) if a.from_osm else osm.overpass(osm.query(pick[0], pick[1], a.radius + 30))
    (out.parent / (out.stem + '.osm.json')).write_text(json.dumps(data))
    mp = osm.convert(data, pick[0], pick[1], pick, a.radius); mp['name'] = name
    (out.parent / (out.stem + '.map.json')).write_text(json.dumps(mp))
    spec = {'lines': a.lines, 'map': mp}; work = out.parent / (out.stem + '.work')
    prepare(ROOT / 'pickup' / 'scene' / 'iso-town.html', spec, 4.8, work)
    cmd = ['node', str(ROOT / 'pickup' / 'render.mjs'), str(work), str(out), '--frames', a.frames] + (['--stills', a.stills] if a.stills else [])
    subprocess.run(cmd, check=True, env={**__import__('os').environ, 'KIT': str(KIT)})


if __name__ == '__main__':
    main()
