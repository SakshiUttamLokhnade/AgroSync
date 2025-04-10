//take all packages into json object variables

const express =require('express');
const cors= require('cors');
const bodyParser= require('body-parser');
const mysql = require('mysql2');

//creating server & configuring the server

const server=express()
server.use(cors())
server.use(bodyParser.json())

//connecting to the mysql database

const con = mysql.createConnection({
    host:'127.0.0.1',
    user:'root',
    password:'Sakshi@123',
    database:'agrosync',
    port:3306,
    waitForConnections:true,
    queueLimit:500
})

// API to add user
server.post('/add-users', (req, res) => {
    const { fullName, username, userType } = req.body;

    if (!fullName || !username || !userType) {
        return res.json({
            status: false,
            message: 'Please provide fullName, username, and userType.'
        });
    }

    const sql = 'INSERT INTO users (fullName, username, userType) VALUES (?, ?, ?)';
    con.query(sql, [fullName, username, userType], (error, result) => {
        if (error) {
            return res.json({
                status: false,
                message: Error: ${error.message}
            });
        }

        res.json({
            status: true,
            message: 'User added successfully!'
        });
    });
});



server.listen(8055,()=>{
    console.log('Server started listening on port 8055')
})