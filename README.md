# codex-usage-status

Codex CLI usage bars for the terminal. It reads the latest `token_count` event
from `~/.codex/sessions` and renders three horizontal bars:

- `5h`: primary Codex rate-limit window, usually 300 minutes.
- `Week`: secondary Codex rate-limit window, usually 10080 minutes.
- `Ctx`: current context tokens versus the model context window.

Default colors:

- `5h`: orange
- `Week`: blue
- `Ctx`: green
- any bar turns yellow above 80% and red above 95%

## Use

Run once:

```powershell
node .\src\cli.js status
```

On Windows, you can also use the included command script:

```powershell
.\codex-status.cmd status
```

Watch in place:

```powershell
node .\src\cli.js watch
```

Launch Codex through the wrapper:

```powershell
node .\src\cli.js run
```

or:

```powershell
.\codex-status.cmd run
```

Pass Codex arguments after `run`:

```powershell
node .\src\cli.js run --model gpt-5.5 --cd F:\projects
```

## Options

```text
--width N       bar width, default 20
--interval MS   refresh interval, default 2000
--ascii         use # and - instead of Unicode blocks
--no-color      disable ANSI colors
--one-line      compact output for watch/status
--title         wrapper mode only: update terminal title without writing a status line
```

## Notes

This project does not patch the Codex binary or modify the global npm package.
The wrapper starts the installed Codex CLI and monitors the session jsonl files
that Codex already writes locally.
