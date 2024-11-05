var express = require('express');
var router = express.Router();
const controllers = require('../controllers/index')
const { verifyToken } = require('../helpers/verifyToken');

router.post('/signUp', controllers.userController.signUp)
router.post('/login', controllers.userController.login)
router.post('/logout', verifyToken, controllers.userController.logout)

module.exports = router;