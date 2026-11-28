#!/usr/bin/env python3
"""Fetch OpenStreetMap data around a pickup point and convert it into the scene's map spec (metres: x east, z south).

    python3 pickup/osm.py --place "SM Mall of Asia" --stop-name "Mall of Asia" --radius 140 --out map.json
    python3 pickup/osm.py --lat 14.5353 --lon 120.9827 --out map.json
    python3 pickup/osm.py --from-osm saved_overpass.json --lat .. --lon .. --out map.json     # offline
"""
import argparse, json, math, random, sys, time, urllib.parse, urllib.request
from pathlib import Path

UA = 'pickup-point-render/0.1 (personal project; contact via repo)'
MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
           'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']


def http(url, data=None, timeout=90):
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode() if data else None, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode()


def geocode(q):
    for query in (q, q.split(',')[0]):
        r = json.loads(http('https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': query, 'format': 'jsonv2', 'limit': 1})))
        if r:
            return float(r[0]['lat']), float(r[0]['lon']), r[0].get('display_name', q)
    sys.exit(f'could not geocode "{q}": pass --lat/--lon instead')


def overpass(ql, tries=2):
    last = None
    for _ in range(tries):
        for m in MIRRORS:
            try:
                t = time.time(); txt = http(m, {'data': ql}, timeout=100)
                d = json.loads(txt)
                print(f'overpass ok via {m} in {time.time() - t:.1f}s: {len(d.get("elements", []))} elements', file=sys.stderr)
                return d
            except Exception as e:  # mirror down, rate limited or timed out: try the next one
                last = e; print(f'overpass {m} failed: {e}', file=sys.stderr)
        time.sleep(4)
    sys.exit(f'all Overpass mirrors failed ({last})')


def find_stop(lat, lon, name, r=1500):
    ql = f'[out:json][timeout:40];(node["highway"="bus_stop"]["name"~"{name}",i](around:{r},{lat},{lon});node["public_transport"]["name"~"{name}",i](around:{r},{lat},{lon}););out tags center 20;'
    els = overpass(ql).get('elements', [])
    if not els:
        return None
    els.sort(key=lambda e: (e['lat'] - lat) ** 2 + (e['lon'] - lon) ** 2)
    print('stop:', els[0].get('tags', {}).get('name'), els[0]['lat'], els[0]['lon'], file=sys.stderr)
    return els[0]['lat'], els[0]['lon']


def query(lat, lon, r):
    a = f'(around:{r},{lat},{lon})'
    return f'''[out:json][timeout:60];(way["highway"]{a};way["building"]{a};way["natural"~"water|coastline|wood"]{a};way["leisure"~"park|garden|pitch|playground"]{a};
way["landuse"~"grass|forest|recreation_ground|meadow|retail|commercial|residential|industrial"]{a};way["amenity"="parking"]{a};relation["building"]{a};relation["natural"="water"]{a};relation["leisure"~"park|garden"]{a};node["natural"="tree"]{a};node["highway"="bus_stop"]{a};way["public_transport"="platform"]{a};node["public_transport"="platform"]{a};);out geom tags;'''


# ------------------------------------------------------------------ conversion
WIDTH = {'motorway': 14, 'trunk': 13, 'primary': 11, 'secondary': 9.5, 'tertiary': 8, 'unclassified': 6.5, 'residential': 6, 'living_street': 5, 'service': 4.2, 'busway': 7, 'pedestrian': 5, 'footway': 2.4, 'path': 2, 'cycleway': 2.4, 'steps': 2}
SKIP = {'proximity', 'construction', 'proposed', 'raceway', 'bus_guideway', 'corridor', 'elevator'}


def project(lat0, lon0):
    kx, kz = 111320 * math.cos(math.radians(lat0)), 110574
    return lambda la, lo: ((lo - lon0) * kx, -(la - lat0) * kz)


def area(p):
    return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x0, z0), (x1, z1) = pts[0], pts[-1]; dx, dz = x1 - x0, z1 - z0; L = math.hypot(dx, dz) or 1e-9
    d, k = max(((abs((p[0] - x0) * dz - (p[1] - z0) * dx) / L, i) for i, p in enumerate(pts[1:-1], 1)), default=(0, 0))
    return rdp(pts[:k + 1], eps)[:-1] + rdp(pts[k:], eps) if d > eps else [pts[0], pts[-1]]


def seg_nearest(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]; L2 = dx * dx + dz * dz or 1e-9
    k = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2)); q = (a[0] + dx * k, a[1] + dz * k)
    return math.hypot(p[0] - q[0], p[1] - q[1]), q, k


