from pathlib import Path

root = Path(__file__).resolve().parent
dist_dir = root / "frontend" / "dist"
assets_dir = dist_dir / "assets"
html = (dist_dir / "index.html").read_text(encoding="utf-8")
css_path = next(assets_dir.glob("index-*.css"))
js_path = next(assets_dir.glob("index-*.js"))
css = css_path.read_text(encoding="utf-8")
js = js_path.read_text(encoding="utf-8")

html = html.replace(
    f'<script type="module" crossorigin src="/assets/{js_path.name}"></script>',
    f'<script type="module">{js}</script>',
)
html = html.replace(
    f'<link rel="stylesheet" crossorigin href="/assets/{css_path.name}">',
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
