/**
 * Create (or promote) an admin account from the command line.
 *
 *   npm run create-admin -- --email you@example.com --name "Your Name"
 *
 * You'll be prompted for the password (input is not echoed). Alternatively,
 * visit /admin/login while no admin exists to use the one-time setup screen.
 */
import { createRequire } from 'node:module';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const { User } = await import('../src/server/models/index.js');

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
};

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => rl.output.write(text.includes(question) ? text : '');
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const email = (arg('email') || '').trim().toLowerCase();
const name = (arg('name') || 'Store Admin').trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run create-admin -- --email you@example.com [--name "Your Name"]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'mattheos' });
const existing = await User.findOne({ email });

if (existing) {
  existing.role = 'admin';
  existing.status = 'active';
  await existing.save();
  console.log(`Promoted ${email} to admin.`);
} else {
  const password = await askHidden('Password (min 8 characters): ');
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }
  await User.create({ name, email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
  console.log(`Created admin ${email}.`);
}

await mongoose.disconnect();
