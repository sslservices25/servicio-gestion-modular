import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 12;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface JWTPayload {
  userId: string;
  email: string;
  rol: 'admin' | 'tecnico';
  iat?: number;
  exp?: number;
}

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifica una contraseña contra su hash
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Hash almacenado
 * @returns true si la contraseña es correcta
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Genera un JWT token con los datos del usuario
 * @param payload - Datos del usuario
 * @returns JWT token firmado
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h', // Token expira en 24 horas
      issuer: 'servicio-gestion',
      audience: 'servicio-gestion-users'
    });
  } catch (error) {
    console.error('Error generating JWT:', error);
    throw new Error('Failed to generate JWT token');
  }
}

/**
 * Verifica y decodifica un JWT token
 * @param token - JWT token a verificar
 * @returns Payload decodificado o null si es inválido
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'servicio-gestion',
      audience: 'servicio-gestion-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}

/**
 * Extrae el token JWT del header Authorization de una request
 * @param request - NextRequest object
 * @returns Token JWT o null si no se encuentra
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7); // Remover 'Bearer ' prefix
  } catch (error) {
    console.error('Error extracting token from request:', error);
    return null;
  }
}

/**
 * Middleware helper para verificar autenticación
 * @param request - NextRequest object
 * @returns Usuario autenticado o null si no está autenticado
 */
export function getAuthenticatedUser(request: NextRequest): JWTPayload | null {
  try {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      return null;
    }
    
    return verifyJWT(token);
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Verifica si un usuario tiene un rol específico
 * @param user - Usuario autenticado
 * @param requiredRole - Rol requerido
 * @returns true si el usuario tiene el rol requerido
 */
export function hasRole(user: JWTPayload | null, requiredRole: 'admin' | 'tecnico'): boolean {
  if (!user) {
    return false;
  }
  
  return user.rol === requiredRole;
}

/**
 * Verifica si un usuario es admin
 * @param user - Usuario autenticado
 * @returns true si el usuario es admin
 */
export function isAdmin(user: JWTPayload | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Verifica si un usuario es técnico
 * @param user - Usuario autenticado
 * @returns true si el usuario es técnico
 */
export function isTecnico(user: JWTPayload | null): boolean {
  return hasRole(user, 'tecnico');
}

/**
 * Función de utilidad para verificar que la autenticación funciona correctamente
 * @param testPassword - Contraseña de prueba
 * @returns true si el hash/verificación funciona correctamente
 */
export async function testAuthentication(testPassword: string = 'testPassword123'): Promise<boolean> {
  try {
    const hashed = await hashPassword(testPassword);
    const isValid = await verifyPassword(testPassword, hashed);
    return isValid;
  } catch (error) {
    console.error('Authentication test failed:', error);
    return false;
  }
}
