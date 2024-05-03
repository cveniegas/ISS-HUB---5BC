const { request } = require("express");

const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const express = require("express");
const Handlebars = require('handlebars');
const router = express.Router();
Handlebars.registerHelper('eq', function(arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});
const authController = require('../controllers/auth');

exports.getAdminPortal = (req, res) => {
  if (!req.user || req.user.user_type !== 'admin') {
      return res.redirect('/login');
  }
  const isAdmin = req.user && req.user.user_type === 'admin';

  // Query the database to fetch user data
  db.query('SELECT * FROM users', (error, users) => {
      if (error) {
          console.error("Error fetching user data:", error);
          return res.status(500).send("Error fetching user data");
      }

      // Render the admin portal template with user data
      res.render('adminPortal', { user: req.user, users: users, isAdmin: isAdmin });
  });
};

exports.loadUsers = (req, res, next) => {
  db.query("SELECT * FROM users", (error, userResults) => {
      if (error) {
          console.error("Error executing user query:", error);
          return res.status(500).send("Error fetching user data");
      }

      req.users = userResults;
      next();
  });
}
exports.admindeleteAccount = async (req, res) => {
  try {
      const { user_id } = req.body; // Get the user_id from the request body

      // Delete forum posts associated with the user
      await db.query('DELETE FROM forum WHERE user_id = ?', user_id);

      // Delete the user's account
      await db.query('DELETE FROM users WHERE id = ?', user_id);

      res.redirect('/adminPortal');
  } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).send("Error deleting account");
  }
};

exports.deleteAccount = async (req, res) => {
  try {
      // Get the user ID from the decoded JWT token
      const decoded = jwt.decode(req.cookies.jwt);
      const userId = decoded.id;

      // Delete forum posts associated with the user
      await db.query('DELETE FROM forum WHERE user_id = ?', userId);

      // Delete the user's account
      await db.query('DELETE FROM users WHERE id = ?', userId);

      // Clear the JWT cookie and redirect to login page
      res.clearCookie('jwt');
      res.redirect('/login');
  } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).send("Error deleting account");
  }
};

exports.getProfile = (req, res) => {
  if (!req.user) {
      return res.redirect('/login');
  }
  const isAdmin = req.user && req.user.user_type === 'admin';
  // Query the forum table to retrieve the post history of the current user
  db.query('SELECT * FROM forum WHERE user_id = ?', [req.user.id], (error, forumPosts) => {
    if (error) {
        console.error("Error retrieving forum post history:", error);
        return res.status(500).send("Error retrieving forum post history");
    }
    // Render the profile page template
    res.render('profile',{ user: req.user, forumData:forumPosts,isAdmin: isAdmin});
  });
};

exports.postComment = (req,res) => {
  console.log(req.body);
  
  const { title, content, user_id } = req.body;

    db.query('INSERT INTO forum SET ?', { title, content, user_id }, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error posting comment'); // Send error response to the client
        }
        // Reload comments after posting a new comment
        res.redirect('/forum?message=Thread%20Posted');
    });
}

exports.loadComments = (req,res,next) =>{
    console.log(req.body);

    // Declare variables to store the data
    let forumData, userData;

    // Execute the SQL query to fetch forum data
    db.query("SELECT users.*, forum.title, forum.content, forum.date FROM users JOIN forum ON users.id = forum.user_id", (error, forumResults) => {
        if (error) {
            console.error("Error executing forum query:", error);
            return res.status(500).send("Error fetching forum data");
        }

        // Store the forum data in a local variable
        forumData = forumResults;

        // Execute the SQL query to fetch user data
        db.query("SELECT * FROM users", (error, userResults) => {
            if (error) {
                console.error("Error executing user query:", error);
                return res.status(500).send("Error fetching user data");
            }

            // Store the user data in a local variable
            userData = userResults;

            // Store the retrieved data in the request object
            req.forumData = forumData;
            req.userData = userData;
            // Proceed to the next middleware or route handler
            next();
        });
    });
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', {
        message: 'Please provide an email and password'
      });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
      if (error) {
        console.error("Error querying database:", error);
        return res.status(500).send("Error querying database");
      }

      if (!results || results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
        // Handle invalid email or password
        return res.status(401).render('login', {
          message: 'Email or Password is incorrect'
        });
      } else {
        const id = results[0].id;

        const token = jwt.sign({ id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN
        });

        console.log("The token is: " + token);

        const cookiesOptions = {
          expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
          ),
          httpOnly: true
        };

        res.cookie('jwt', token, cookiesOptions);
        res.status(200).redirect("/");
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.register = (req,res) =>{
    console.log(req.body);

    const { name, email, password, passwordConfirm, user_type} = req.body;

    db.query('SELECT email FROM users Where email = ?', [email],async(error, results) =>{
        if (error){
            console.log(error);
        }
        if (results.length > 0 ){
            return res.render('register', {
                message: 'That email is already in use'
            })
        } else if(password !== passwordConfirm){
            return res.render ('register', {
                message: 'Passwords do not match'
            });
        }
        // hashess the password
        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);
        
        // save to the database

        db.query('INSERT INTO users SET ?',{name: name, email: email, password: hashedPassword, user_type: user_type}, (error,results)=>{
            if(error){
                console.log(error);
            } else{
                return res.render ('register', {
                    message: 'User Registerd'
                });
            };
        });
    });

}

exports.isLoggedIn = async (req, res, next) => {
     console.log(req.cookies);
    if( req.cookies.jwt) {
      try {
        //1) verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.jwt,
        process.env.JWT_SECRET
        );
  
        console.log(decoded);
  
        //2) Check if the user still exists
        db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
          console.log(result);
  
          if(!result) {
            return next();
          }
  
          req.user = result[0];
          console.log("user is")
          console.log(req.user);
          return next();
  
        });
      } catch (error) {
        console.log(error);
        return next();
      }
    } else {
      next();
    }
  }
  
exports.logout = async (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 2*1000),
    httpOnly: true
  });

  res.status(200).redirect('/');
}


