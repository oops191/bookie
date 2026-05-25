"""Scan posts/*.md and generate posts/index.json."""

import json, os, re, glob

POSTS_DIR = os.path.join(os.path.dirname(__file__), "posts")
OUTPUT = os.path.join(POSTS_DIR, "index.json")

posts = []

for filepath in sorted(glob.glob(os.path.join(POSTS_DIR, "*.md"))):
    slug = os.path.splitext(os.path.basename(filepath))[0]
    with open(filepath, encoding="utf-8") as f:
        md = f.read()

    # Title: first # heading
    title = ""
    for line in md.split("\n"):
        line = line.strip()
        if line.startswith("# "):
            title = line[2:].strip()
            break

    # Date: from <!-- date: YYYY-MM-DD --> comment
    date = ""
    m = re.search(r"<!--\s*date:\s*(\d{4}-\d{2}-\d{2})\s*-->", md)
    if m:
        date = m.group(1)

    # Summary: first non-empty paragraph after title
    summary = ""
    lines = md.split("\n")
    in_content = False
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith("# "):
            in_content = True
            continue
        if line.startswith("<!--"):
            continue
        if line.startswith("```"):
            continue
        if in_content and line and not line.startswith("#") and not line.startswith(">") and not line.startswith("-") and not line.startswith("|"):
            summary = re.sub(r"[*_`~#\[\]()]", "", line).strip()
            if len(summary) > 150:
                summary = summary[:150] + "..."
            break

    posts.append({
        "slug": slug,
        "title": title or slug,
        "date": date,
        "summary": summary
    })

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print(f"Generated {OUTPUT} with {len(posts)} posts")
for p in posts:
    print(f"  {p['slug']}: {p['title']} ({p['date']})")