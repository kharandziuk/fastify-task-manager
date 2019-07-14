const supertest = require('supertest')
const { expect } = require('chai')
const buildFastify = require('../index')
const jwt = require('jsonwebtoken');

const SECRET = 'secret'

describe('server', () => {
  let fastify
  beforeEach(() => {
    fastify = buildFastify({secret: SECRET})
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
    let response = await supertest(fastify.server)
      .post('/login')
      .send({
        username: 'username',
        password: 'password'
      })
    expect(response.statusCode).eql(200)
    expect(response.body).to.have.key('token')
  })

  it('can access with a proper token', async () => {
    const token = jwt.sign({}, SECRET)
    response = await supertest(fastify.server)
      .get('/need-authentication')
      .set('Authorization', `Bearer ${token}`)
    expect(response.statusCode).eql(200)
    expect(response.body).eql({message: 'some personal data'})
  })

  it('cant access wo a proper token', async () => {
    const token = 'invalid'
    response = await supertest(fastify.server)
      .get('/need-authentication')
      .set('Authorization', `Bearer ${token}`)
    expect(response.statusCode).eql(401)
    expect(response.body).eql({
      "error": "Unauthorized",
      "message": "Authorization token is invalid: jwt malformed",
      "statusCode": 401
    })

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
