const express = require('express');
const employeesRouter = require('./employeesRouter.js');
const menusRouter = require('./menusRouter.js');

const apiRouter = express.Router();
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/menus', menusRouter);

module.exports = apiRouter;