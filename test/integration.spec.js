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
  after(() => db.connection.disconnect())
  beforeEach(() => {
    fastify = buildFastify({secret: SECRET, db})
    return fastify.ready()
  })
  afterEach(async () => {
    await cleanModels(db.models)
    await fastify.close()
  })

  it('can sign-up and login', async () => {
    let response = await supertest(fastify.server)
      .post('/users')
      .send({
        name: 'username',
        password: 'password',
        email: 'user@example.com'
      })
    expect(response.statusCode).eql(201)
    expect(response.body).eql({message: 'object created'})

    response = await supertest(fastify.server)
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
    expect(response.body).eql({
      "error": "invalid username or password",
    })
  })

  it('can create task and find it in a list and remove', async () => {
    let response = await supertest(fastify.server)
      .post('/users')
      .send({
        name: 'username',
        password: 'password',
        email: 'user@example.com'
      })
    expect(response.statusCode).eql(201)
    expect(response.body).eql({message: 'object created'})

    response = await supertest(fastify.server)
      .post('/login')
      .send({
        username: 'username',
        password: 'password'
      })
    expect(response.statusCode).eql(200)
    const { token } = response.body

    response = await supertest(fastify.server)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'some title',
        title: 'some descrition'
      })

    expect(response.body).eql({message: 'object created'})
    expect(response.statusCode).eql(201)

    response = await supertest(fastify.server)
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)

    expect(response.statusCode).eql(200)
    expect(response.body).length(1)
  })
})
