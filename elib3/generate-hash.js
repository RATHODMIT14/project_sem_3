const bcrypt = require('bcrypt');
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: node generate-hash.js "your_password"');
    process.exit();
}

const plainPassword = args[0];
bcrypt.hash(plainPassword, 10, (err, hash) => {
    if(err) return console.error(err);
    console.log('\n---------------------------------------------------');
    console.log('Password: ' + plainPassword);
    console.log('Encrypted Hash: ' + hash);
    console.log('---------------------------------------------------');
    console.log('SQL Update Command:');
    console.log(`UPDATE users SET password = '${hash}' WHERE email = 'TARGET_EMAIL';`);
    console.log('---------------------------------------------------\n');
});

