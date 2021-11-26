const express = require('express');
const sqlite3 = require('sqlite3');
const timesheetsRouter = require('./timesheetsRouter.js');

// check if process.env.TEST_DATABASE has been set, and if so load that database instead.
// This allows the CCmy testing suite to check the routes without corrupting the app's database.
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
// const db = new sqlite3.Database(process.env.TEST_DATABASE);

const employeesRouter = express.Router();

employeesRouter.param('employeeId', (req, res, next, empID) => {
    db.get(`
        SELECT *
        FROM Employee
        WHERE id = ${empID};
        `,        
        (err, employee) => {
            if (err) {
                return next(err);
            } else if (!employee) {
                return res.sendStatus(404);
            } else {
                req.employee = employee;
                next();
            }
    });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
    db.all(`
        SELECT *
        FROM Employee
        WHERE is_current_employee = 1;
        `, (err, employees) => {
            err 
                ? next(err) 
                : res.status(200).send({ employees: employees });
        });
});

employeesRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;
    let employed = req.body.employee.is_current_employee;
    
    if (!name || !position || !wage) {
        return res.sendStatus(400);
    }

    employed = (employed === 0) ? 0 : 1;
    db.run(`
        INSERT INTO Employee
            (name, position, wage, is_current_employee)
        VALUES
            ($name, $position, $wage, $employed);
        `,
        {
            $name: name,
            $position: position,
            $wage: wage,
            $employed: employed

        },
        function(err) {
            if (err) {
                next(err);
            } else {
                db.get(`
                    SELECT *
                    FROM Employee
                    WHERE id = ${this.lastID}
                    `,
                    (err, newEmployee) => {
                        err 
                            ? next(err)
                            : res.status(201).send({ employee: newEmployee });
                        
                });
            }
    });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).send({ employee: req.employee }); 
});

employeesRouter.put('/:employeeId', (req, res, next) => {
    const empID = req.params.employeeId;
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;
    let employed = req.body.employee.is_current_employee;

    if (!name || !position || !wage) {
        return res.sendStatus(400);
    }
    
    employed = (employed === 0) ? 0 : 1;
    db.run(`
        UPDATE Employee
        SET
            name = $name,
            position = $position,
            wage = $wage,
            is_current_employee = $employed
        WHERE id = ${empID};
        `,
        {
            $name: name,
            $position: position,
            $wage: wage,
            $employed: employed
        },
        (err) => {
            if (err) {
                next(err);
            } else {
                db.get(`
                    SELECT *
                    FROM Employee
                    WHERE id = ${empID}
                    `,
                    (err, updatedEmployee) => {
                        err 
                            ? next(err)
                            : res.status(200).send({ employee: updatedEmployee });
                });
            }
    });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    //not FULL Delete, only marks as unemployed
    const empID = req.params.employeeId;
    db.run(`
        UPDATE Employee
        SET is_current_employee = 0
        WHERE id = ${empID};
        `,        
        // err => err ? next(err) : res.sendStatus(200)
        (err) => {
            if (err) {
                next(err);
            } else {
                db.get(`
                    SELECT *
                    FROM Employee
                    WHERE id = ${empID}
                    `,
                    (err, deletedEmployee) => {
                        err 
                            ? next(err)
                            : res.status(200).send({ employee: deletedEmployee });
                });
            }
    });
});

module.exports = employeesRouter;
