"""Generate the four branded downloads from the site's canonical recipe data."""
import json
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/recipes/pdf"
OUT.mkdir(parents=True, exist_ok=True)
recipes = json.loads(subprocess.check_output([
    "node", "--experimental-strip-types", "--input-type=module", "-e",
    "import {recipes} from './lib/lif-content.ts'; console.log(JSON.stringify(recipes));",
], cwd=ROOT, text=True))

for name, filename in [("Champ", "Champ-Black.ttf"), ("Poppins", "Poppins-Regular.ttf"), ("PoppinsBold", "Poppins-Bold.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(ROOT / "public/fonts" / filename)))

INK = colors.HexColor("#10381f")
GREEN = colors.HexColor("#00943b")
YELLOW = colors.HexColor("#fdd825")
W, H = A4
MARGIN = 36
BODY = ParagraphStyle("body", fontName="Poppins", fontSize=11, leading=16, textColor=INK)
TITLE = ParagraphStyle("title", fontName="Champ", fontSize=25, leading=27, textColor=INK)
SECTION = ParagraphStyle("section", fontName="Champ", fontSize=17, leading=21, textColor=GREEN)
SMALL = ParagraphStyle("small", fontName="Poppins", fontSize=8.5, leading=12, textColor=INK)


def paragraph(canvas, text, x, top, width, style=BODY):
    block = Paragraph(escape(text), style)
    _, height = block.wrap(width, H)
    block.drawOn(canvas, x, top - height)
    return top - height


def draw_image(canvas, filename, x, y, width, height):
    with Image.open(filename) as image:
        scale = min(width / image.width, height / image.height)
        iw, ih = image.width * scale, image.height * scale
        canvas.drawImage(ImageReader(image), x + (width-iw)/2, y + (height-ih)/2, iw, ih, mask="auto")


for recipe in recipes:
    output = OUT / f"{recipe['slug']}.pdf"
    canvas = Canvas(str(output), pagesize=A4, pageCompression=1, invariant=1)
    canvas.setTitle(recipe["title"] + " | Recetario LIF")
    canvas.setAuthor("LIF")
    canvas.setSubject("Receta completa: ingredientes y preparación")
    canvas.setFillColor(GREEN)
    canvas.rect(0, H-10, W, 10, stroke=0, fill=1)
    draw_image(canvas, ROOT / "public/lif-logo.png", MARGIN-7, H-91, 109, 68)
    canvas.setFillColor(GREEN)
    canvas.setFont("PoppinsBold", 10)
    canvas.drawRightString(W-MARGIN, H-53, "RECETARIO LIF")
    title_bottom = paragraph(canvas, recipe["title"], MARGIN, H-120, 315, TITLE)
    title_bottom = paragraph(canvas, recipe["flavor"], MARGIN, title_bottom-15, 305, SMALL)
    title_bottom = paragraph(canvas, recipe["yield"], MARGIN, title_bottom-10, 305, SMALL)
    if recipe.get("prepTime"):
        title_bottom = paragraph(canvas, recipe["prepTime"], MARGIN, title_bottom-7, 305, SMALL)
    if recipe.get("note"):
        title_bottom = paragraph(canvas, recipe["note"], MARGIN, title_bottom-9, 305, SMALL)
    if recipe.get("image"):
        draw_image(canvas, ROOT / "public" / recipe["image"].lstrip("/"), W-215, H-284, 195, 175)
    top = min(H-310, title_bottom-32)
    canvas.setStrokeColor(YELLOW)
    canvas.setLineWidth(4)
    canvas.line(MARGIN, top+15, W-MARGIN, top+15)
    left_width = 167
    right_x = MARGIN + left_width + 27
    right_width = W - MARGIN - right_x
    left = paragraph(canvas, "Lo que necesitás", MARGIN, top, left_width, SECTION)-17
    for item in recipe["ingredients"]:
        canvas.setFillColor(GREEN)
        canvas.circle(MARGIN+2, left-6, 1.6, stroke=0, fill=1)
        left = paragraph(canvas, item, MARGIN+12, left, left_width-12)-9
    right = paragraph(canvas, "Preparación", right_x, top, right_width, SECTION)-17
    for index, item in enumerate(recipe["preparation"], 1):
        canvas.setFillColor(GREEN)
        canvas.setFont("PoppinsBold", 11)
        canvas.drawString(right_x, right-11, f"{index}.")
        right = paragraph(canvas, item, right_x+18, right, right_width-18)-10
    if min(left, right) < 58:
        raise ValueError(f"Recipe content exceeds the page: {recipe['slug']}")
    canvas.setFillColor(GREEN)
    canvas.rect(0, 0, W, 36, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("PoppinsBold", 9)
    canvas.drawString(MARGIN, 14, "Cambiá el sabor de tu día.")
    canvas.setFont("Poppins", 8)
    canvas.drawRightString(W-MARGIN, 14, "LIF  |  lif.cr")
    canvas.showPage()
    canvas.save()
    print(json.dumps({"file": str(output.relative_to(ROOT)), "pages": 1, "contentBottom": round(min(left, right), 1)}))
