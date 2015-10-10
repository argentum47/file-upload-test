var express = require('express');
var router = express.Router();
var multer = require('multer');

var User = require('../models/User.js');

router.use('/:id/upload', multer({dest: 'uploads/'}).array('files[]'));

router.get('/', function(req, res, next) {
  User.find().then(function (users) {
    res.send({users: users});
  }).catch(function(err) {
    next(err)
  })
});

router.post('/create', function (req, res, next) {
  var user = {};
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.email = req.body.email;
  user.password = req.body.password

  User.create(user, function(err, u) {
    console.log(err, u)
    if(err) next(err);
    else
      res.send({id: u._id, email: u.email, name: u.firstName + ' ' + u.lastName })
  })
});

router.post('/login', function(q, s, n) {
  var user = { email: q.body.email, password: q.body.password };
  User.findOne({ email: user.email })
    .then(function (u) {
      if(u.authenticate(user.password))
        s.send({ id: u._id, email: u.email, name: u.firstName + ' ' + u.lastName })
      else {
        throw Error('NOT_FOUND')
      }
    })
    .catch(function(err) {
      n(err);
    });
})

router.get('/:id', function(req, res, next) {
  User.findOne({ _id: req.params.id}).then(function(u) {
    if(!u) throw Error({message: 'NOT_FOUND'});
    res.send({id: u._id, email: u.email, name: u.firstName + ' ' + u.lastName })
  }).catch(function(err) {
    next(err);
  })
});

router.patch('/:id/upload', function(q, s, n) {
  console.log(q.body, q.files, "files");
  //uploadToS3
  s.send(true)
});

module.exports = router;