def stitch(segs):
    """join member ways (lists of (lat,lon)) into closed rings"""
    segs = [list(sg) for sg in segs if len(sg) > 1]; rings = []
    while segs:
        ring = segs.pop(0)
        while ring[0] != ring[-1]:
            for i, sg in enumerate(segs):
                if sg[0] == ring[-1]: ring += sg[1:]
                elif sg[-1] == ring[-1]: ring += sg[::-1][1:]
                elif sg[-1] == ring[0]: ring = sg[:-1] + ring
                elif sg[0] == ring[0]: ring = sg[::-1][:-1] + ring
                else: continue
                segs.pop(i); break
            else: break
        if ring[0] == ring[-1] and len(ring) >= 4: rings.append(ring)
    return rings


def expand_relations(osm):
    out = []
    for e in osm.get('elements', []):
        if e['type'] != 'relation': out.append(e); continue
        outer = [[(g['lat'], g['lon']) for g in m['geometry']] for m in e.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
        for i, ring in enumerate(stitch(outer)):
            out.append({'type': 'way', 'id': e['id'] * 100 + i, 'tags': e.get('tags', {}), 'geometry': [{'lat': a, 'lon': b} for a, b in ring]})
    return {'elements': out}


def convert(osm, lat0, lon0, pick_ll, radius, seed=7, from_stop=False):
    osm = expand_relations(osm)
    rng = random.Random(seed); P = project(lat0, lon0); pick = P(*pick_ll)
    roads, buildings, areas, trees, stops, canopies = [], [], [], [], [], []
    WALLS = [(0x2b3152, 0xe8903c), (0xf4e6c8, 0xd9a05a), (0xf1c75a, 0xfff2d0), (0xf2a89a, 0xfff2d0), (0xa9d0f2, 0xffffff), (0xe9ecf2, 0xc9ced8), (0x7fd0c0, 0xf4e6c8)]
    ROOFS = [0x4a4f5e, 0x2b4aa8, 0xc0503f, 0x6a4ab0, 0x4a4f5e, 0x55606e]
    for e in osm.get('elements', []):
        t = e.get('tags', {}); g = e.get('geometry')
        pts = [P(p['lat'], p['lon']) for p in g] if g else None
        if e['type'] == 'node':
            q = P(e['lat'], e['lon'])
            if t.get('natural') == 'tree': trees.append([q[0], q[1], rng.uniform(.9, 1.3)])
            elif t.get('highway') == 'bus_stop' or t.get('public_transport'): stops.append(q)
            continue
        if not pts or len(pts) < 2: continue
        if 'highway' in t and t['highway'] not in SKIP:
            hw = t['highway']; w = WIDTH.get(hw, 5)
            try: lanes = float(t.get('lanes', 0))
            except ValueError: lanes = 0
            if lanes and hw not in ('footway', 'path', 'cycleway', 'steps'): w = max(w, lanes * 3.2)
            bus = hw == 'busway' or any(k.startswith('busway') or k.startswith('lanes:bus') or k == 'bus:lanes' for k in t)
            side = 'left' if (t.get('busway') == 'lane' and t.get('busway:right') in (None, 'no') and t.get('busway:left')) else 'right'
            roads.append({'pts': rdp([list(p) for p in pts], .6), 'w': round(min(w, 28), 1), 'kind': 'path' if hw in ('footway', 'path', 'cycleway', 'steps', 'pedestrian') else 'road',
                          'oneway': t.get('oneway') in ('yes', '1', 'true') or hw == 'motorway', 'rev': t.get('oneway') == '-1', 'bus': bus, 'busSide': side, 'hw': hw}); continue
        if (t.get('building') == 'roof' or t.get('amenity') == 'shelter') and len(pts) >= 4:
            canopies.append(rdp([list(p) for p in pts[:-1]], .5)); continue
        if 'building' in t and len(pts) >= 4:
            poly = rdp([list(p) for p in pts[:-1]], .8)
            if len(poly) < 3: continue
            a = area(poly)
            try: h = float((str(t.get('height', '')).split() or ['0'])[0])
            except ValueError: h = 0
            if not h:
                try: h = float(t.get('building:levels', 0)) * 3.3
                except ValueError: h = 0
            if not h: h = 5 if a < 120 else 9 if a < 900 else 14
            h = max(3.4, min(h, 42)); wall, trim = WALLS[e['id'] % len(WALLS)]; roof = ROOFS[e['id'] % len(ROOFS)]
            if area(poly) > 900: roof = 0x8a92a3                               # big roofs stay neutral
            b = {'poly': poly, 'h': round(h, 1), 'wall': wall, 'roof': roof, 'trim': trim, 'win': True}
            if a < 180 and len(poly) <= 5 and h < 8:           # small house: pitched roof on its oriented rectangle
                i = max(range(len(poly)), key=lambda i: math.dist(poly[i], poly[(i + 1) % len(poly)])); a0, a1 = poly[i], poly[(i + 1) % len(poly)]
                ang = math.atan2(a1[1] - a0[1], a1[0] - a0[0]); ca, sa = math.cos(-ang), math.sin(-ang)
                rot = [((x - a0[0]) * ca - (z - a0[1]) * sa, (x - a0[0]) * sa + (z - a0[1]) * ca) for x, z in poly]
                x0, x1 = min(r[0] for r in rot), max(r[0] for r in rot); z0, z1 = min(r[1] for r in rot), max(r[1] for r in rot)
                cx, cz = (x0 + x1) / 2, (z0 + z1) / 2; wx, wz = cx * math.cos(ang) - cz * math.sin(ang) + a0[0], cx * math.sin(ang) + cz * math.cos(ang) + a0[1]
                b = {'gable': [wx, wz, x1 - x0, z1 - z0, -ang], 'h': round(min(h, 4.5), 1), 'wall': wall, 'roof': roof, 'trim': trim}
            buildings.append(b); continue
        if t.get('natural') == 'coastline' and len(pts) >= 2:       # water lies to the right of the coastline direction
            line = rdp([list(p) for p in pts], 2.0); (ax, az), (bx, bz) = line[0], line[1]; (cx, cz), (dx, dz) = line[-2], line[-1]
            def right(p, q): L = math.hypot(q[0] - p[0], q[1] - p[1]) or 1; return (-(q[1] - p[1]) / L, (q[0] - p[0]) / L)
            n0, n1 = right((ax, az), (bx, bz)), right((cx, cz), (dx, dz)); R = 700
            areas.append({'poly': line + [[dx + n1[0] * R, dz + n1[1] * R], [ax + n0[0] * R, az + n0[1] * R]], 'color': 0x3d8fd6, 'water': True}); continue
        if len(pts) >= 4 and pts[0] == pts[-1]:
            poly = rdp([list(p) for p in pts[:-1]], 1.0)
            if t.get('natural') == 'water': areas.append({'poly': poly, 'color': 0x3d8fd6, 'water': True}); continue
            if t.get('natural') == 'wood' or t.get('landuse') == 'forest': areas.append({'poly': poly, 'color': 0x4a9a52, 'grove': True}); continue
            if t.get('leisure') in ('park', 'garden', 'playground') or t.get('landuse') in ('grass', 'recreation_ground', 'meadow'): areas.append({'poly': poly, 'color': 0x7cc274, 'park': True}); continue
            if t.get('leisure') == 'pitch': areas.append({'poly': poly, 'color': 0xd9a26a}); continue
            if t.get('amenity') == 'parking': areas.append({'poly': poly, 'color': 0x9aa0ab}); continue
            if t.get('landuse') in ('retail', 'commercial', 'industrial'): areas.append({'poly': poly, 'color': 0xd6d0c2}); continue
            if t.get('landuse') == 'residential': areas.append({'poly': poly, 'color': 0xdad5c8}); continue
            if t.get('public_transport') == 'platform':
                areas.append({'poly': poly, 'color': 0xe4e7ee, 'raised': True}); stops.append((sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)))
    road_only = [r for r in roads if r['kind'] == 'road']
    # snap the pickup to the kerb of the nearest road, and make the vehicle come along that road
    best = None
    for r in road_only:
        for i in range(len(r['pts']) - 1):
            d, q, k = seg_nearest(pick, r['pts'][i], r['pts'][i + 1])
            if not best or d < best[0]: best = (d, r, i, q)
    vehicle = None; pickup = list(pick)
    if best:
        d, r, i, q = best; a, b = r['pts'][i], r['pts'][i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1]) or 1; ux, uz = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        right_of_ab = ((pick[0] - q[0]) * (-uz) + (pick[1] - q[1]) * ux) >= 0       # (x east, z south): right-hand normal of (dx,dz) is (-dz, dx)
        fwd = (not r['rev']) if r['oneway'] else right_of_ab                       # one-way roads fix the direction; two-way: drive on the side that puts the pickup on the right
        side_sign = 1 if (fwd == right_of_ab) else -1                              # +1: pickup is on the right-hand kerb of the travelling vehicle
        back = [list(q)] + ([r['pts'][j] for j in range(i, -1, -1)] if fwd else [r['pts'][j] for j in range(i + 1, len(r['pts']))])   # q, then backwards along travel
        run, trail = 0.0, [back[0]]
        for p0, p1 in zip(back, back[1:]):
            seg = math.dist(p0, p1)
            if run + seg >= 110:
                k = (110 - run) / seg; trail.append([p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k]); break
            trail.append(list(p1)); run += seg
        pts = trail[::-1]                                                            # far point first, pickup last
        sgn = 1 if right_of_ab else -1
        pickup = [q[0] + (-uz) * sgn * (r['w'] / 2 + 2.0), q[1] + ux * sgn * (r['w'] / 2 + 2.0)]
        off = max(1.6, r['w'] / 2 - 2.2); out = []
        for j, p in enumerate(pts):
            a2, b2 = pts[max(0, j - 1)], pts[min(len(pts) - 1, j + 1)]; dx, dz = b2[0] - a2[0], b2[1] - a2[1]; Ln = math.hypot(dx, dz) or 1
            out.append([p[0] + (-dz / Ln) * off * side_sign, p[1] + (dx / Ln) * off * side_sign])
        vehicle = {'pts': out, 'type': 'bus' if from_stop or r['bus'] or r['hw'] in ('primary', 'trunk', 'secondary', 'busway') else 'car'}
    # trees: scatter in parks / groves, away from roads and buildings
    def near_road(p, m=3):
        return any(seg_nearest(p, r['pts'][i], r['pts'][i + 1])[0] < r['w'] / 2 + m for r in road_only for i in range(len(r['pts']) - 1))
    def in_poly(p, poly):
        c = False
        for i in range(len(poly)):
            xi, zi = poly[i]; xj, zj = poly[i - 1]
            if (zi > p[1]) != (zj > p[1]) and p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi: c = not c
        return c
    bpolys = [b['poly'] for b in buildings if 'poly' in b]
    for a in areas:
        if not (a.get('park') or a.get('grove')): continue
        xs, zs = [p[0] for p in a['poly']], [p[1] for p in a['poly']]
        n = int(min(60, area(a['poly']) / (70 if a.get('grove') else 180)))
        for _ in range(n * 3):
            if n <= 0: break
            p = (rng.uniform(min(xs), max(xs)), rng.uniform(min(zs), max(zs)))
            if in_poly(p, a['poly']) and not near_road(p, 2) and not any(in_poly(p, bp) for bp in bpolys) and math.dist(p, pickup) > 6:
                trees.append([p[0], p[1], rng.uniform(.9, 1.4)]); n -= 1
    trees = [t for t in trees if abs(t[0] - pickup[0]) < radius * 1.4 and abs(t[1] - pickup[1]) < radius * 1.4 and not near_road(t, 1.2) and not any(in_poly(t, bp) for bp in bpolys)][:140]
    purple = [t[:3] for t in trees[::9]]; trees = [t for t in trees if t not in purple]
    green = sum(area(a['poly']) for a in areas if a.get('park') or a.get('grove'))
    return {'ground': 'grass' if green > 0.35 * math.pi * radius ** 2 else 'urban', 'canopies': canopies, 'real': True, 'pickup': pickup, 'roads': roads, 'buildings': buildings, 'areas': areas, 'trees': trees, 'purple': purple, 'fences': [], 'stops': [list(s) for s in stops if math.dist(s, pickup) < radius][:12], 'vehicle': vehicle}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--place'); ap.add_argument('--stop-name'); ap.add_argument('--lat', type=float); ap.add_argument('--lon', type=float)
    ap.add_argument('--radius', type=float, default=140); ap.add_argument('--out', required=True); ap.add_argument('--from-osm'); ap.add_argument('--save-osm')
    a = ap.parse_args(); name = a.place or ''
    if a.lat is None:
        if not a.place: sys.exit('give --place or --lat/--lon')
        a.lat, a.lon, name = geocode(a.place); print('geocoded:', name, a.lat, a.lon, file=sys.stderr)
    pick = (a.lat, a.lon)
    if a.stop_name and not a.from_osm:
        s = find_stop(a.lat, a.lon, a.stop_name)
        if s: pick = s
    osm = json.load(open(a.from_osm)) if a.from_osm else overpass(query(pick[0], pick[1], a.radius + 30))
    if a.save_osm: Path(a.save_osm).write_text(json.dumps(osm))
    spec = convert(osm, pick[0], pick[1], pick, a.radius, from_stop=bool(a.stop_name))
    spec['name'] = name; spec['center'] = list(pick)
    Path(a.out).write_text(json.dumps(spec)); print(f'wrote {a.out}: {len(spec["roads"])} roads, {len(spec["buildings"])} buildings, {len(spec["trees"])} trees, {len(spec["areas"])} areas, vehicle={bool(spec["vehicle"])}', file=sys.stderr)


if __name__ == '__main__':
    main()
