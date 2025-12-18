const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 12);
  
  console.log('\n==============================================');
  console.log('🔐 PASSWORD HASH GENERATOR');
  console.log('==============================================\n');
  console.log('Original Password:', password);
  console.log('\nBcrypt Hash (copy this):');
  console.log('---');
  console.log(hash);
  console.log('---\n');
  console.log('==============================================\n');
  
  return hash;
}

generateHash();
