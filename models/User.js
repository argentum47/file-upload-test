var crypto = require('crypto'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique : true, dropDups: true },
  password: { type: String, required: true},
  image: {
    files: []
  }
});


UserSchema.pre('save', function(next) {
  if(!this.isNew) return next();
  this.password = this.encrypt(this.password)
  next();
});

UserSchema.methods.encrypt = function(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

UserSchema.methods.authenticate = function authenticate(password) {
  return this.encrypt(password) == this.password
}

module.exports = mongoose.model('User', UserSchema);
