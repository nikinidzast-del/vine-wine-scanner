import type { VercelRequest, VercelResponse } from '@vercel/node';

const TERMS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Terms of Service - Vino Scanner</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e0d5c7; background: #0a0808; max-width: 680px; margin: 0 auto; padding: 40px 20px; }
  h1 { font-family: Georgia, serif; color: #c9a84c; font-size: 28px; border-bottom: 1px solid rgba(201,168,76,0.2); padding-bottom: 12px; }
  h2 { color: #c9a84c; font-size: 18px; margin-top: 28px; }
  p { color: rgba(224,213,199,0.8); }
  strong { color: #e0d5c7; }
  a { color: #c9a84c; }
  ul { color: rgba(224,213,199,0.8); }
  .updated { color: rgba(224,213,199,0.5); font-size: 13px; margin-top: 40px; }
</style>
</head>
<body>
<h1>Terms of Service</h1>
<p>By using Vino Scanner, you agree to these terms.</p>

<h2>Service Description</h2>
<p>Vino Scanner uses AI to identify wines from label photos. Results are provided "as is" and may not always be accurate.</p>

<h2>Subscriptions</h2>
<ul>
  <li>Free tier includes a limited number of scans per day</li>
  <li>Premium subscriptions provide unlimited scans and additional features</li>
  <li>Subscriptions auto-renew unless cancelled 24 hours before renewal</li>
  <li>Manage subscriptions via Google Play Store</li>
</ul>

<h2>Acceptable Use</h2>
<ul>
  <li>You must be at least 13 years old</li>
  <li>Do not use the service for illegal purposes</li>
  <li>Do not attempt to bypass scan limits or access restrictions</li>
</ul>

<h2>Limitation of Liability</h2>
<p>Vino Scanner is not liable for damages arising from use of the service, including inaccurate wine identifications.</p>

<h2>Contact</h2>
<p><a href="mailto:support@vinowine.app">support@vinowine.app</a></p>

<p class="updated">Last updated: July 2026</p>
</body>
</html>`;

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(TERMS_HTML);
}
