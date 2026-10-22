require('dotenv').config();

const dnsServers = (process.env.DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
if (dnsServers.length) require('node:dns').setServers(dnsServers);

const mongoose = require('mongoose');
const User = require('../models/User');

async function promoteAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'New Regent Admin';
  const phone = process.env.ADMIN_PHONE?.trim();

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.');
  }
  if (password.length < 6) throw new Error('ADMIN_PASSWORD must be at least 6 characters.');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured in backend/.env.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  let user = await User.findOne({ email }).select('+password');
  if (user) {
    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      throw new Error('That email already belongs to an account with a different password. No changes were made.');
    }
    user.role = 'admin';
    await user.save();
    console.log(`Admin access enabled for ${user.email}.`);
    return;
  }

  if (!phone) throw new Error('Set ADMIN_PHONE in backend/.env to create a new admin account.');
  user = await User.create({ name, email, password, phone, role: 'admin' });
  console.log(`Admin account created for ${user.email}.`);
}

promoteAdmin()
  .catch((error) => {
    console.error('Could not enable admin access:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
