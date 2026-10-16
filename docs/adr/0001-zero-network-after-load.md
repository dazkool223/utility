# Zero network requests after the app has loaded

The product's core promise is that nothing a user puts into a Tool ever leaves their device. We enforce this with the browser rather than relying on policy: the deployed Content-Security-Policy blocks all outbound connections (`connect-src` limited to our own origin for fetching Heavy Tool engines, nothing else), and CI fails any test run in which a Tool makes a network request.

## Consequences

- No analytics, error reporting (e.g. Sentry), or third-party CDNs, including the hosting provider's built-in analytics.
- Tools that inherently need the network (DNS lookup, WHOIS, remote SSL checks, fetch-from-URL) are permanently out of scope.
- Heavy Tool engines (ffmpeg.wasm, OCR models) are self-hosted on our origin, never loaded from a CDN.
