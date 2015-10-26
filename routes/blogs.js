//blogs.js
var express = require('express');
var router = express.Router();

var User = require('../models/User.js');
var MicroBlog = require('../models/MicroBlog');

router.get('/', function(q, s, n) {
  var data= {};
  MicroBlog.find({}).then(function(blogs) {
    console.log(q.session.userId);
    data.tweets = blogs;
    return blogs;
  }).then(function(blogs) {
    return User.where({ _id: { $in: blogs.map(function(b) { return b.id; }) } })
  }).then(function(users) {
    data.users = users;
    console.log(data);
    s.send(data);
  });
});

router.post('/create', function(q, s, n) {
  MicroBlog.create({ text: q.body.text, userId: q.session.userId })
    .then(function(tweet) {
      s.send({ tweet: tweet });
    })
});

module.exports = router;