# Japanese CI Library

A curated, view-ranked, tag-filterable index of the most-watched videos in Japanese Comprehensible Input — built for an independent study in Language Autopedagogy (Japanese).

**Live site:** https://k-lauren.github.io/japanese-ci-playlists/

## What this is

300 videos across three levels (Beginner / Intermediate / Advanced), pulled from eleven established Japanese CI channels and ranked by view count with a per-channel cap of 35 to keep the lists diverse. Videos are tagged for JLPT level, format, length, and English subtitle availability.

## How it was built

1. **Channel-anchored seed list** — eleven established Japanese CI channels (vs. broad keyword search, which produces noise).
2. **Full upload pull** via the YouTube Data API — ~9,000 candidate videos.
3. **Two-pass level classification** — title-based JLPT/keyword override, channel-default fallback.
4. **Ranking + per-channel cap** — top 100 per bucket, max 35 from any single channel.
5. **Six YouTube playlists** (50 each) created via YouTube's internal playlist API.

See [the about page](about.html) for full methodology.

## Stack

- Vanilla HTML / CSS / JS — no build step
- YouTube Data API v3 (search, channels, playlistItems, videos)
- YouTube internal innertube API (playlist creation)
- Python for ranking + tag derivation
- GitHub Pages

## License

The site code is MIT. Video content belongs to the respective creators.
