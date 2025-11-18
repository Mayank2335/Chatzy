const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Google OAuth Setup ===\n');
console.log('Follow these steps to set up Google OAuth:');
console.log('1. Go to https://console.cloud.google.com/');
console.log('2. Create a new project or select an existing one');
console.log('3. Enable the Google+ API');
console.log('4. Go to Credentials');
console.log('5. Create OAuth 2.0 Client ID');
console.log('6. Add authorized origins:');
console.log('   - http://localhost:5173');
console.log('   - https://your-production-domain.com');
console.log('7. Add authorized redirect URIs:');
console.log('   - http://localhost:5173/auth/google/callback');
console.log('   - https://your-production-domain.com/auth/google/callback\n');

rl.question('Enter your Google Client ID: ', (clientId) => {
  rl.question('Enter your Google Client Secret: ', (clientSecret) => {
    const envPath = path.join(__dirname, '../.env');
    
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/, `GOOGLE_CLIENT_ID=${clientId}`);
      envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/, `GOOGLE_CLIENT_SECRET=${clientSecret}`);
      
      fs.writeFileSync(envPath, envContent);
      console.log('\nGoogle OAuth credentials have been updated successfully!\n');
    } catch (error) {
      console.error('Error updating .env file:', error);
    }
    
    rl.close();
  });
});