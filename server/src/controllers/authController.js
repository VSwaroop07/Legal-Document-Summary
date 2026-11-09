import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'

const credentialsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').optional(),
  email: z.string().trim().email('A valid email is required').transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function createAuthResponse(user) {
  const token = jwt.sign({ userId: user._id.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })

  return { token, user: publicUser(user) }
}

export async function register(req, res) {
  const input = credentialsSchema.extend({
    name: z.string().trim().min(1, 'Name is required'),
  }).parse(req.body)

  const existingUser = await User.findOne({ email: input.email }).lean()
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
  })

  return sendSuccess(res, createAuthResponse(user), 201)
}

export async function login(req, res) {
  const input = credentialsSchema.omit({ name: true }).parse(req.body)
  const user = await User.findOne({ email: input.email }).select('+passwordHash')
  const isValidPassword = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : false

  if (!user || !isValidPassword) {
    throw new ApiError(401, 'Invalid email or password')
  }

  return sendSuccess(res, createAuthResponse(user))
}

export function getCurrentUser(req, res) {
  return sendSuccess(res, { user: publicUser(req.user) })
}
