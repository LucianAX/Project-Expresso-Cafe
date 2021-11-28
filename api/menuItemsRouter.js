const express = require('express');
const sqlite3 = require('sqlite3');

// check if process.env.TEST_DATABASE has been set, and if so load that database instead.
// This allows the CCmy testing suite to check the routes without corrupting the app's database.
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = express.Router({ mergeParams: true });

//checks that a menu item with the supplied ID exists in the database
menuItemsRouter.param('menuItemId', (req, res, next, ID) => {
    db.get(`
        SELECT *
        FROM MenuItem
        WHERE id = ${ID};
        `, (err, foundItem) => {
            if (err) {
                return next(err);
            } else if(!foundItem) {
                return res.sendStatus(404);
            } else {
                req.menuItem = foundItem;
                next();
            }
    });
});

//checks that the required fields in the menuItem property of the request exist
const checkRequiredFields = (req, res, next) => {
    const name = req.body.menuItem.name;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    // const menuIdField = req.body.menuItem.menu_id;
    const menuIdField = req.params.menuId;

    if (!name || !inventory || !price || !menuIdField) {
        return res.sendStatus(400);
    } else {
        next();
    }
};

menuItemsRouter.get('/', (req, res, next) => {
    db.all(`
        SELECT *
        FROM MenuItem
        WHERE menu_id = ${req.params.menuId};
    `, (err, allMenuItems) => {
        err
            ? next(err)
            : res.status(200).send({ menuItems: allMenuItems });
    });
});

menuItemsRouter.post('/', checkRequiredFields, (req, res, next) => {
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    // const menuIdField = req.body.menuItem.menu_id;
    const menuIdField = req.params.menuId;

    db.run(`
        INSERT INTO MenuItem
            (name, description, inventory, price, menu_id)
        VALUES
            ($name, $description, $inventory, $price, $menuIdField);
        `,
        {
            $name: name,
            $description: description,
            $inventory: inventory,
            $price: price,
            $menuIdField: menuIdField
        },
        function(err) {
            if (err)
                return next(err);
            db.get(`
                SELECT *
                FROM MenuItem
                WHERE id = ${this.lastID};
                `, (err, newMenuItem) => {
                    err
                        ? next(err)
                        : res.status(201).send({ menuItem: newMenuItem });
            });   
    });
});

menuItemsRouter.put('/:menuItemId', checkRequiredFields, (req, res, next) => {
    const ID = req.params.menuItemId;
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    // const menuIdField = req.body.menuItem.menu_id;
    const menuIdField = req.params.menuId;

    db.run(`
        UPDATE MenuItem
        SET
            name = $name,
            description = $description,
            inventory = $inventory,
            price = $price,
            menu_id = $menuIdField
        WHERE
            id = ${ID};
        `,
        {
            $name: name,
            $description: description,
            $inventory: inventory,
            $price: price,
            $menuIdField: menuIdField
        },
        err => {
            if (err)
                return next(err);
            db.get(`
                SELECT *
                FROM MenuItem
                WHERE id = ${ID};
                `, (err, updatedItem) => {
                    err
                        ? next(err)
                        : res.status(200).send({ menuItem: updatedItem });
            });
    });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    const ID = req.params.menuItemId;
    db.run(`
        DELETE FROM MenuItem
        WHERE id = ${ID}
        `, err => {
            err
                ? next(err)
                : res.status(204).send();
    });
});

module.exports = menuItemsRouter;