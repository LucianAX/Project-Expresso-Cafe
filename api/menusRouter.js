const express = require('express');
const sqlite3 = require('sqlite3');

// check if process.env.TEST_DATABASE has been set, and if so load that database instead.
// This allows the CCmy testing suite to check the routes without corrupting the app's database.
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menusRouter = express.Router();
const menuItemsRouter = require('./menuItemsRouter.js');

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

//checks if a menu with the supplied menu ID exists
menusRouter.param('menuId', (req, res, next, menuId) => {
    db.get(`
        SELECT *
        FROM Menu
        WHERE id = ${menuId};
        `, (err, foundMenu) => {
            if (err) {
                return next(err);
            } else if (!foundMenu) {
                res.status(404).send();
            } else {
                req.menu = foundMenu;
                next();
            }
        });
});

//checks that the required field of the menu, called title, exists
const checkRequiredField = (req, res, next) => {
    if (!req.body.menu.title) {
        return res.sendStatus(400);
    } else {
        next();
    }
};

menusRouter.get('/', (req, res, next) => {
    db.all(`
        SELECT *
        FROM Menu;
        `, (err, allMenus) => {
            err
                ? next(err)
                : res.status(200).send({ menus: allMenus });
        });
});

menusRouter.post('/', checkRequiredField, (req, res, next) => {
    const title = req.body.menu.title;
    db.run(`
        INSERT INTO Menu (title)
        VALUES ($title);
        `, { $title: title },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get(`
                SELECT *
                FROM Menu
                WHERE id = ${this.lastID}`,
                (err, newMenu) => {
                    err
                        ? next(err)
                        : res.status(201).send({ menu: newMenu });
            });
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).send({ menu: req.menu });
});

menusRouter.put('/:menuId', checkRequiredField, (req, res, next) => {
    const menuID = req.params.menuId;
    const title = req.body.menu.title;
    db.run(`
        UPDATE Menu
        SET title = $title
        WHERE id = $id;
        `,
        {
            $id: menuID,
            $title: title
        },
        err => {
            if (err) return next(err);
            else {
                db.get(`
                    SELECT *
                    FROM Menu
                    WHERE id = ${menuID};
                    `, (err, updatedMenu) => {
                        err
                            ? next(err)
                            : res.status(200).send({ menu: updatedMenu });
                });
            }
    });
});

menusRouter.delete('/:menuId', (req, res, next) => {
    const menuID = req.params.menuId;
    db.all(`
        SELECT *
        FROM MenuItem
        WHERE menu_id = ${menuID};
        `, (err, foundMenuItems) => {
            if (err) {
                return next(err);
            } else if (foundMenuItems.length !== 0) {
                return res.status(400).send('The menu still has related menu items!');
            } 
                db.run(`
                    DELETE FROM Menu
                    WHERE id = ${menuID};
                    `,
                    err => {
                        err
                            ? next(err)
                            : res.status(204).send();
                        
                });
            
        });
});

module.exports = menusRouter;