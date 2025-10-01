'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { decrypt, encrypt } from '@/lib/utils/encryption';

interface User {
  id: string;
  email: string;
  rol: 'admin' | 'tecnico';
}

interface Cliente {
  clienteId: string;
  nombreContacto: string;
  emailCifrado: string;
  telefonoCifrado: string | null;
  direccion: string | null;
  fechaRegistro: string;
  equipos: Array<{
    equipoId: string;
    tipo: string;
    marca: string | null;
    modelo: string | null;
  }>;
  email: string;
  telefono: string | null;
}

export default function ClientesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nombreContacto: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok) {
          setUser(data.user);
          // Si es admin, cargar clientes
          if (data.user.rol === 'admin') {
            await fetchClientes();
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/admin/clientes');
      const data = await response.json();
      
      if (response.ok) {
        // Descifrar datos sensibles
        const clientesDescifrados = data.clientes.map((cliente: Cliente & { email: string; telefono: string | null }) => ({
          ...cliente,
          email: decrypt(Buffer.from(cliente.emailCifrado, 'base64')),
          telefono: cliente.telefonoCifrado ? decrypt(Buffer.from(cliente.telefonoCifrado, 'base64')) : null,
        }));
        setClientes(clientesDescifrados);
      } else {
        setError(data.error || 'Error al cargar clientes');
      }
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setError('Error al cargar clientes');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombreContacto: cliente.nombreContacto,
      email: cliente.email,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
    });
  };

  const handleSave = async () => {
    if (!editingCliente) return;

    try {
      // Cifrar datos sensibles
      const emailCifrado = encrypt(formData.email);
      const telefonoCifrado = formData.telefono ? encrypt(formData.telefono) : null;

      const response = await fetch(`/api/admin/clientes/${editingCliente.clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreContacto: formData.nombreContacto,
          emailCifrado: emailCifrado.toString('base64'),
          telefonoCifrado: telefonoCifrado ? telefonoCifrado.toString('base64') : null,
          direccion: formData.direccion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar cliente');
      }

      // Recargar clientes
      await fetchClientes();
      setEditingCliente(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cliente');
    }
  };

  const handleCancel = () => {
    setEditingCliente(null);
    setFormData({
      nombreContacto: '',
      email: '',
      telefono: '',
      direccion: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600">Administrar información de clientes de forma segura</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Lista de Clientes */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Clientes Registrados</h2>
          </div>
          
          {clientes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No hay clientes registrados</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <div key={cliente.clienteId} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cliente.nombreContacto}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ID: {cliente.clienteId.slice(0, 8)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-900">{cliente.email}</p>
                        </div>
                        
                        {cliente.telefono && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <p className="text-gray-900">{cliente.telefono}</p>
                          </div>
                        )}
                        
                        {cliente.direccion && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Dirección</label>
                            <p className="text-gray-900">{cliente.direccion}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipos</label>
                        {cliente.equipos.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {cliente.equipos.map((equipo) => (
                              <span
                                key={equipo.equipoId}
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {equipo.tipo}
                                {equipo.marca && ` - ${equipo.marca}`}
                                {equipo.modelo && ` ${equipo.modelo}`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No hay equipos registrados</p>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        Registrado: {new Date(cliente.fechaRegistro).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Edición */}
        {editingCliente && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Editar Cliente
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre de Contacto
                    </label>
                    <input
                      type="text"
                      name="nombreContacto"
                      value={formData.nombreContacto}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <textarea
                      name="direccion"
                      rows={3}
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
