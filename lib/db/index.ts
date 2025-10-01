import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Configuración de la conexión usando Pooler para Serverless
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Crear cliente postgres con configuración optimizada para serverless
const client = postgres(connectionString, {
  max: 1, // Máximo 1 conexión para serverless
  idle_timeout: 20, // 20 segundos de timeout
  connect_timeout: 10, // 10 segundos para conectar
});

// Crear instancia de Drizzle con el schema
export const db = drizzle(client, { schema });

// Exportar el schema para uso en otras partes de la aplicación
export * from './schema';
