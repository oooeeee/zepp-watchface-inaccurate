#!/usr/bin/env python3
"""Render store and watch previews (needs Pillow and Node).

Usage: python3 tools/render_preview.py

Mirrors the layout in watchface/index.js (keep ROWS and the battery bar in sync
with it) and takes the texts from utils/fuzzy.js. The watch draws with its
system font; Roboto is a close stand-in, so the previews are approximate.
"""
import json
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'tools', 'fonts', 'Roboto.ttf')
ICON = os.path.join(ROOT, 'assets', '390x450-amazfit-bip-6', 'icon.png')

# (y, h) of each text row, as ROWS in watchface/index.js
ROWS = [(20, 44), (130, 76), (206, 76), (284, 100)]
INFO, TIME = (0xb0, 0xb0, 0xb0), (0xff, 0xff, 0xff)
BATTERY = (0x33, 0xdd, 0x55)
BAR = (150, 10, 90, 6)  # x, y, w, h of the battery outline

# Sample: Saturday 3rd, 10:27, battery 70 %
SAMPLE = {'hour': 10, 'minute': 27, 'day': 6, 'date': 3, 'battery': 70}


def render(lang):
    s = SAMPLE
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'sample_texts.mjs'), lang,
                          str(s['hour']), str(s['minute']), str(s['day']), str(s['date'])],
                         check=True, capture_output=True, text=True).stdout
    rows = json.loads(out)
    img = Image.new('RGB', (390, 450), 'black')
    d = ImageDraw.Draw(img)
    for i, ((y, h), row) in enumerate(zip(ROWS, rows)):
        if row['text']:
            f = ImageFont.truetype(FONT, row['size'])
            f.set_variation_by_axes([400, 100])
            d.text((195, y + h / 2), row['text'], font=f, fill=INFO if i == 0 else TIME, anchor='mm')
    x, y, w, h = BAR
    d.rounded_rectangle((x, y, x + w - 1, y + h - 1), radius=3, outline=BATTERY, width=1)
    d.rectangle((x + 1, y + 1, x + 1 + round((w - 2) * s['battery'] / 100) - 1, y + h - 2), fill=BATTERY)
    return img


def main():
    for lang in ('en', 'ru'):
        img = render(lang)
        img.save(os.path.join(ROOT, 'tools', f'preview-{lang}.png'))
        if lang == 'en':
            # 266x307 is the previewSize for 390x450 screens in the zeus device list
            img.resize((266, 307), Image.LANCZOS).save(ICON)


if __name__ == '__main__':
    main()
