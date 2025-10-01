import { NextRequest, NextResponse } from 'next/server';
import { db, cliente, equipo, diagnostico, archivoAdjunto } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { validateData, createClienteSchema } from '@/lib/utils/validation';
import { encrypt } from '@/lib/utils/encryption';
import { put } from '@vercel/blob';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extraer datos del formulario
    const dataString = formData.get('data') as string;
    if (!dataString) {
      return NextResponse.json(
        { error: 'Datos del formulario no encontrados' },
        { status: 400 }
      );
    }

    const data = JSON.parse(dataString);
    
    // Validar datos de entrada
    const validatedData = validateData(createClienteSchema, data);
    
    // Extraer archivos
    const archivos = formData.getAll('archivos') as File[];
    if (!archivos || archivos.length === 0) {
      return NextResponse.json(
        { error: 'Debe subir al menos un archivo' },
        { status: 400 }
      );
    }

    if (archivos.length > 5) {
      return NextResponse.json(
        { error: 'Máximo 5 archivos permitidos' },
        { status: 400 }
      );
    }

    // Generar token de acceso único
    const tokenAcceso = crypto.randomBytes(32).toString('hex');

    // Usar transacción para asegurar consistencia
    const result = await db.transaction(async (tx) => {
      try {
        // 1. Cifrar datos sensibles
        const emailCifrado = encrypt(validatedData.email);
        const telefonoCifrado = validatedData.telefono ? encrypt(validatedData.telefono) : null;

        // 2. Crear cliente
        const [nuevoCliente] = await tx.insert(cliente).values({
          nombreContacto: validatedData.nombreContacto,
          emailCifrado,
          telefonoCifrado,
          direccion: validatedData.direccion,
          tokenAcceso,
        }).returning();

        // 3. Crear equipo
        const [nuevoEquipo] = await tx.insert(equipo).values({
          clienteId: nuevoCliente.clienteId,
          tipo: validatedData.tipoEquipo,
          marca: validatedData.marca,
          modelo: validatedData.modelo,
          numeroSerie: validatedData.numeroSerie,
          anioFabricacion: validatedData.anioFabricacion,
        }).returning();

        // 4. Crear diagnóstico
        const [nuevoDiagnostico] = await tx.insert(diagnostico).values({
          equipoId: nuevoEquipo.equipoId,
          prioridad: 'media', // Prioridad por defecto
          estado: 'pendiente',
          descripcionFalla: validatedData.descripcionFalla,
        }).returning();

        // 5. Procesar archivos
        const archivosCreados = [];
        
        for (const archivo of archivos) {
          try {
            // Calcular checksum SHA-256
            const buffer = await archivo.arrayBuffer();
            const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
            
            // Verificar si el archivo ya existe (checksum único)
            const archivoExistente = await tx.select()
              .from(archivoAdjunto)
              .where(eq(archivoAdjunto.checksumHash, hash))
              .limit(1);
            
            if (archivoExistente.length > 0) {
              throw new Error(`El archivo ${archivo.name} ya existe en el sistema`);
            }

            // Subir archivo a Vercel Blob
            const blob = await put(archivo.name, archivo, {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN!,
            });

            // Determinar tipo de archivo basado en MIME type
            let tipoArchivo: 'foto_falla' | 'video_operacion' | 'reporte_pdf' | 'manual_plano' | 'registro_mantenimiento' | 'otro' = 'otro';
            
            if (archivo.type.startsWith('image/')) {
              tipoArchivo = 'foto_falla';
            } else if (archivo.type.startsWith('video/')) {
              tipoArchivo = 'video_operacion';
            } else if (archivo.type === 'application/pdf') {
              tipoArchivo = 'reporte_pdf';
            }

            // Crear registro de archivo adjunto
            const [nuevoArchivo] = await tx.insert(archivoAdjunto).values({
              diagnosticoId: nuevoDiagnostico.diagnosticoId,
              urlStorage: blob.url,
              nombreOriginal: archivo.name,
              tipoMime: archivo.type,
              tipoArchivo,
              checksumHash: hash,
            }).returning();

            archivosCreados.push(nuevoArchivo);
          } catch (error) {
            console.error(`Error procesando archivo ${archivo.name}:`, error);
            throw new Error(`Error procesando archivo ${archivo.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          }
        }

        return {
          cliente: nuevoCliente,
          equipo: nuevoEquipo,
          diagnostico: nuevoDiagnostico,
          archivos: archivosCreados,
          token: tokenAcceso,
        };
      } catch (error) {
        console.error('Error en transacción:', error);
        throw error;
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud creada exitosamente',
      token: result.token,
      diagnosticoId: result.diagnostico.diagnosticoId,
    });

  } catch (error) {
    console.error('Error creating cliente:', error);
    
    if (error instanceof Error && error.message.includes('Validation error')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('ya existe en el sistema')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
