#!/usr/bin/env node
/**
 * One-time setup: make sure a .env exists and has a strong, STABLE JWT secret.
 *
 * Why this matters: if JWT_SECRET is missing or left at the placeholder, sign-in
 * sessions can silently break on restart — users get bounced to the login screen
 * and it looks like "data was lost" or "the password changed". Generating the
 * secret once and persisting it to .env removes that whole class of problem.
 *
 *   npm run setup
 */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV = path.join(ROOT, '.env');
const EXAMPLE = path.join(ROOT, '.env.example');
const PLACEHOLDER = 'change-me-to-a-long-random-secret-string';

function main() {
  if (!fs.existsSync(ENV)) {
    if (fs.existsSync(EXAMPLE)) {
      fs.copyFileSync(EXAMPLE, ENV);
      console.log('• Created .env from .env.example');
    } else {
      fs.writeFileSync(ENV, '');
      console.log('• Created empty .env');
    }
  }

  let text = fs.readFileSync(ENV, 'utf8');
  const strong = crypto.randomBytes(48).toString('base64url');

  if (/^JWT_SECRET=\s*$/m.test(text) || text.includes(`JWT_SECRET=${PLACEHOLDER}`)) {
    text = text.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${strong}`);
    console.log('• Generated a strong, stable JWT_SECRET');
  } else if (!/^JWT_SECRET=/m.test(text)) {
    text += `\nJWT_SECRET=${strong}\n`;
    console.log('• Added a strong, stable JWT_SECRET');
  } else {
    console.log('• JWT_SECRET already set — leaving it unchanged (keeps existing sessions valid)');
  }

  if (!/^CRON_SECRET=\S/m.test(text)) {
    const cron = crypto.randomBytes(24).toString('hex');
    if (/^CRON_SECRET=/m.test(text)) text = text.replace(/^CRON_SECRET=.*$/m, `CRON_SECRET=${cron}`);
    else text += `\nCRON_SECRET=${cron}\n`;
    console.log('• Generated CRON_SECRET');
  }

  fs.writeFileSync(ENV, text);
  console.log('✓ Setup complete. Edit .env to point MONGODB_URI at your database, then run: npm run seed');
}

main();
