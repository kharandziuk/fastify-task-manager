const Fastify = require('fastify')
// FIXME: move to .env
const SECRET = 'supersecret'

function buildFastify ({secret}) {
  const fastify = Fastify()

    fastify.register(require('fastify-jwt'), { secret })

  fastify.decorate("authenticate", async function(request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.post('/login', async (req, reply) => {
    const { username, password }  = req.body
      if(username === 'username' && password === 'password') {
        const token = fastify.jwt.sign({ id: 'ID' })
        return { token }
      } else {
        reply.code(401)
        return {error: 'invalid username or password'}
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
  })

  return fastify
}

if (require.main === module) {
  const fastify = buildFastify({secret: SECRET})
  fastify.listen(3000).then((address)=> {
    console.log(`server listening on ${address}`)
  })
} else {
  module.exports = buildFastify
}
