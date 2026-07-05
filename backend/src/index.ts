import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth.js';
import { scanRouter } from './routes/scan.js';
import { userRouter } from './routes/user.js';
import { errorHandler } from './middleware/errorHandler.js';

export const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRouter);
app.use('/api/scan', scanRouter);
app.use('/api/user', userRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/privacy', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy - Vino Scanner</title>
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
<h1>Privacy Policy</h1>
<p><strong>Vino Scanner</strong> ("we", "our", "us") respects your privacy. This policy explains how we collect, use, and protect your information.</p>

<h2>Information We Collect</h2>
<ul>
  <li><strong>Camera Images:</strong> Photos of wine labels you choose to scan are sent to our server for AI analysis. Images are not stored permanently unless you save the result.</li>
  <li><strong>Account Data:</strong> If you sign in with Google, we store your email address and a subscription status indicator.</li>
  <li><strong>Usage Data:</strong> Scan count and preferred wine type for personalization.</li>
</ul>

<h2>How We Use Your Data</h2>
<ul>
  <li>To identify wines from label images using AI</li>
  <li>To manage your subscription and scan quota</li>
  <li>To personalize your experience (language, currency, wine preferences)</li>
  <li>To improve our service</li>
</ul>

<h2>Data Storage & Security</h2>
<ul>
  <li>All data is encrypted in transit (HTTPS)</li>
  <li>Authentication tokens are stored securely on your device</li>
  <li>We use industry-standard security practices</li>
</ul>

<h2>Third-Party Services</h2>
<ul>
  <li><strong>Google Sign-In:</strong> Used for authentication (subject to Google's Privacy Policy)</li>
  <li><strong>Google Gemini AI:</strong> Wine label analysis (images processed via Google's API)</li>
  <li><strong>RevenueCat / Google Play:</strong> Subscription management</li>
</ul>

<h2>Your Rights</h2>
<p>You can request deletion of your account and associated data at any time via the app's Profile screen. Contact us at <a href="mailto:privacy@vinowine.app">privacy@vinowine.app</a>.</p>

<h2>Changes</h2>
<p>We may update this policy. Continued use after changes constitutes acceptance.</p>

<p class="updated">Last updated: July 2026</p>
</body>
</html>`);
});

app.get('/terms', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
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
</html>`);
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
