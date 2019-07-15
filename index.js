const Fastify = require('fastify')
// FIXME: move to .env
const SECRET = 'supersecret'
const fastifyPlugin = require('fastify-plugin')
const Joi = require('@hapi/joi')

const { dbConnector, schemas } = require('./models')


const userController = async (fastify, { db }) => {
  fastify.post(
    '/users',
    {
      schema: { body: schemas.joiUserSchema },
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

  fastify.post('/login', async (req, reply) => {
    const { username, password } = req.body
    const user = await db.models.User.findOne({name: username, password })
    if (user) {
      const token = fastify.jwt.sign({ id: user._id })
      return { token }
    } else {
      reply.code(401)
      reply.send({ error: 'invalid username or password' })
    }
  })

  return fastify
}

const taskController = async (fastify, { db }) => {
  fastify.get(
    '/tasks',
    {
      preValidation: [fastify.authenticate]
    },
    (request, reply) => {
      db.models.Task.find({}).lean().then((data) => {
        reply.send(data)
      })
    }
  )
  fastify.post(
    '/tasks',
    {
      schema: { body: schemas.joiTaskSchema },
      preValidation: [fastify.authenticate]
    },
    (request, reply) => {
      const token = request.headers['authorization'].split(' ')[1]
      const userId = fastify.jwt.decode(token).id
      const instance = db.models.Task(Object.assign(
            {createdBy: userId},
            request.body
            ))
      instance.save().then(() => {
        reply.code(201)
        reply.send({ message: 'object created' })
      })
    }
  )
  return fastify
}




function buildFastify ({secret, db}) {
  const fastify = Fastify({
    logger: {
      level: 'error',
    }
  })
  fastify.decorate("authenticate", async function(request, reply) {
    await request.jwtVerify()
  })

  fastify.setSchemaCompiler(
      (schema) =>
        (data) => {
          return Joi.validate(data, schema)
        }
  )

  fastify.register(require('fastify-jwt'), { secret })
  fastify.register(userController, { db })
  fastify.register(taskController, { db })


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
