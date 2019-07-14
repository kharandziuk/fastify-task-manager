// getting-started.js
const mongoose = require('mongoose');
const Joigoose = require('joigoose')(mongoose);
const Joi = require('@hapi/joi')

var joiUserSchema = Joi.object({
  name: Joi.string().alphanum().min(6).max(16).required().meta({ unique: true }),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(16).required()
});

mongoose.connect(
    'mongodb://user:pass@localhost:27017/mydatabase',
    {useNewUrlParser: true}
);
var db = mongoose.connection;
mongoose.set('useCreateIndex', true)
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  const userSchema = new mongoose.Schema(Joigoose.convert(joiUserSchema));
  var User = mongoose.model('User', userSchema);
  var silence = new User({
    name: 'useruser',
    email: 'user@example.com',
    password: 'password' 
  });
  console.log(silence.name); // 'Silence'
  silence.save(function (err, fluffy) {
    if (err) return console.error(err);
    console.log('saved')
  });
});


