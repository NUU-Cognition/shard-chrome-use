# Chrome Use

Drive the operator's real, already-signed-in Chrome with the chrome-use CLI — one browser session per Orbh session, shared with the human at the keyboard

## Structure

```
Shards/(Dev Local) Chrome Use/
  shard.yaml                    # Manifest (not prefixed)
  RELEASE.md                    # Optional release changelog (not prefixed)
  dev-init-cu.md      # Init file — shard context
  dev-hinit-cu.md     # Optional headless init
  dev-setup-cu.md    # One-time setup guide
  skills/                       # dev-sk-cu-{name}.md
  workflows/                    # dev-wkfl-cu-{name}.md, dev-hwkfl-cu-{name}.md
  templates/                    # dev-tmp-cu-{name}-v<X.Y>.md
  knowledge/                    # dev-knw-cu-{name}.md
  assets/                       # dev-ast-cu-{name}.{ext}
  install/                      # type-cu-{name}.md (NOT prefixed)
  migrations/                   # dev-mig-cu-{from}-to-{to}.md
  scripts/                      # dev-{name}.js
```
