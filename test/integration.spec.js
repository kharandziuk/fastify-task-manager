const supertest = require('supertest')
const { expect } = require('chai')
const buildFastify = require('../index')


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

  it('can login w valid credentials', async () => {
    const response = await supertest(fastify.server)
      .post('/login')
      .send({
        username: 'username',
        password: 'password'
      })
    expect(response.statusCode).eql(200)
    expect(response.body).to.have.key('token')
  })

  it('cant login wo valid credentials', async () => {
    const response = await supertest(fastify.server)
      .post('/login')
      .send({
        username: 'invalid',
        password: 'invalid'
      })
    expect(response.statusCode).eql(401)
    expect(response.error).eql
  })
})
