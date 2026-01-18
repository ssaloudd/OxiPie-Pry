'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Paciente } from '@/types';
import { useRouter } from 'next/navigation';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Estado para búsqueda y Modal
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<Paciente | null>(null);

  const fetchPacientes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPacientes(data);
      }
    } catch (error) {
      console.error("Error cargando pacientes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer.')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes/${id}`, { 
        method: 'DELETE',
       });

      if (res.ok || res.status === 204) {
        // Actualizamos el estado local filtrando el eliminado para no recargar página
        setPacientes(pacientes.filter(p => p.id_pac !== id));
        if (seleccionado?.id_pac === id) setSeleccionado(null);
        
        alert('Paciente eliminado.');
        router.refresh(); 
      } else {
        alert('Error al eliminar paciente.'); 
      }
    } catch (error) {
      alert('Error de conexión con el servidor.');
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('es-EC', { timeZone: 'UTC' });
  };

  // --- LÓGICA DE FILTRADO ---
  const pacientesFiltrados = pacientes.filter(p => {
      const termino = busqueda.toLowerCase();
      const nombreCompleto = `${p.nombres_pac} ${p.apellidos_pac}`.toLowerCase();
      const cedula = p.cedula_pac.toLowerCase();
      
      return nombreCompleto.includes(termino) || cedula.includes(termino);
  });

  if (loading) return <div className="text-center mt-10 text-oxi-blue font-bold">Cargando pacientes...</div>;

  return (
    <div className="px-4 mt-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-oxi-dark">Directorio de Pacientes</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de historias clínicas</p>
        </div>
        
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
             <Link href="/pacientes/nuevo" className="bg-pie-green text-white px-4 py-2 rounded shadow hover:bg-pie-dark font-medium inline-flex items-center">
                <span>+ Nuevo Paciente</span>
             </Link>
        </div>
      </div>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="mb-4 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
          </div>
          <input 
              type="text" 
              placeholder="Buscar por nombre, apellido o cédula..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-oxi-blue focus:border-oxi-blue sm:text-sm"
          />
      </div>
      
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Género</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pacientesFiltrados.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                          {busqueda ? `No se encontraron resultados para "${busqueda}"` : 'No hay pacientes registrados.'}
                      </td>
                  </tr>
              ) : (
                pacientesFiltrados.map((pac) => (
                    <tr key={pac.id_pac} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pac.nombres_pac} {pac.apellidos_pac}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pac.cedula_pac}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pac.telefono_pac || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{pac.genero_pac}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        {/* Botón Ver abre el modal */}
                        <button onClick={() => setSeleccionado(pac)} className="text-blue-600 hover:text-blue-900 font-bold">Ver</button>
                        <Link href={`/pacientes/${pac.id_pac}`} className="text-indigo-600 hover:text-indigo-900">Editar</Link>
                        <button onClick={() => handleDelete(pac.id_pac)} className="text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* --- MODAL DETALLE PACIENTE --- */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative animate-fade-in-up">
                <button onClick={() => setSeleccionado(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                
                <h2 className="text-xl font-bold text-pie-dark mb-4 border-b pb-2">
                    Historia Personal
                </h2>

                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 text-2xl font-bold uppercase mb-2">
                            {seleccionado.nombres_pac[0]}{seleccionado.apellidos_pac[0]}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{seleccionado.nombres_pac} {seleccionado.apellidos_pac}</h3>
                        <p className="text-sm text-gray-500">{seleccionado.email_pac || 'Sin email'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Cédula</label>
                            <p className="font-medium">{seleccionado.cedula_pac}</p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                             <p className="font-medium">{seleccionado.telefono_pac || 'N/A'}</p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Género</label>
                             <p className="capitalize">{seleccionado.genero_pac}</p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Fecha Nacimiento</label>
                             <p>{formatDate(seleccionado.fechaNac_pac)}</p>
                        </div>
                        <div className="col-span-2">
                             <label className="text-xs font-bold text-gray-500 uppercase">Dirección Domiciliaria</label>
                             <p>{seleccionado.direccion_pac || 'Sin dirección registrada'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Link href={`/pacientes/${seleccionado.id_pac}`} className="bg-pie-green text-white px-4 py-2 rounded hover:bg-pie-dark">
                        Editar Datos
                    </Link>
                    <button onClick={() => setSeleccionado(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}