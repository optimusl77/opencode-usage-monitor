# opencode-usage-monitor

OpenCode TUI sidebar section showing your **OpenCode Go** usage limits at a glance: the 5-hour window, the weekly limit, and the monthly allowance.

```text
Usage
5h        ░░░░░░░░░░ 1%
Weekly    ████░░░░░░ 42%
Monthly   ██░░░░░░░░ 21%
```

The section is rendered between **Context** and **MCP** in the right-hand sidebar. It replaces OpenCode's built-in `Limit` section to keep that position.

## Features

- Three meters: `5h` (rolling), `Weekly`, `Monthly`
- Percentage **used** plus a compact 10-cell bar
- Normal color below 80%, warning color from 80%, error color at the limit
- Refreshes on plugin load, after every successful turn, and every 60 seconds
- No configuration required; colors come from the active OpenCode theme

## Requirements

- OpenCode **2.3.2** or newer (tested with 2.3.2)
- An **OpenCode Go** subscription with a signed-in Console workspace

The plugin reads the experimental `GET /api/experimental/usage/limits` endpoint via OpenCode's TUI data context. If that endpoint or the internal `context.data.location.usage` API changes, the section will disappear until the plugin is updated.

## Install

### Option 1: local plugin (recommended)

Copy `src/tui.tsx` into the global OpenCode plugin directory:

```sh
mkdir -p ~/.config/opencode/plugins/usage
cp src/tui.tsx ~/.config/opencode/plugins/usage/tui.tsx
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.config\opencode\plugins\usage"
Copy-Item .\src\tui.tsx "$env:USERPROFILE\.config\opencode\plugins\usage\tui.tsx"
```

OpenCode watches the plugin directory. The section appears automatically, or after `/reload`.

### Option 2: install as a package

```sh
cd ~/.config/opencode
npm install github:optimusl77/opencode-usage-monitor
```

Then add it to `~/.config/opencode/cli.json`:

```json
{
  "plugins": ["opencode-usage-monitor"]
}
```

## How it works

The plugin registers a contribution to the `sidebar.content` slot. It takes over the plugin ID of OpenCode's built-in `Limit` section (`opencode.sidebar.limit`) so the contribution keeps the built-in position between Context and MCP.

Usage data is read from `context.data.location.usage`:

- `go.rolling` — 5-hour window (`percent`, `limited`, `resetsAt`)
- `go.weekly` — weekly window
- `go.monthly` — monthly allowance

Refresh triggers:

- once during plugin setup
- after every `session.execution.succeeded` event
- every 60 seconds

Failed or interrupted turns are picked up by the next periodic refresh.

## Configuration

The defaults live at the top of `src/tui.tsx`:

| Constant | Default | Purpose |
| --- | --- | --- |
| `REFRESH_INTERVAL_MS` | `60000` | Periodic refresh interval |
| `WARN_PERCENT` | `80` | Percentage at which the warning color starts |
| `BAR_WIDTH` | `10` | Number of cells in the meter bar |

There is no runtime config file.

## Development

There is no build step; OpenCode transpiles the TSX entrypoint at runtime.

1. Clone the repository.
2. Copy or symlink `src/tui.tsx` into `~/.config/opencode/plugins/usage/tui.tsx`.
3. Edit the source and let OpenCode reload the plugin, or run `/reload`.

## Notes

- This is an unofficial community plugin and is not affiliated with OpenCode.
- The usage endpoint is experimental and may change without notice.
- The plugin only displays data; it does not change limits or billing.
- If the built-in `opencode.sidebar.limit` section is removed in a future OpenCode release, the section still renders, but it may appear at the end of the sidebar instead of between Context and MCP.

## License

MIT
