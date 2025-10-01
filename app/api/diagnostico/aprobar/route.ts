import { NextRequest, NextResponse } from 'next/server';
import { db, diagnostico, logNotificacion, cliente } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diagnosticoId, token } = body;

    if (!diagnosticoId || !token) {
      return NextResponse.json(
        { error: 'Diagnóstico ID y token son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el token corresponde al diagnóstico
    const [clienteData] = await db
      .select()
      .from(cliente)
      .where(eq(cliente.tokenAcceso, token))
      .limit(1);

    if (!clienteData) {
      return NextResponse.json(
        { error: 'Token de acceso inválido' },
        { status: 401 }
      );
    }

    // Buscar el diagnóstico
    const [diagnosticoData] = await db
      .select()
      .from(diagnostico)
      .where(eq(diagnostico.diagnosticoId, diagnosticoId))
      .limit(1);

    if (!diagnosticoData) {
      return NextResponse.json(
        { error: 'Diagnóstico no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el diagnóstico está en estado de aprobación
    if (diagnosticoData.estado !== 'aprobacion') {
      return NextResponse.json(
        { error: 'El diagnóstico no está en estado de aprobación' },
        { status: 400 }
      );
    }

    // Actualizar el diagnóstico
    await db
      .update(diagnostico)
      .set({
        aprobacionCliente: true,
        estado: 'reparacion',
        fechaActualizacion: new Date(),
      })
      .where(eq(diagnostico.diagnosticoId, diagnosticoId));

    // Crear log de notificación
    await db.insert(logNotificacion).values({
      diagnosticoId,
      tipo: 'admin_alert',
      destinatario: 'admin@sistema.com',
      mensaje: `Cliente ${clienteData.nombreContacto} ha aprobado el presupuesto del diagnóstico ${diagnosticoId}`,
      exitoso: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Presupuesto aprobado exitosamente',
    });

  } catch (error) {
    console.error('Error approving presupuesto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
