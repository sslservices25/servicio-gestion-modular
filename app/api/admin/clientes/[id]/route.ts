import { NextRequest, NextResponse } from 'next/server';
import { db, cliente } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, isAdmin } from '@/lib/utils/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden actualizar clientes' },
        { status: 403 }
      );
    }

    const { id: clienteId } = await params;
    const body = await request.json();
    const { nombreContacto, emailCifrado, telefonoCifrado, direccion } = body;

    if (!nombreContacto || !emailCifrado) {
      return NextResponse.json(
        { error: 'Nombre de contacto y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe
    const [existingCliente] = await db
      .select()
      .from(cliente)
      .where(eq(cliente.clienteId, clienteId))
      .limit(1);

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Convertir strings base64 a Buffer
    const emailCifradoBuffer = Buffer.from(emailCifrado, 'base64');
    const telefonoCifradoBuffer = telefonoCifrado ? Buffer.from(telefonoCifrado, 'base64') : null;

    // Actualizar cliente
    await db
      .update(cliente)
      .set({
        nombreContacto,
        emailCifrado: emailCifradoBuffer,
        telefonoCifrado: telefonoCifradoBuffer,
        direccion: direccion || null,
      })
      .where(eq(cliente.clienteId, clienteId));

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
    });

  } catch (error) {
    console.error('Error updating cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


