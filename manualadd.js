//manual add accounts maybe
const mysql = require('mysql');

// Set up the MySQL connection
const connection = mysql.createConnection({
    'multipleStatements': true,
    'connectionLimit' : 100,
    // 'host': 'localhost',
    'host': '10.11.90.15',
    'user': 'AppUser',
    'password': 'Special888%',
    'port'    :  3306,
    'database': 'fbla_webcoding'
});
const bcrypt = require('bcrypt-nodejs');


const username = 'test@test'; //test
const password = 'testpassword'; //test


bcrypt.hash(password, null, null, (err, hashedPassword) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }


    const query = 'INSERT INTO UserLogin (username, password) VALUES (?, ?)';


    connection.query(query, [username, hashedPassword], (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return;
        }
        console.log('User inserted successfully:', result);
    });
});
