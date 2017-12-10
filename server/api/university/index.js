const express = require('express');
const controller = require('./university.controller');

const router = express.Router();

router.get('/', controller.index);

module.exports = router;
