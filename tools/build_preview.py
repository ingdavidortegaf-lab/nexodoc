#!/usr/bin/env python3
"""Arma la vista previa estática (design/build/nexodoc-preview.html) desde las mismas fuentes que el código."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
B = ROOT / "design" / "build"
assets = json.loads((B / "assets.json").read_text(encoding="utf-8"))
content = (B / "content.json").read_text(encoding="utf-8")
safe = lambda s: s.replace("</", "<\\/")
html = (ROOT / "design" / "preview.template.html").read_text(encoding="utf-8")
html = (html.replace("__SYMBOLS__", assets["symbols"])
            .replace("__HERO__", assets["hero"])
            .replace("__DATA__", safe(content))
            .replace("__MAP__", safe(json.dumps(assets["map"], ensure_ascii=False))))
out = B / "nexodoc-preview.html"
out.write_text(html, encoding="utf-8")
print(out, f"{len(html)/1024:.0f} KB")
