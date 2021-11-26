const sqlite3 = require('sqlite3');

// check if process.env.TEST_DATABASE has been set, and if so load that database instead.
// This allows the CCmy testing suite to check the routes without corrupting the app's database.
const db = new sqlite3.Database(process.env.TEST_DATABASE  || './database.sqlite');
// const db = new sqlite3.Database(process.env.TEST_DATABASE);

db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS Employee`, 
        err => err ? console.log(err) : 1
    );
    db.run(`DROP TABLE IF EXISTS Timesheet`,
        err => err ? console.log(err) : 1    
    );
    db.run(`DROP TABLE IF EXISTS Menu`,
        err => err ? console.log(err) : 1
    );
    db.run(`DROP TABLE IF EXISTS MenuItem`,
        err => err ? console.log(err) : 1
    );
    db.run(`
        CREATE TABLE Employee (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            wage INTEGER NOT NULL,
            is_current_employee INTEGER DEFAULT 1
        );`,
        err => err ? console.log(err) : 1
    );
    db.run(`
        CREATE TABLE Timesheet (
            id INTEGER PRIMARY KEY NOT NULL,
            hours INTEGER NOT NULL,
            rate INTEGER NOT NULL,
            date INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES Employee (id)
        );`,
        err => err ? console.log(err) : 1
    );
    db.run(`
        CREATE TABLE Menu (
            id INTEGER PRIMARY KEY NOT NULL,
            title TEXT NOT NULL
        );`,
        err => err ? console.log(err) : 1
    );
    db.run(`
        CREATE TABLE MenuItem (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            inventory INTEGER NOT NULL,
            price INTEGER NOT NULL,
            menu_id INTEGER NOT NULL,
            FOREIGN KEY (menu_id) REFERENCES Menu (id)
        );`,
        err => err ? console.log(err) : 1
    );
});