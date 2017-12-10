const express = require('express');
const controller = require('./university.controller');

const router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.upsert);

module.exports = router;
