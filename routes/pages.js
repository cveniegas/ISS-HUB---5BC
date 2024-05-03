const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();
const Handlebars = require('handlebars');
Handlebars.registerHelper('eq', function(arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

router.get('/', authController.isLoggedIn, (req, res) => {
  const isAdmin = req.user && req.user.user_type === 'admin';
  res.render('index', {
    user: req.user,
    isAdmin: isAdmin
  });
});

router.get ('/culturalEvent',authController.isLoggedIn, (req,res) => {
  const isAdmin = req.user && req.user.user_type === 'admin'
  res.render('culturalEvent', {user: req.user, isAdmin: isAdmin})
});

router.get ('/localServices',authController.isLoggedIn, (req,res) => {
  const isAdmin = req.user && req.user.user_type === 'admin'
  res.render('localServices', {user: req.user, isAdmin: isAdmin})
});

router.get ('/academicSupport',authController.isLoggedIn, (req,res) => {
  const isAdmin = req.user && req.user.user_type === 'admin'
  res.render('academicSupport', {user: req.user, isAdmin: isAdmin})
});

router.get('/adminPortal', authController.isLoggedIn, authController.loadUsers, (req, res) => {
  const isAdmin = req.user && req.user.user_type === 'admin';
  res.render('adminPortal', { user: req.user, users: req.users, isAdmin: isAdmin });
});
router.get('/register',(req,res)=>{
    res.render('register')
});

router.get('/login', (req, res) => {
    res.render('login',{
      user: req.user,
    });
  });

router.get('/forum', authController.isLoggedIn, authController.loadComments, (req, res) => {
    const isAdmin = req.user && req.user.user_type === 'admin';
      // Check if forumData is empty
    if (!req.forumData || req.forumData.length === 0) {
      // If forumData is empty, render the 'forum' template with only user data
      res.render('forum',{ user: req.user, isAdmin: isAdmin });
  } else {
      // If forumData is available, render the 'forum' template with both forumData and user data
      res.render('forum',{ user: req.user, forumData: req.forumData, userData: req.userData, isAdmin: isAdmin});
  }
});

router.get('/profile', authController.isLoggedIn, authController.getProfile);

module.exports = router;