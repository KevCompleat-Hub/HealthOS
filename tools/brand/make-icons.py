"""EvoVive-Markensymbol: zwei Blätter als aufsteigendes „V“ (Wachstum, Vitalität) mit einem Punkt (Energie).
Erzeugt SVG und PNG-Icons reproduzierbar. Aufruf: python3 tools/brand/make-icons.py"""
import math, os
from PIL import Image, ImageDraw
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'apps', 'web', 'public', 'icons')
FOREST, SAGE, CREAM, GOLD = '#24543F', '#B7D2AE', '#F7F5EF', '#E6B95C'

def leaf(cx, cy, length, width, angle_deg, n=60):
    """Blatt als Linse: Spitze unten bei (cx, cy), wächst unter angle_deg (0 = senkrecht nach oben)."""
    a = math.radians(angle_deg); pts = []
    for side in (1, -1):
        rng = range(n + 1) if side == 1 else range(n, -1, -1)
        for i in rng:
            t = i / n; x = side * width * math.sin(math.pi * t) * (1 - 0.15 * t); y = -length * t
            pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts

def shapes(size, pad=0.0):
    s = size * (1 - 2 * pad); o = size * pad
    base = (o + s * 0.5, o + s * 0.78)
    left = leaf(*base, s * 0.50, s * 0.12, -32)
    right = leaf(*base, s * 0.50, s * 0.12, 32)
    dot = (o + s * 0.5, o + s * 0.27, s * 0.075)
    return left, right, dot

def png(size, path, maskable=False, radius=0.22):
    k = 4; S = size * k
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if maskable: d.rectangle([0, 0, S, S], fill=FOREST)
    else: d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius), fill=FOREST)
    left, right, (dx, dy, dr) = shapes(S, pad=0.12 if maskable else 0.0)
    d.polygon(left, fill=SAGE); d.polygon(right, fill=CREAM)
    d.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=GOLD)
    im.resize((size, size), Image.LANCZOS).save(path)

def svg(path, size=64):
    left, right, (dx, dy, dr) = shapes(size)
    poly = lambda p: ' '.join(f'{x:.2f},{y:.2f}' for x, y in p)
    open(path, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}"><rect width="{size}" height="{size}" rx="{size*0.22:.1f}" fill="{FOREST}"/><polygon points="{poly(left)}" fill="{SAGE}"/><polygon points="{poly(right)}" fill="{CREAM}"/><circle cx="{dx:.2f}" cy="{dy:.2f}" r="{dr:.2f}" fill="{GOLD}"/></svg>\n')

os.makedirs(OUT, exist_ok=True)
png(192, os.path.join(OUT, 'evovive-192.png')); png(512, os.path.join(OUT, 'evovive-512.png'))
png(512, os.path.join(OUT, 'evovive-512-maskable.png'), maskable=True)
png(180, os.path.join(OUT, 'evovive-apple-touch.png'), maskable=True)
png(32, os.path.join(OUT, 'evovive-32.png')); png(16, os.path.join(OUT, 'evovive-16.png'))
svg(os.path.join(OUT, 'evovive.svg'))
print('Icons erzeugt in', os.path.abspath(OUT))
