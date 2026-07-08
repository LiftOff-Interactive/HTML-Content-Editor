# Security Policy

## Reporting a vulnerability

Please open a private security advisory on GitHub
(**Security → Advisories → Report a vulnerability** on the repository), or, if
that is unavailable, open an issue titled "Security report" *without* details
and a maintainer will follow up privately.

## Scope and threat model

This is a fully client-side authoring tool — there is no backend, no account
system, and no data leaves the browser. The security-relevant surfaces are:

1. **HTML import** (`src/html-import.js`) — third-party files are sanitized at
   the element level (script/iframe/object/embed/meta and friends removed),
   URL schemes are vetted after control-character stripping, and CSS
   `@import` is stripped from captured styles.
2. **Exported documents** (`src/export.js`) — rich-text widget fields are
   sanitized at export time; `</` sequences in re-emitted CSS are escaped;
   link hrefs pass an allowlist (`https/http/mailto/tel/#/relative`).
3. **The no-JS SharePoint export** — must contain zero `<script>`, `on*`
   handlers, or `javascript:` URLs; this is enforced by `_nojs_tests.html`
   and `_nojs_selftest.html` plus a byte-exact baseline hash.
4. **SCORM packages** (`src/scorm.js`) — the injected runtime only talks to
   the standard SCORM 1.2 `window.API` object; it makes no network calls.

Regressions in any of these are security bugs — please report them.
