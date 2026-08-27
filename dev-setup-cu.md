# Setup Chrome Use

One-time, per-machine setup: install the `chrome-use` CLI, connect it to the operator's Chrome, and confirm the relay is up. There is nothing to configure in the workspace.

This setup touches the operator's own browser. Step 2 needs a human click in Chrome. Ask for it; do not try to work around it.

# Prerequisites

- Google Chrome installed, and the operator signed in to it
- Network access to GitHub Releases and the Chrome Web Store
- The operator available for one click in Chrome

# Actions

1. **Install the CLI.**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/leeguooooo/chrome-use/main/install.sh | sh
   ```
   This downloads the prebuilt binary for the platform and installs `chrome-use` plus the `abs` alias. It also installs the agent skill; pass `AGENT_BROWSER_NO_SKILL=1` to skip that.

   If `which -a chrome-use` shows more than one copy, remove the stale one (`npm rm -g chrome-use`) so the installed build wins.

2. **Install the Chrome extension.** Ask the operator to add it from the Chrome Web Store — one click:

   <https://chromewebstore.google.com/detail/chrome-use/knfcmbamhjmaonkfnjhldjedeobeafmk>

   Prefer the Store build. A load-unpacked extension can be disabled when Chrome restarts.

3. **Register the native-messaging host.**
   ```bash
   chrome-use extension install --no-profile
   ```
   `--no-profile` skips the macOS configuration profile. Approving that profile puts Chrome in "managed by your organization" mode, which locks the secure-DNS setting and removes the extension's manual update and remove buttons. Install it without the profile unless the operator asks for the silent all-profiles policy.

4. **Confirm the relay is up.**
   ```bash
   chrome-use status
   ```
   Expect `Extension relay: up` and an `extension: live <version>, expected <version>` line where the two versions match. If the relay is down, run `chrome-use extension connect` and check again.

5. **Mark setup complete.**
   ```bash
   flint shard setup cu --complete
   ```

# Verification

- `chrome-use --version` prints a version.
- `chrome-use status` reports `Extension relay: up` with matching live and expected extension versions.
- `chrome-use browsers` lists at least one connected Chrome profile.
- `flint shard cu session list` runs and reports the live sessions (none on a fresh machine).
