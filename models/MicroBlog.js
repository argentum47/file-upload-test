var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var MicroBlogSchema = new Schema({
  text: { type: String, required: true, minlength: 3, maxlength: 200 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: new Date() }
});

module.exports = mongoose.model('MicroBlog', MicroBlogSchema)