const mongoose = require('mongoose');
const Joi = require('@hapi/joi')
const joigoose = require('joigoose')(mongoose);

const joiUserSchema = Joi.object({
  name: Joi.string().alphanum().min(6).max(16).required().meta({ unique: true }),
  email: Joi.string().email().required(),
  // FIXME: we should store password in an encrypted way
  password: Joi.string().min(6).max(16).required()
})

const joiTaskSchema = Joi.object({
  title: Joi.string().max(100).required(),
  description: Joi.string().required(),
  deadline: Joi.date(),
  notificationDate: Joi.date(),
  isCompleted: Joi.boolean(),
  createdBy: Joi.string().meta({ type: 'ObjectId', ref: 'User' })
})

const schemas = {
  joiTaskSchema,
  joiUserSchema
}

async function dbConnector() {
    // FIXME: make generic
    const connection = await mongoose.connect(
      'mongodb://user:pass@localhost:27017/mydatabase',
      {useNewUrlParser: true}
    )
    mongoose.set('useCreateIndex', true)
    const userSchema = new mongoose.Schema(joigoose.convert(joiUserSchema))
    const taskSchema = new mongoose.Schema(joigoose.convert(joiTaskSchema))
    const models = {
      User: mongoose.model('User', userSchema),
      Task: mongoose.model('Task', taskSchema)
    }
    return { connection, models }
}

module.exports = { dbConnector, schemas }
