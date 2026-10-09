All data inside the HTML is synthetically generated, nothing is extracted from any data vendor/company. This is only a demo version of what I have vibecoded in the past (shell only).

## Run

Open `index.html`. It is fully self-contained; Excel, charts and map tiles load from a CDN on demand.

URL options: `?nosplash` skips the splash screen, `?motion` forces the full splash animation when the OS asks for reduced motion.

## Edit

`index.html` is built from `src/`:

```
node build.js
```

| Path | What it holds |
|---|---|
| `src/tools.js` | Menu groups, tool titles, About text and sample output |
| `src/shell.html/.css/.js` | App bar, menu, tool header, About panel, router |
| `src/page.css` | Shared look injected into every tool page |
| `src/pages/*.html` | One file per tool: its mock back-end and UI |
| `src/core.js` | In-browser mock server shared by all pages |
| `src/fsa-geo.js` | Synthetic Ontario FSA boundaries |
| `src/splash.*` | Splash screen |
