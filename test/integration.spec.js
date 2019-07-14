const supertest = require('supertest')
const { expect } = require('chai')
const { buildFastify, dbConnector } = require('../index')
const jwt = require('jsonwebtoken');

const SECRET = 'secret'

// Makes testing easier
const cleanModels = (models) => {
  const promises = Object.values(models).map((model) =>
    model.deleteMany({})
  )
  return Promise.all(promises)
}

describe('server', () => {
  let fastify
  let db
  before(async () => {
    db = await dbConnector()
  })
  after(() => {
    db.connection.disconnect()
  })
  beforeEach(() => {
    fastify = buildFastify({secret: SECRET, db})
    return fastify.ready()
  })
  afterEach(async () => {
    await cleanModels(db.models)
    await fastify.close()
  })

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
    expect(response.body).eql({
      "error": "invalid username or password",
      "statusCode": 401
    })
  })

  it('can sign-up', async () => {
    const response = await supertest(fastify.server)
      .post('/users')
      .send({
        name: 'username',
        password: 'password',
        email: 'user@example.com'
      })
    expect(response.statusCode).eql(201)
    expect(response.body).eql({message: 'object created'})
  })
})
