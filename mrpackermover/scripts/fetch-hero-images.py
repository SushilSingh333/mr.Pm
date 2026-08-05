#!/usr/bin/env python3
"""
Fetch real, free-to-use hero photos from Wikimedia (via the Wikipedia PageImages
API) and self-host them under apps/web/public/images/hero/.

- City heroes use that city's famous landmark (India Gate, Gateway of India, ...).
- Service/home/route heroes use a relevant subject (moving truck, warehouse, ...).

Wikimedia content is free to use with attribution (mostly CC-BY-SA / public domain).
For production, keep the attributions in docs/ATTRIBUTIONS.md and let Cloudflare
Images optimise delivery. Run: python scripts/fetch-hero-images.py
"""
import json
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8")  # avoid Windows cp1252 console errors
except Exception:  # noqa: BLE001
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO_DIR = os.path.join(ROOT, "apps", "web", "public", "images", "hero")
CITY_DIR = os.path.join(HERO_DIR, "cities")
UA = "MrPackerMover/0.1 (dev asset fetch; contact alok@aajneeti.social)"
CTX = ssl.create_default_context()

# output slug -> ordered candidate Wikipedia titles (first with a photo wins)
THEMES = {
    "moving": ["Truck", "Semi-trailer truck", "Moving company"],
    "office": ["Office", "Cubicle"],
    "car": ["Car carrier trailer", "Auto transport"],
    "bike": ["Motorcycle", "Scooter (motorcycle)"],
    "storage": ["Warehouse", "Self storage"],
    "globe": ["Air cargo", "Container ship"],
    "route": ["Yamuna Expressway", "Golden Quadrilateral", "Expressways in India"],
}
CITIES = {
    "delhi": ["India Gate"],
    "gurgaon": ["Kingdom of Dreams", "Gurgaon"],
    "noida": ["Noida", "Okhla Bird Sanctuary"],
    "mumbai": ["Gateway of India"],
    "bengaluru": ["Vidhana Soudha"],
    "pune": ["Shaniwar Wada"],
    "hyderabad": ["Charminar"],
    "chennai": ["Marina Beach", "Kapaleeshwarar Temple"],
}
ATTRIB_TITLE_BY_FILE = {}


def api_thumbnail(title: str, size: int = 1600):
    q = urllib.parse.urlencode(
        {
            "action": "query",
            "titles": title,
            "prop": "pageimages",
            "piprop": "thumbnail|name",
            "pithumbsize": size,
            "format": "json",
        }
    )
    url = f"https://en.wikipedia.org/w/api.php?{q}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=CTX, timeout=30) as r:
        data = json.load(r)
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        thumb = page.get("thumbnail", {}).get("source")
        if thumb:
            return thumb.split("?")[0]  # strip tracking params
    return None


def download(url: str, dest: str) -> int:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=CTX, timeout=60) as r:
        blob = r.read()
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as f:
        f.write(blob)
    return len(blob)


def fetch(slug: str, titles, out_dir: str):
    dest = os.path.join(out_dir, f"{slug}.jpg")
    for title in titles:
        try:
            thumb = api_thumbnail(title)
            if not thumb:
                continue
            size = download(thumb, dest)
            if size > 8000:
                ATTRIB_TITLE_BY_FILE[os.path.relpath(dest, ROOT)] = (title, thumb)
                print(f"  [ok] {slug:12s} <- {title}  ({size // 1024} KB)")
                return True
        except Exception as e:  # noqa: BLE001
            print(f"    …{title!r} failed: {e}")
        time.sleep(0.3)
    print(f"  [--] {slug}: no image found")
    return False


def main():
    print("Themes:")
    for slug, titles in THEMES.items():
        fetch(slug, titles, HERO_DIR)
    print("Cities:")
    for slug, titles in CITIES.items():
        fetch(slug, titles, CITY_DIR)

    # Write attributions for production compliance.
    lines = ["# Hero image attributions", "", "Source: Wikimedia Commons (via Wikipedia PageImages).", ""]
    for rel, (title, url) in sorted(ATTRIB_TITLE_BY_FILE.items()):
        lines.append(f"- `{rel}` — {title} — {url}")
    with open(os.path.join(ROOT, "docs", "ATTRIBUTIONS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"\nWrote docs/ATTRIBUTIONS.md ({len(ATTRIB_TITLE_BY_FILE)} images)")


if __name__ == "__main__":
    main()
