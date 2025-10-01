'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decrypt } from '@/lib/utils/encryption';
import { validateData, updateDiagnosticoSchema, type UpdateDiagnosticoInput } from '@/lib/utils/validation';

interface DiagnosticoData {
  diagnosticoId: string;
  estado: string;
  prioridad: string;
  descripcionFalla: string;
  prediagnosticoIa: string | null;
  diagnosticoTecnico: string | null;
  presupuestoEstimado: string | null;
  aprobacionCliente: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  equipo: {
    tipo: string;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    anioFabricacion: string | null;
  };
  cliente: {
    nombreContacto: string;
    email: string;
    telefono: string | null;
    direccion: string | null;
  };
  archivos: Array<{
    archivoId: string;
    urlStorage: string;
    nombreOriginal: string;
    tipoMime: string | null;
    tipoArchivo: string;
    fechaSubida: string;
  }>;
}

export default function DiagnosticoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const diagnosticoId = params.id as string;
  
  const [diagnostico, setDiagnostico] = useState<DiagnosticoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateDiagnosticoInput>({
    diagnosticoTecnico: '',
    presupuestoEstimado: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDiagnostico = async () => {
      try {
        const response = await fetch(`/api/tecnico/diagnostico/${diagnosticoId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener el diagnóstico');
        }

        // Descifrar datos sensibles del cliente
        const clienteData = {
          ...data.cliente,
          email: decrypt(Buffer.from(data.cliente.emailCifrado, 'base64')),
          telefono: data.cliente.telefonoCifrado ? decrypt(Buffer.from(data.cliente.telefonoCifrado, 'base64')) : null,
        };

        setDiagnostico({
          ...data,
          cliente: clienteData,
        });

        // Inicializar formulario
        setFormData({
          diagnosticoTecnico: data.diagnosticoTecnico || '',
          presupuestoEstimado: data.presupuestoEstimado ? parseFloat(data.presupuestoEstimado) : undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    if (diagnosticoId) {
      fetchDiagnostico();
    }
  }, [diagnosticoId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validar datos del formulario
      const validatedData = validateData(updateDiagnosticoSchema, formData);

      const response = await fetch(`/api/tecnico/diagnostico/${diagnosticoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el diagnóstico');
      }

      // Actualizar el estado local
      if (diagnostico) {
        setDiagnostico({
          ...diagnostico,
          diagnosticoTecnico: validatedData.diagnosticoTecnico,
          presupuestoEstimado: validatedData.presupuestoEstimado?.toString() || null,
          estado: 'aprobacion', // Cambiar estado a aprobación
          fechaActualizacion: new Date().toISOString(),
        });
      }

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'presupuestoEstimado' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'prediagnostico':
        return 'bg-blue-100 text-blue-800';
      case 'asignado':
        return 'bg-purple-100 text-purple-800';
      case 'visita':
        return 'bg-orange-100 text-orange-800';
      case 'aprobacion':
        return 'bg-indigo-100 text-indigo-800';
      case 'reparacion':
        return 'bg-green-100 text-green-800';
      case 'facturacion':
        return 'bg-gray-100 text-gray-800';
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'baja':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'critica':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!diagnostico) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg">No se encontró el diagnóstico</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Diagnóstico #{diagnostico.diagnosticoId.slice(0, 8)}
                </h1>
                <p className="text-gray-600">
                  {diagnostico.equipo.tipo}
                  {diagnostico.equipo.marca && ` - ${diagnostico.equipo.marca}`}
                  {diagnostico.equipo.modelo && ` ${diagnostico.equipo.modelo}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(diagnostico.estado)}`}>
                  {diagnostico.estado.charAt(0).toUpperCase() + diagnostico.estado.slice(1)}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPrioridadColor(diagnostico.prioridad)}`}>
                  {diagnostico.prioridad.charAt(0).toUpperCase() + diagnostico.prioridad.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Cliente */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-gray-900">{diagnostico.cliente.nombreContacto}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{diagnostico.cliente.email}</p>
                </div>
                {diagnostico.cliente.telefono && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-gray-900">{diagnostico.cliente.telefono}</p>
                  </div>
                )}
                {diagnostico.cliente.direccion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <p className="text-gray-900">{diagnostico.cliente.direccion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información del Equipo */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Equipo</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <p className="text-gray-900">{diagnostico.equipo.tipo}</p>
                </div>
                {diagnostico.equipo.marca && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marca</label>
                    <p className="text-gray-900">{diagnostico.equipo.marca}</p>
                  </div>
                )}
                {diagnostico.equipo.modelo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Modelo</label>
                    <p className="text-gray-900">{diagnostico.equipo.modelo}</p>
                  </div>
                )}
                {diagnostico.equipo.numeroSerie && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
                    <p className="text-gray-900">{diagnostico.equipo.numeroSerie}</p>
                  </div>
                )}
                {diagnostico.equipo.anioFabricacion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Año de Fabricación</label>
                    <p className="text-gray-900">{diagnostico.equipo.anioFabricacion}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {/* Descripción de la Falla */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción de la Falla</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{diagnostico.descripcionFalla}</p>
            </div>

            {/* Prediagnóstico IA */}
            {diagnostico.prediagnosticoIa && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediagnóstico IA</h3>
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{diagnostico.prediagnosticoIa}</p>
              </div>
            )}

            {/* Diagnóstico Técnico */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Diagnóstico Técnico</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Editar
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnóstico Técnico *
                    </label>
                    <textarea
                      name="diagnosticoTecnico"
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.diagnosticoTecnico}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto Estimado
                    </label>
                    <input
                      type="number"
                      name="presupuestoEstimado"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.presupuestoEstimado || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {diagnostico.diagnosticoTecnico ? (
                    <p className="text-gray-700 bg-green-50 p-4 rounded-lg">{diagnostico.diagnosticoTecnico}</p>
                  ) : (
                    <p className="text-gray-500 italic">No se ha realizado el diagnóstico técnico</p>
                  )}
                  
                  {diagnostico.presupuestoEstimado && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Presupuesto Estimado</label>
                      <p className="text-2xl font-bold text-green-600">${diagnostico.presupuestoEstimado}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Archivos Adjuntos */}
            {diagnostico.archivos.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Archivos Adjuntos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnostico.archivos.map((archivo) => (
                    <div key={archivo.archivoId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{archivo.nombreOriginal}</p>
                          <p className="text-sm text-gray-500">{archivo.tipoArchivo}</p>
                        </div>
                        <a
                          href={archivo.urlStorage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Ver
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón Volver */}
        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

