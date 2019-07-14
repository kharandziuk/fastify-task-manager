const Fastify = require('fastify')
// FIXME: move to .env
const SECRET = 'supersecret'
const Joi = require('@hapi/joi')
const fastifyPlugin = require('fastify-plugin')
const mongoose = require('mongoose');
const joigoose = require('joigoose')(mongoose);

const joiUserSchema = Joi.object({
  name: Joi.string().alphanum().min(6).max(16).required().meta({ unique: true }),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(16).required()
});


const userController = async (fastify, { db }) => {
  fastify.post(
    '/users',
    {
      schema: { body: joiUserSchema },
    },
    async (request, reply) => {
      const instance = db.models.User(request.body)
      try {
        await instance.save()
        reply.code(201)
        return { message: 'object created' }
      } catch (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
          reply.code(400)
          return { error: 'there is already a user with such name' }
        }
        throw err
      }
    }
  )

  return fastify
}

async function dbConnector() {
    // FIXME: make generic
    const connection = await mongoose.connect(
      'mongodb://user:pass@localhost:27017/mydatabase',
      {useNewUrlParser: true}
    )
    mongoose.set('useCreateIndex', true)
    const userSchema = new mongoose.Schema(joigoose.convert(joiUserSchema))
    const models = {
      User: mongoose.model('User', userSchema)
    }
    return { connection, models }
}



function buildFastify ({secret, db}) {
  const fastify = Fastify()

  fastify.register(require('fastify-jwt'), { secret })
  fastify.register(userController, { db })

  fastify.decorate("authenticate", async function(request, reply) {
    await request.jwtVerify()
  })

  fastify.setSchemaCompiler(
      (schema) =>
        (data) => {
          return Joi.validate(data, schema)
        }
  )

  fastify.post('/login', async (req, reply) => {
    const { username, password }  = req.body
      if(username === 'username' && password === 'password') {
        const token = fastify.jwt.sign({ id: 'ID' })
        return { token }
      } else {
        throw { statusCode: 401, error: 'invalid username or password' }
      }
  })


  fastify.get('/', function (request, reply) {
    reply.send({ hello: 'world' })
  })

  fastify.get(
    '/need-authentication',
    {
      preValidation: [fastify.authenticate]
    },
    async (request, reply) => {
      return { message: 'some personal data' }
    }
  )


  return fastify
}

if (require.main === module) {
  dbConnector().then((db) => {
    const fastify = buildFastify({ secret: SECRET, db })
    fastify.listen(3000).then((address)=> {
      console.log(`server listening on ${address}`)
    })
  })
} else {
  module.exports = { buildFastify, dbConnector }
}
