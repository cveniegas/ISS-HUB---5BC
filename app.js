const express = require("express");
const path = require('path');
const app = express();
const mysql = require("mysql");
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const Handlebars = require('handlebars');
dotenv.config({ path: './.env'})
Handlebars.registerHelper('eq', function(arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

const db = mysql.createConnection({
    database: process.env.DATABASE,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
});


const publicDirectory = path.join(__dirname, './public')

app.use(express.static(publicDirectory));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended:false}));
// Paerse Json bodies
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs');


db.connect( (error) =>{
    if(error){
        console.log(error)
    } else {
        console.log("MYSQL Connected... ")
    }
})

//Define Routes for pages
app.use('/', require('./routes/pages'));
app.use('/auth',require('./routes/auth'));

app.listen(5001, () => {
    console.log ("Server started on port 5001");
})