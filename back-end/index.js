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





server.listen(8055,()=>{
    console.log('Server started listening on port 8055')
})