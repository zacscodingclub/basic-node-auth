var express = require('express')
  , router = express.Router()
  , multer = require('multer')
  , upload = multer({ dest: './uploads'})
  , User = require('../models/user')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.getUserByUsername(username, function(error, user) {
    if(error) { return done(err); }

    if(!user) {
      return done(null, false, { message: 'Unknown User'});
    }

    User.comparePassword(password, user.password, function(error, isMatch) {
      if(error) { return done(err); }

      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {message: 'Invalid password'});
      }
    });
  });
}));

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {title: 'Register'});
});

router.post('/register', upload.single('profileimage'), function(req, res, next) {
  if(req.file) {
    var profileimage = req.file.filename;
  } else {
    var profileimage = 'noimage.jpg';
  }

  // form validation
  req.checkBody('name', 'Your name is required').notEmpty();
  req.checkBody('email', 'Your email is required').notEmpty();
  req.checkBody('email', 'Your email must be valid').isEmail();
  req.checkBody('username', 'Your username is required').notEmpty();
  req.checkBody('password', 'Your password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  // check errors
  var errors = req.validationErrors();

  if (errors) {
    res.render('register', {errors: errors });
  } else {
    var newUser = new User({
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      profileimage: profileimage
    });

    User.createUser(newUser, function(err, user) {
      if(err) throw err;
    });

    req.flash('success', 'You successfully registed and can now login');
    res.location('/');
    res.redirect('/');
  }
});

router.get('/login', function(req, res, next) {
  res.render('login', {title: 'Login'});
});

router.post('/login',
  passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid username or password' }),
  function(req, res) {
    req.flash('success', 'You just logged the fuck in');
    res.redirect('/');
  }
);

router.get('/logout', function(req, res) {
  req.logout();
  req.flash('success', 'Successfully logged out.');
  res.redirect('/');
});

module.exports = router;
