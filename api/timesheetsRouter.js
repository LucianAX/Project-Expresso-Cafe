const express = require('express');
const sqlite3 = require('sqlite3');

// check if process.env.TEST_DATABASE has been set, and if so load that database instead.
// This allows the CCmy testing suite to check the routes without corrupting the app's database.
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
// const db = new sqlite3.Database(process.env.TEST_DATABASE);

const timesheetsRouter = express.Router({ mergeParams: true });

//checks if timesheet with specified ID exists
timesheetsRouter.param('timesheetId', (req, res, next, timeID) => {
    db.get(`
        SELECT *
        FROM Timesheet
        WHERE id = ${timeID};
        `,
        (err, foundTs) => {
            if (err) {
                return next(err);
            } else if (!foundTs) {
                return res.sendStatus(404);
            } else {
                req.timesheet = foundTs;
                next();
            }
    });
});

//checks if request body has required fields
const checkRequiredFields = (req, res, next) => {
    const hours = req.body.timesheet.hours;
    const rate = req.body.timesheet.rate;
    const date = req.body.timesheet.date;

    if (!hours || !rate || !date) {
        res.sendStatus(400);
    } else {
        next();
    }
}



timesheetsRouter.get('/', (req, res, next) => {
    const empID = req.params.employeeId;
    db.all(`
        SELECT *
        FROM Timesheet
        WHERE employee_id = ${empID}
        `,
        (err, foundTimesheets) => {
            err ? next(err) : 1;
            res.status(200).send({ timesheets: foundTimesheets });
        });
});

timesheetsRouter.post('/', checkRequiredFields, (req, res, next) => {
    const hours = req.body.timesheet.hours;
    const rate = req.body.timesheet.rate;
    const date = req.body.timesheet.date;
    const empID = req.params.employeeId;

    db.run(`
        INSERT INTO Timesheet
            (hours, rate, date, employee_id)
        VALUES
            ($hours, $rate, $date, $empID);
        `,
        {
            $hours: hours,
            $rate: rate,
            $date: date,
            $empID: empID
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get(`
                SELECT *
                FROM Timesheet
                WHERE id = ${this.lastID};
                `, (err, newTimesheet) => {
                    err
                        ? next(err)
                        : res.status(201).send({ timesheet: newTimesheet }); 
            });
    });
})

timesheetsRouter.put('/:timesheetId', checkRequiredFields, (req, res, next) => {
    const hours = req.body.timesheet.hours;
    const rate = req.body.timesheet.rate;
    const date = req.body.timesheet.date;
    const empID = req.params.employeeId;
    const tsID = req.params.timesheetId;

    db.run(`
        UPDATE Timesheet
        SET
            hours = $hours,
            rate = $rate,
            date = $date,
            employee_id = $empID
        WHERE id = ${tsID};
        `,
        {
            $hours: hours,
            $rate: rate,
            $date: date,
            $empID: empID
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get(`
                SELECT *
                FROM Timesheet
                WHERE id = ${tsID};
                `, (err, updatedTs) => {
                    err
                        ? next(err)
                        : res.status(200).send({ timesheet: updatedTs });
                });
    });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const tsID = req.params.timesheetId;

    db.run(`
        DELETE FROM Timesheet
        WHERE id = ${tsID};
        `, err =>
        err ? next(err) : res.sendStatus(204)
    );
});

module.exports = timesheetsRouter;