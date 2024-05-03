const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

const Handlebars = require('handlebars');
Handlebars.registerHelper('eq', function(arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/postComment', authController.postComment);

router.post('/loadComments', authController.loadComments);

router.post('/getProfile', authController.getProfile);

router.post('/admindeleteAccount', authController.admindeleteAccount);

router.post('/adminPortal', authController.getAdminPortal);

router.post('/delete', authController.deleteAccount);

router.get('/logout', authController.logout );

module.exports = router;