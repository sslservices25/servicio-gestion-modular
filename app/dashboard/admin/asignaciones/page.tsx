'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  rol: 'admin' | 'tecnico';
}

interface Diagnostico {
  diagnosticoId: string;
  estado: string;
  prioridad: string;
  descripcionFalla: string;
  fechaCreacion: string;
  equipo: {
    tipo: string;
    marca: string | null;
    modelo: string | null;
  };
  cliente: {
    nombreContacto: string;
  };
}

interface Tecnico {
  usuarioId: string;
  email: string;
  nombreCompleto: string;
  activo: boolean;
}

export default function AsignacionesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok) {
          setUser(data.user);
          // Si es admin, cargar datos
          if (data.user.rol === 'admin') {
            await Promise.all([
              fetchDiagnosticos(),
              fetchTecnicos()
            ]);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const fetchDiagnosticos = async () => {
    try {
      const response = await fetch('/api/admin/diagnosticos-pendientes');
      const data = await response.json();
      
      if (response.ok) {
        setDiagnosticos(data.diagnosticos);
      } else {
        setError(data.error || 'Error al cargar diagnósticos');
      }
    } catch (error) {
      console.error('Error fetching diagnosticos:', error);
      setError('Error al cargar diagnósticos');
    }
  };

  const fetchTecnicos = async () => {
    try {
      const response = await fetch('/api/admin/tecnicos');
      const data = await response.json();
      
      if (response.ok) {
        setTecnicos(data.tecnicos);
      } else {
        setError(data.error || 'Error al cargar técnicos');
      }
    } catch (error) {
      console.error('Error fetching tecnicos:', error);
      setError('Error al cargar técnicos');
    }
  };

  const handleAsignar = async (diagnosticoId: string, tecnicoId: string) => {
    try {
      setAsignando(diagnosticoId);
      
      const response = await fetch('/api/admin/asignar-diagnostico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosticoId,
          tecnicoId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar diagnóstico');
      }

      // Recargar diagnósticos
      await fetchDiagnosticos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar diagnóstico');
    } finally {
      setAsignando(null);
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

  if (!user || user.rol !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Asignación de Servicios</h1>
          <p className="text-gray-600">Asignar diagnósticos pendientes a técnicos</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Lista de Diagnósticos Pendientes */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Diagnósticos Pendientes de Asignación</h2>
          </div>
          
          {diagnosticos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No hay diagnósticos pendientes de asignación</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {diagnosticos.map((diagnostico) => (
                <div key={diagnostico.diagnosticoId} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {diagnostico.equipo.tipo}
                          {diagnostico.equipo.marca && ` - ${diagnostico.equipo.marca}`}
                          {diagnostico.equipo.modelo && ` ${diagnostico.equipo.modelo}`}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadColor(diagnostico.prioridad)}`}>
                          {diagnostico.prioridad.charAt(0).toUpperCase() + diagnostico.prioridad.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Cliente: {diagnostico.cliente.nombreContacto}
                      </p>
                      
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {diagnostico.descripcionFalla}
                      </p>
                      
                      <p className="text-sm text-gray-500">
                        Creado: {new Date(diagnostico.fechaCreacion).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <div className="flex items-center space-x-3">
                        <select
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAsignar(diagnostico.diagnosticoId, e.target.value);
                            }
                          }}
                          disabled={asignando === diagnostico.diagnosticoId}
                        >
                          <option value="">Seleccionar técnico</option>
                          {tecnicos
                            .filter(tecnico => tecnico.activo)
                            .map((tecnico) => (
                              <option key={tecnico.usuarioId} value={tecnico.usuarioId}>
                                {tecnico.nombreCompleto} ({tecnico.email})
                              </option>
                            ))}
                        </select>
                        
                        {asignando === diagnostico.diagnosticoId && (
                          <div className="text-sm text-gray-500">Asignando...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información de Técnicos Disponibles */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Técnicos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tecnicos
              .filter(tecnico => tecnico.activo)
              .map((tecnico) => (
                <div key={tecnico.usuarioId} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900">{tecnico.nombreCompleto}</div>
                  <div className="text-sm text-gray-500">{tecnico.email}</div>
                  <div className="mt-2">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Disponible
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

