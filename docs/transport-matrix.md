# Bunjang CLI Transport Matrix

| Capability | Browser transport | API transport | Notes |
|---|---|---|---|
| Auth bootstrap | ✅ | ❌ | Initial login always headful browser |
| Session status | ✅ | ⚠️ | API can only infer if separately configured |
| Search | ✅ | ⚠️ optional | Browser path is the default public search transport |
| Item detail | ✅ | ✅ public | API/detail transport can enrich product detail via public description endpoint |
| Chat list/read/send | ⚠️ heuristic | ❌ | Browser path depends on logged-in UI selectors |
| Favorites | ⚠️ heuristic | ❌ | Browser path uses UI controls |
| Purchase prepare/start | ⚠️ heuristic stop-point | ❌ | Stops before final confirmation |

Current public filter support:
- `--price-min`
- `--price-max`

Decision rule:
- Prefer API for `item` detail enrichment and browser for public search unless a stronger API path is later proven.
- Otherwise, fall back to browser transport and keep the public CLI contract unchanged.
