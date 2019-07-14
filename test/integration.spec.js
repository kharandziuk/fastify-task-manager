const supertest = require('supertest')
const Fastify = require('fastify')
const { expect } = require('chai')

function buildFastify () {
  const fastify = Fastify()

  fastify.get('/', function (request, reply) {
    reply.send({ hello: 'world' })
  })

  return fastify
}



describe('server', () => {
  let fastify
  beforeEach(() => {
    fastify = buildFastify()
    return fastify.ready()
  })
  afterEach(() =>
    fastify.close()
  )

  it('answers hello world', async () => {
    const response = await supertest(fastify.server)
      .get('/')
    expect(response.statusCode).eql(200)
    expect(response.body).eql({ hello: 'world' })
  })
})
