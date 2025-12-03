// Script to generate a proper bcrypt hash for the admin password
// Run this with: node generate-admin-hash.js

const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('\n===========================================');
    console.log('Admin Password Hash Generated');
    console.log('===========================================');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('===========================================\n');
    
    // Also verify it works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification test:', isValid ? '✓ PASSED' : '✗ FAILED');
    console.log('\n');
}

generateHash().catch(console.error);
