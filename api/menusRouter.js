const express = require('express');
const sqlite3 = require('sqlite3');

// check if process.env.TEST_DATABASE has been set, and if so load that database instead.
// This allows the CCmy testing suite to check the routes without corrupting the app's database.
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menusRouter = express.Router();



module.exports = menusRouter;