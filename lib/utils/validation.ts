import { z } from 'zod';

// Esquemas de validación para autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const createUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'tecnico'], { message: 'Rol es requerido' }),
  nombreCompleto: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

// Esquemas de validación para cliente
export const createClienteSchema = z.object({
  nombreContacto: z.string().min(2, 'El nombre de contacto es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos').optional(),
  direccion: z.string().optional(),
  tipoEquipo: z.string().min(2, 'El tipo de equipo es requerido'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  anioFabricacion: z.string().length(4, 'El año debe tener 4 dígitos').optional(),
  descripcionFalla: z.string().min(10, 'La descripción de la falla debe tener al menos 10 caracteres'),
});

// Esquemas de validación para diagnóstico
export const updateDiagnosticoSchema = z.object({
  diagnosticoTecnico: z.string().min(10, 'El diagnóstico técnico debe tener al menos 10 caracteres'),
  presupuestoEstimado: z.number().min(0, 'El presupuesto no puede ser negativo').optional(),
});

export const asignarTecnicoSchema = z.object({
  tecnicoAsignadoId: z.string().uuid('ID de técnico inválido'),
});

// Esquemas de validación para archivos
export const archivoSchema = z.object({
  nombreOriginal: z.string().min(1, 'El nombre del archivo es requerido'),
  tipoMime: z.string().min(1, 'El tipo MIME es requerido'),
  tipoArchivo: z.enum(['foto_falla', 'video_operacion', 'reporte_pdf', 'manual_plano', 'registro_mantenimiento', 'otro']),
  checksumHash: z.string().length(64, 'El checksum debe tener 64 caracteres'),
});

// Esquemas de validación para notificaciones
export const createNotificacionSchema = z.object({
  tipo: z.enum(['whatsapp', 'email', 'admin_alert']),
  destinatario: z.string().min(1, 'El destinatario es requerido'),
  mensaje: z.string().min(1, 'El mensaje es requerido'),
  diagnosticoId: z.string().uuid('ID de diagnóstico inválido').optional(),
});

// Tipos TypeScript derivados de los esquemas
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateDiagnosticoInput = z.infer<typeof updateDiagnosticoSchema>;
export type AsignarTecnicoInput = z.infer<typeof asignarTecnicoSchema>;
export type ArchivoInput = z.infer<typeof archivoSchema>;
export type CreateNotificacionInput = z.infer<typeof createNotificacionSchema>;

// Función helper para validar datos
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation error: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}
