# web-search

Give coding agents free local web search through the browser already installed on your machine.

The skill keeps a headless browser available as a local daemon, uses real search engines, and lets agents visit selected results. Pages are rendered with JavaScript, reduced to readable content, and returned as clean Markdown for efficient agent context. Using a real, persistent browser also reduces bot-detection failures compared with ordinary HTTP requests.

## Install

```bash
npx skills add ogulcancelik/agent-skills --skill web-search
```

The agent installs dependencies with Bun when needed. Node.js 20.19 or newer and a Chromium-family browser are required.

## What it provides

- Search through Google with a DuckDuckGo fallback
- Visit individual search results or arbitrary URLs
- Render JavaScript-heavy pages before extraction
- Return readable Markdown instead of raw HTML
- Reuse a warm local browser daemon across requests
- Reduce failures on sites that reject basic HTTP fetchers

## CLI

```bash
./web-search.js "query"
./web-search.js "query" -n 10
./web-search.js --from <result-set-id> --fetch 1,3,5
./web-search.js --url https://example.com
./web-search.js --url https://example.com --full
```

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `WEB_SEARCH_BROWSER_BIN` | Override the browser executable | Auto-detected |
| `WEB_SEARCH_USER_AGENT` | Override the browser user agent | Browser-derived |
| `WEB_SEARCH_DAEMON_PORT` | Local daemon port | `9377` |
| `WEB_SEARCH_CDP_PORT` | Chrome DevTools port | `9225` |
| `WEB_SEARCH_DEBUG_DUMP` | Save debugging artifacts after failures | Disabled |

The CLI supports Linux, macOS, and Windows and detects Chrome, Brave, Edge, or Chromium in common installation locations.

## License

MIT
