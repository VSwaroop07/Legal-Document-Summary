import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import app from '../src/app.js'
import User from '../src/models/User.js'
import Document from '../src/models/Document.js'
import { env } from '../src/config/env.js'

let mongo

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

afterEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})))
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})

async function register(name, email) {
  const response = await request(app).post('/api/auth/register').send({
    name,
    email,
    password: 'password123',
  })
  return response.body.data
}

describe('authentication', () => {
  it('registers, logs in, and restores the current user', async () => {
    const registered = await register('Alice', 'Alice@example.com')
    expect(registered.user.email).toBe('alice@example.com')
    expect(registered.user).not.toHaveProperty('passwordHash')

    const login = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    })
    expect(login.status).toBe(200)
    expect(login.body.data.token).toBeTruthy()

    const me = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.token}`)
    expect(me.status).toBe(200)
    expect(me.body.data.user.email).toBe('alice@example.com')
  })

  it('rejects invalid credentials and unauthenticated requests', async () => {
    await register('Alice', 'alice@example.com')
    const login = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'wrong-password',
    })
    expect(login.status).toBe(401)
    expect(login.body.message).toBe('Invalid email or password')

    const me = await request(app).get('/api/auth/me')
    expect(me.status).toBe(401)
  })

  it('rejects malformed bearer tokens', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid')
    expect(response.status).toBe(401)
  })
})

describe('document ownership and upload validation', () => {
  it('prevents user B from reading or deleting user A documents', async () => {
    const alice = await register('Alice', 'alice@example.com')
    const bob = await register('Bob', 'bob@example.com')
    const document = await Document.create({
      user: new mongoose.Types.ObjectId(alice.user.id),
      title: 'Private judgment',
      originalName: 'judgment.pdf',
    })
    const bobToken = jwt.sign({ userId: bob.user.id }, env.JWT_SECRET, { expiresIn: '1h' })

    const read = await request(app).get(`/api/documents/${document.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
    const remove = await request(app).delete(`/api/documents/${document.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
    expect(read.status).toBe(404)
    expect(remove.status).toBe(404)
    expect(await Document.exists({ _id: document.id })).toBeTruthy()
  })

  it('rejects non-PDF and oversized uploads', async () => {
    const alice = await register('Alice', 'alice@example.com')
    const token = alice.token
    const nonPdf = await request(app).post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not a pdf'), { filename: 'notes.txt', contentType: 'text/plain' })
    expect(nonPdf.status).toBe(400)

    const oversized = await request(app).post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.alloc(15 * 1024 * 1024 + 1), { filename: 'large.pdf', contentType: 'application/pdf' })
    expect(oversized.status).toBe(400)
  })
})
