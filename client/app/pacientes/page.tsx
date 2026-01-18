'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Paciente, Cita, Consulta } from '@/types';
import Pagination from '@/components/Pagination';

interface HistorialItem {
  id: number;
  tipo: 'Cita' | 'Consulta';
  fecha: string;
  descripcion: string;
  profesional: string;
  estado: string;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // --- ESTADOS PRINCIPALES ---
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<Paciente | null>(null);
  
  // --- PAGINACIÓN PRINCIPAL ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- ESTADOS PARA HISTORIAL CLÍNICO ---
  const [historialPaciente, setHistorialPaciente] = useState<Paciente | null>(null);
  const [historialItems, setHistorialItems] = useState<HistorialItem[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historyPage, setHistoryPage] = useState(1); 

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

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  // --- LÓGICA DE HISTORIAL CLÍNICO ---
  const handleOpenHistorial = async (paciente: Paciente) => {
    setHistorialPaciente(paciente);
    setLoadingHistorial(true);
    setHistoryPage(1);

    try {
      const [resCitas, resConsultas] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas?id_pac=${paciente.id_pac}`, { cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas?id_pac=${paciente.id_pac}`, { cache: 'no-store' })
      ]);

      const dataCitas: Cita[] = resCitas.ok ? await resCitas.json() : [];
      const dataConsultas: Consulta[] = resConsultas.ok ? await resConsultas.json() : [];

      const listaUnificada: HistorialItem[] = [];

      dataCitas.forEach(c => {
        listaUnificada.push({
          id: c.id_cit,
          tipo: 'Cita',
          fecha: c.fechaHora_cit,
          descripcion: c.tratamiento?.nombres_tra || 'Tratamiento',
          profesional: c.podologa ? `${c.podologa.nombres_pod} ${c.podologa.apellidos_pod}` : 'Sin asignar',
          estado: c.estado_cit
        });
      });

      dataConsultas.forEach(c => {
        listaUnificada.push({
          id: c.id_con,
          tipo: 'Consulta',
          fecha: c.fechaHora_con,
          descripcion: c.motivoConsulta_con,
          profesional: c.podologa ? `${c.podologa.nombres_pod} ${c.podologa.apellidos_pod}` : 'Sin asignar',
          estado: c.estado_con
        });
      });

      listaUnificada.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setHistorialItems(listaUnificada);

    } catch (error) {
      alert("Error cargando el historial clínico");
      console.error(error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setPacientes(pacientes.filter(p => p.id_pac !== id));
        if (seleccionado?.id_pac === id) setSeleccionado(null);
        alert('Paciente eliminado.');
        router.refresh(); 
      } else { alert('Error al eliminar paciente.'); }
    } catch (error) { alert('Error de conexión con el servidor.'); }
  };

  const formatDate = (iso: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('es-EC', { timeZone: 'UTC' });
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('es-EC', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStatusColor = (estado: string) => {
    switch(estado) {
        case 'pendiente': return 'bg-yellow-100 text-yellow-800';
        case 'completada': return 'bg-green-100 text-green-800';
        case 'cancelada': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pacientesFiltrados = pacientes.filter(p => {
      const termino = busqueda.toLowerCase();
      const nombreCompleto = `${p.nombres_pac} ${p.apellidos_pac}`.toLowerCase();
      const cedula = p.cedula_pac.toLowerCase();
      return nombreCompleto.includes(termino) || cedula.includes(termino);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pacientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (n: number) => setCurrentPage(n);

  // Paginación del Historial
  const idxLastHist = historyPage * itemsPerPage;
  const idxFirstHist = idxLastHist - itemsPerPage;
  const currentHistoryItems = historialItems.slice(idxFirstHist, idxLastHist);
  const paginateHistory = (n: number) => setHistoryPage(n);


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
                currentItems.map((pac) => (
                    <tr key={pac.id_pac} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pac.nombres_pac} {pac.apellidos_pac}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pac.cedula_pac}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pac.telefono_pac || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{pac.genero_pac}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => setSeleccionado(pac)} className="text-gray-600 hover:text-gray-900 font-bold" title="Ver Perfil">Ver</button>
                        
                        <button 
                            onClick={() => handleOpenHistorial(pac)} 
                            className="text-teal-600 hover:text-teal-900 font-bold"
                            title="Ver Historial Clínico"
                        >
                            Historial
                        </button>

                        <Link href={`/pacientes/${pac.id_pac}`} className="text-indigo-600 hover:text-indigo-900" title="Editar">Editar</Link>
                        <button onClick={() => handleDelete(pac.id_pac)} className="text-red-600 hover:text-red-900" title="Eliminar">Eliminar</button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
          
          <Pagination 
            itemsPerPage={itemsPerPage} 
            totalItems={pacientesFiltrados.length} 
            paginate={paginate} 
            currentPage={currentPage}
          />
      </div>

      {/* --- MODAL 1: PERFIL SIMPLE --- */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative animate-fade-in-up">
                <button onClick={() => setSeleccionado(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                <h2 className="text-xl font-bold text-pie-dark mb-4 border-b pb-2">Perfil del Paciente</h2>
                <div className="space-y-4">
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 text-2xl font-bold uppercase mb-2">
                            {seleccionado.nombres_pac[0]}{seleccionado.apellidos_pac[0]}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{seleccionado.nombres_pac} {seleccionado.apellidos_pac}</h3>
                        <p className="text-sm text-gray-500">{seleccionado.email_pac || 'Sin email'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Cédula</label><p className="font-medium">{seleccionado.cedula_pac}</p></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label><p className="font-medium">{seleccionado.telefono_pac || 'N/A'}</p></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Género</label><p className="capitalize">{seleccionado.genero_pac}</p></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha Nacimiento</label><p>{formatDate(seleccionado.fechaNac_pac)}</p></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Dirección Domiciliaria</label><p>{seleccionado.direccion_pac || 'Sin dirección registrada'}</p></div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Link href={`/pacientes/${seleccionado.id_pac}`} className="bg-pie-green text-white px-4 py-2 rounded hover:bg-pie-dark">Editar Datos</Link>
                    <button onClick={() => setSeleccionado(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">Cerrar</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: HISTORIAL CLÍNICO --- */}
      {historialPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header del Modal con la X */}
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-700">Historial Clínico</h2>
                        <p className="text-gray-600">
                            Paciente: <span className="font-bold text-gray-800">{historialPaciente.nombres_pac} {historialPaciente.apellidos_pac}</span>
                        </p>
                    </div>
                    <button onClick={() => setHistorialPaciente(null)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>

                {/* Contenido Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {loadingHistorial ? (
                        <div className="text-center py-10 text-gray-500">Cargando historial...</div>
                    ) : historialItems.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
                            Este paciente no tiene citas ni consultas registradas.
                        </div>
                    ) : (
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-teal-50">
                                    <tr>
                                        <th className="py-3 pl-4 text-left text-xs font-bold text-teal-800 uppercase">Fecha</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold text-teal-800 uppercase">Tipo</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold text-teal-800 uppercase">Motivo / Tratamiento</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold text-teal-800 uppercase">Especialista</th>
                                        <th className="px-3 py-3 text-center text-xs font-bold text-teal-800 uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentHistoryItems.map((item) => (
                                        <tr key={`${item.tipo}-${item.id}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatDateTime(item.fecha)}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.tipo === 'Consulta' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {item.tipo}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.descripcion}>
                                                {item.descripcion}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {item.profesional}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.estado)}`}>
                                                    {item.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer con Paginación (Sin botón Cerrar) */}
                {!loadingHistorial && historialItems.length > 0 && (
                    <div className="mt-4">
                        <Pagination 
                            itemsPerPage={itemsPerPage} 
                            totalItems={historialItems.length} 
                            paginate={paginateHistory} 
                            currentPage={historyPage} 
                        />
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}