import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { parseCookie, stringifySetCookie } from 'cookie'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const COOKIE_NAME = 'session'
const SESSION_DAYS = 7

interface SessionPayload extends JWTPayload {
  sub: string
  email: string
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('Missing AUTH_SECRET env var')
  return new TextEncoder().encode(secret)
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret())
    return payload
  } catch {
    return null
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  res.setHeader(
    'Set-Cookie',
    stringifySetCookie({ name: COOKIE_NAME, value: token, ...cookieOptions(SESSION_DAYS * 24 * 60 * 60) }),
  )
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', stringifySetCookie({ name: COOKIE_NAME, value: '', ...cookieOptions(0) }))
}

export function getSessionToken(req: VercelRequest): string | undefined {
  return parseCookie(req.headers.cookie ?? '')[COOKIE_NAME]
}
