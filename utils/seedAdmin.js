// ============================================
// Seed Default Admin on First Server Start
// ============================================
const Admin = require('../models/Admin');
const logger = require('./logger');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@mylady.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin Sarah';

    // Check if any admin exists
    const existingAdmin = await Admin.findOne({ email: adminEmail.toLowerCase() });

    if (existingAdmin) {
      logger.info(`✓ Default admin already exists: ${adminEmail}`);
      return;
    }

    // Create default admin
    const admin = await Admin.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword, // Will be auto-hashed by pre-save hook
      role: 'Super Admin',
    });

    logger.info('✅ Default admin created successfully!');
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   🛡️  DEFAULT ADMIN ACCOUNT CREATED       ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   Email:    ${adminEmail.padEnd(29)} ║`);
    console.log(`║   Password: ${adminPassword.padEnd(29)} ║`);
    console.log('║   ⚠️  Change these in production!          ║');
    console.log('╚════════════════════════════════════════════╝\n');

    return admin;
  } catch (error) {
    logger.error(`Failed to seed admin: ${error.message}`);
    console.error(`❌ Failed to seed admin: ${error.message}`);
  }
};

module.exports = seedAdmin;