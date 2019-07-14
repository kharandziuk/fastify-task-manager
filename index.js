const Fastify = require('fastify')

function buildFastify () {
  const fastify = Fastify()

  fastify.register(require('fastify-jwt'), {
      secret: 'supersecret'
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

  return fastify
}

if (require.main === module) {
  const fastify = buildFastify()
  fastify.listen(3000).then((address)=> {
    console.log(`server listening on ${address}`)
  })
} else {
  module.exports = buildFastify
}
