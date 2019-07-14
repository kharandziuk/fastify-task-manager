const supertest = require('supertest')
const { expect } = require('chai')
const buildFastify = require('./index')

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
