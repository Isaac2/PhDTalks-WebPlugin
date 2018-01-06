/**
*  Main app file
*/
'use strict';

//set default node enviroment for development
var env = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;

//dependencies

var express  = require ('express');
var multer  = require('multer');

//setup server
console.log('Starting server...');
var app = express();


require ('./routes') (app);

app.listen(PORT);
console.log('Server listening on port: ' + PORT);
