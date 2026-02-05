const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected.');

    db.query('DESCRIBE users', (err, res) => {
        console.log('--- Users Table ---');
        console.log(res ? res.map(c => c.Field).join(', ') : err);

        db.query('DESCRIBE lottery_stats', (err, res) => {
            console.log('--- Stats Table ---');
            console.log(res ? res.map(c => c.Field).join(', ') : err);

            db.query('SELECT VERSION() as v', (err, res) => {
                console.log('--- MySQL Version ---');
                console.log(res ? res[0].v : err);
                process.exit(0);
            });
        });
    });
});
