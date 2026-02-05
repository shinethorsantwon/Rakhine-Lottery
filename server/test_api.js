const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'srv1635.hstgr.io',
    user: 'u860480593_rakhinelottery',
    password: 'SBClt2580',
    database: 'u860480593_rakhinelottery'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }

    db.query('SELECT totalSold, lastWinnerName, lastWinningTicketId, lastWinnerName2, lastWinningTicketId2, lastWinnerName3, lastWinningTicketId3 FROM lottery_stats WHERE id = 1', (err, res) => {
        if (err) {
            console.error('API Stats Query Failed:', err);
        } else {
            console.log('API Stats Results:', res);
        }
        process.exit(0);
    });
});
