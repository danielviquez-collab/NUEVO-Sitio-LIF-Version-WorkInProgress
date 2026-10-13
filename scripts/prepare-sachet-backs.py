"""Prepare supplied package backs for the local catalog without changing originals."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("inventory", type=Path, help="INVENTARIO.json from the original 13-back package")
parser.add_argument("--only", nargs="+", help="Replace only these slugs; keep the remaining web assets intact")
args = parser.parse_args()
inventory = json.loads(args.inventory.read_text(encoding="utf-8"))["inventory"]
output = ROOT / "public/products/backs"
output.mkdir(parents=True, exist_ok=True)
results = []

for item in inventory:
    slug = item.get("slug") or Path(item["file"]).name.split("_", 2)[1]
    if args.only and slug not in args.only:
        continue
    front_path = ROOT / "public/products" / f"{slug}.webp"
    if not front_path.is_file():
        front_path = front_path.with_suffix(".png")
    with Image.open(front_path) as front:
        front_size = front.size
    source = args.inventory.parent / item["file"]
    if not source.is_file():
        source = Path(item["source"])
    with source.open("rb") as stream:
        assert hashlib.file_digest(stream, "sha256").hexdigest() == item["sha256"], f"Source changed: {slug}"
    with Image.open(source) as original:
        image = original.convert("RGBA")
        source_size = image.size
    image.thumbnail((2250, 2250), Image.Resampling.LANCZOS)

    if image.getchannel("A").getextrema()[0] == 255:
        # Remove only the uniform background connected to the outside, never the label.
        rgb = np.asarray(image)[:, :, :3]
        background = rgb[0, 0].astype(np.int16)
        if np.min(background) >= 245:
            exterior = np.min(rgb, axis=2) >= 245
        else:
            corners = rgb[[0, 0, -1, -1], [0, -1, 0, -1]].astype(np.int16)
            assert np.max(np.abs(corners - background)) <= 6, f"Nonuniform source background: {slug}"
            exterior = np.max(np.abs(rgb.astype(np.int16) - background), axis=2) <= 6
        candidate = Image.fromarray(exterior.astype(np.uint8) * 255).copy()
        for corner in [(0, 0), (candidate.width - 1, 0), (0, candidate.height - 1), (candidate.width - 1, candidate.height - 1)]:
            if candidate.getpixel(corner) == 255:
                ImageDraw.floodfill(candidate, corner, 128)
        matte = Image.fromarray(np.where(np.asarray(candidate) == 128, 0, 255).astype(np.uint8))
        image.putalpha(matte)

    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"Empty artwork: {slug}")
    cropped = image.crop(bounds)
    canvas_size = (round(1500 * front_size[0] / front_size[1]), 1500)
    scale = min((canvas_size[0] - 8) / cropped.width, (canvas_size[1] - 8) / cropped.height)
    cropped = cropped.resize((round(cropped.width * scale), round(cropped.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", canvas_size)
    canvas.alpha_composite(cropped, ((canvas.width - cropped.width) // 2, (canvas.height - cropped.height) // 2))
    destination = output / f"{slug}.webp"
    canvas.save(destination, "WEBP", lossless=True, method=6)
    with Image.open(destination) as check:
        assert check.size == canvas_size
        assert check.convert("RGBA").getchannel("A").getextrema()[0] == 0
    result = {"slug": slug, "medium": "photo" if item["kind"] == "Foto" else "render", "source": item["source"],
              "sourceSize": source_size, "image": f"/products/backs/{slug}.webp", "size": canvas_size,
              "cropAt2250": bounds, "bytes": destination.stat().st_size}
    results.append(result)
    print(json.dumps(result, ensure_ascii=False), flush=True)

assert len(results) == (len(args.only) if args.only else 13)
report = ROOT / "work/lif-backs-audit-2026-10-12/web-assets.json"
report.parent.mkdir(parents=True, exist_ok=True)
if args.only and report.is_file():
    previous = {item["slug"]: item for item in json.loads(report.read_text(encoding="utf-8"))}
    previous.update({item["slug"]: item for item in results})
    results = list(previous.values())
report.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
