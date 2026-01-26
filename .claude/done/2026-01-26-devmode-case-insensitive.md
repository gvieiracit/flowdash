# DevMode URL Parameter Case-Insensitive

**Completed:** 2026-01-26
**PR:** [#11](https://github.com/gvieiracit/flowdash/pull/11)
**Commit:** [f8e7d59d](https://github.com/gvieiracit/flowdash/commit/f8e7d59d)

## What was delivered

The `devMode` URL parameter now accepts any case variation for both the parameter name and value.

## Why it matters

Previously, users had to use the exact casing `?devMode=true` to enable dev mode. This was confusing and error-prone since different users might type `?DevMode=True`, `?DEVMODE=TRUE`, or `?devmode=true`. Now all variations work, improving usability.

## How to use

Add the devMode parameter to the URL in any case format:
- `https://your-app-url/?devMode=true`
- `https://your-app-url/?DevMode=True`
- `https://your-app-url/?DEVMODE=TRUE`
- `https://your-app-url/?devmode=true`

## Behavior

| URL Parameter | Result |
|---------------|--------|
| `?devMode=true` | Dev mode enabled |
| `?DevMode=True` | Dev mode enabled |
| `?DEVMODE=TRUE` | Dev mode enabled |
| `?devmode=true` | Dev mode enabled |
| `?devMode=false` | Dev mode disabled |
| (no parameter) | Dev mode disabled |
