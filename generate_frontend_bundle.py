from pathlib import Path

root = Path(__file__).resolve().parent
html = (root / "frontend" / "dist" / "index.html").read_text(encoding="utf-8")
css = (root / "frontend" / "dist" / "assets" / "index-CGz98yBe.css").read_text(encoding="utf-8")
js = (root / "frontend" / "dist" / "assets" / "index-DAz_a8Ry.js").read_text(encoding="utf-8")

html = html.replace(
    '<script type="module" crossorigin src="/assets/index-DAz_a8Ry.js"></script>',
    f'<script type="module">{js}</script>',
)
html = html.replace(
    '<link rel="stylesheet" crossorigin href="/assets/index-CGz98yBe.css">',
    f"<style>{css}</style>",
)
html = html.replace(
    '<link rel="icon" type="image/svg+xml" href="/vite.svg" />',
    "",
)

(root / "app" / "frontend_bundle.py").write_text(
    "FRONTEND_HTML = " + repr(html) + "\n",
    encoding="utf-8",
)
