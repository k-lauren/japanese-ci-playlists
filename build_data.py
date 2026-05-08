#!/usr/bin/env python3
"""Build data.js with tags for in-site filtering."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
src = json.loads((ROOT / "ci_top300.json").read_text())
playlists = json.loads((ROOT / "playlists.json").read_text())


def dur_seconds(iso):
    m = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    h, mn, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mn * 60 + s


def fmt_dur(s):
    h, r = divmod(s, 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def length_bucket(s):
    if s < 5 * 60:
        return "short"
    if s < 15 * 60:
        return "medium"
    if s < 30 * 60:
        return "long"
    return "very-long"


JLPT_RX = [
    (re.compile(r"\bN1\b", re.I), "N1"),
    (re.compile(r"\bN2\b", re.I), "N2"),
    (re.compile(r"\bN3\b", re.I), "N3"),
    (re.compile(r"\bN4\b", re.I), "N4"),
    (re.compile(r"\bN5\b", re.I), "N5"),
]

FORMAT_RULES = [
    (re.compile(r"podcast|ポッドキャスト", re.I), "podcast"),
    (re.compile(r"\bvlog\b|vlog|旅行|旅 ", re.I), "vlog"),
    (re.compile(r"interview|インタビュー", re.I), "interview"),
    (re.compile(r"conversation|会話|talking|chat", re.I), "conversation"),
    (re.compile(r"reading|本|book|story|物語|fairy|tale", re.I), "story-reading"),
    (re.compile(r"grammar|particle|verb|文法", re.I), "grammar-lesson"),
    (re.compile(r"vocab|word|語彙", re.I), "vocab-lesson"),
    (re.compile(r"culture|food|recipe|料理|文化", re.I), "culture"),
    (re.compile(r"news|ニュース", re.I), "news"),
]


def jlpt(title):
    for rx, lvl in JLPT_RX:
        if rx.search(title):
            return lvl
    return None


def fmt(title):
    for rx, label in FORMAT_RULES:
        if rx.search(title):
            return label
    return "lesson"


def has_english(title):
    return bool(re.search(r"\beng(\.|lish)?( sub)?|\[?eng sub\]?", title, re.I))


slim = {}
for level, lst in src.items():
    out = []
    for v in lst:
        secs = dur_seconds(v["duration"])
        title = v["title"]
        out.append({
            "id": v["id"],
            "title": title,
            "channel": v["channel_title"],
            "channel_id": v["channel_id"],
            "views": v["views"],
            "duration_s": secs,
            "duration": fmt_dur(secs),
            "published": v["published_at"][:10],
            "tags": {
                "jlpt": jlpt(title),
                "format": fmt(title),
                "length": length_bucket(secs),
                "english_subs": has_english(title),
            },
        })
    slim[level] = out

site_data = {
    "playlists": playlists,
    "videos": slim,
    "channels": sorted({v["channel"] for lst in slim.values() for v in lst}),
}

(ROOT / "site" / "data.js").write_text(
    "window.SITE_DATA = " + json.dumps(site_data, ensure_ascii=False) + ";\n"
)
print("Wrote site/data.js")
print({k: len(v) for k, v in slim.items()})
# Tag stats
from collections import Counter
for level in ["beginner", "intermediate", "advanced"]:
    print(f"\n{level}:")
    for tag in ["jlpt", "format", "length"]:
        c = Counter(v["tags"][tag] for v in slim[level])
        print(f"  {tag}: {dict(c)}")
