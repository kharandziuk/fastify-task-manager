const Fastify = require('fastify')

function buildFastify () {
  const fastify = Fastify()

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
