#!/usr/bin/env node

/**
 * Admin Setup Script
 * 
 * This script helps set up the admin user configuration.
 * Run with: node scripts/setup-admin.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAdmin() {
  console.log('🔧 TableTidier Admin Setup');
  console.log('========================\n');

  try {
    // Get admin email
    const adminEmail = await question('Enter admin email (default: admin@tabletidier.local): ');
    const email = adminEmail.trim() || 'admin@tabletidier.local';

    // Get admin password
    const adminPassword = await question('Enter admin password (default: admin123): ');
    const password = adminPassword.trim() || 'admin123';

    // Check if .env.local exists
    const envPath = path.join(__dirname, '..', '.env.local');
    const envExamplePath = path.join(__dirname, '..', '.env.example');

    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    } else {
      // Create basic .env.local template
      envContent = `# Admin Configuration
ADMIN_EMAIL=${email}
ADMIN_PASSWORD=${password}

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/tabletidier

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
`;
    }

    // Update or add admin configuration
    const lines = envContent.split('\n');
    const updatedLines = lines.map(line => {
      if (line.startsWith('ADMIN_EMAIL=')) {
        return `ADMIN_EMAIL=${email}`;
      } else if (line.startsWith('ADMIN_PASSWORD=')) {
        return `ADMIN_PASSWORD=${password}`;
      }
      return line;
    });

    // Add admin config if not present
    if (!envContent.includes('ADMIN_EMAIL=')) {
      updatedLines.splice(0, 0, `ADMIN_EMAIL=${email}`, `ADMIN_PASSWORD=${password}`);
    }

    const finalContent = updatedLines.join('\n');
    fs.writeFileSync(envPath, finalContent);

    console.log('\n✅ Admin configuration saved to .env.local');
    console.log(`📧 Admin Email: ${email}`);
    console.log(`🔑 Admin Password: ${password}`);
    console.log('\n🚀 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to: http://localhost:3000/auth/admin');
    console.log('3. Login with the admin credentials');
    console.log('\n⚠️  Security Note: Change the admin password in production!');

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
  } finally {
    rl.close();
  }
}

// Run the setup
setupAdmin();
