/**
 * Seed the first admin user into MongoDB.
 *
 * Run AFTER `npm install`:
 *   npm run seed
 *
 * Or with explicit URI:
 *   MONGODB_URI="mongodb+srv://..." npm run seed
 *
 * Auto-loads MONGODB_URI from apps/admin/.env.local if not set in environment.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Auto-load .env.local (no dotenv package needed) ──────────────────────────
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value; // never overwrite shell env
  }
}

// Try admin .env.local first, then storefront, then root
loadEnvFile(resolve(ROOT, 'apps/admin/.env.local'));
loadEnvFile(resolve(ROOT, 'apps/storefront/.env.local'));
loadEnvFile(resolve(ROOT, '.env.local'));

// ── Validate MONGODB_URI ─────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('\n❌  MONGODB_URI is not set.\n');
  console.error('   Fix option 1 — add it to apps/admin/.env.local:');
  console.error('     MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ecommerce\n');
  console.error('   Fix option 2 — pass it inline:');
  console.error('     MONGODB_URI="mongodb+srv://..." npm run seed\n');
  process.exit(1);
}

// ── Dynamic imports — catches "packages not installed" early ─────────────────
let mongoose, bcrypt;
try {
  mongoose = (await import('mongoose')).default;
  bcrypt   = (await import('bcryptjs')).default;
} catch {
  console.error('\n❌  Required packages are missing. Run this first:\n');
  console.error('     npm install\n');
  process.exit(1);
}

// ── Minimal User schema (no dependency on @repo/lib) ─────────────────────────
const userSchema = new mongoose.Schema(
  {
    name:     String,
    email:    { type: String, unique: true, lowercase: true, trim: true },
    password: String,
    role:     { type: String, default: 'customer' },
    isActive: { type: Boolean, default: true },
    provider: { type: String, default: 'credentials' },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seedAdmin() {
  console.log('\n🌱  Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log('✓   Connected\n');

  const email    = 'admin@yourshop.com';
  const password = 'Admin@123456';
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== 'admin') {
      await User.findByIdAndUpdate(existing._id, { role: 'admin' });
      console.log(`✓   Existing user "${email}" promoted to admin.`);
    } else {
      console.log(`⚠️   Admin already exists: ${email}`);
      console.log('    No changes made.');
    }
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.create({ name: 'Admin', email, password: hashed, role: 'admin' });

  console.log('✅  Admin user created!\n');
  console.log(`    Email    : ${email}`);
  console.log(`    Password : ${password}`);
  console.log('\n    ⚠️  Change this password immediately after first login!');
  console.log('    Admin panel → Settings → Change Password\n');

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
