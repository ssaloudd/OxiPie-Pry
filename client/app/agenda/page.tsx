'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cita, Consulta, Paciente, Podologa } from '@/types';

// ... (Interface EventoAgenda igual que antes) ...
interface EventoAgenda {
  tipo: 'cita' | 'consulta';
  id: number;
  horaInicio: string;
  horaFin: string;
  id_pac: number;
  id_pod?: number;
  titulo: string;
  subtitulo?: string;
  estado: string;
  color: string;
  datosCompletos?: any; // Para mostrar detalles en modal
}

export default function AgendaPage() {
  const router = useRouter();
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADO DEL MODAL ---
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoAgenda | null>(null);

  useEffect(() => {
    // ... (Tu lógica de fetchData existente, idéntica a la anterior) ...
    // ... Solo asegúrate de agregar "datosCompletos: c" al crear el objeto EventoAgenda ...
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resPac, resPod] = await Promise.all([
                 fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`),
                 fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`)
            ]);
            const dataPac = await resPac.json();
            const dataPod = await resPod.json();
            setPacientes(dataPac);
            setPodologas(dataPod);
    
            const [resCitas, resConsultas] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas?fecha=${fecha}`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas?fecha=${fecha}`)
            ]);
            const dataCitas: Cita[] = await resCitas.json();
            const dataConsultas: Consulta[] = await resConsultas.json();
    
            const lista: EventoAgenda[] = [];
    
            dataCitas.forEach(c => lista.push({
                tipo: 'cita', id: c.id_cit, horaInicio: c.horaInicio_cit, horaFin: c.horaFin_cit,
                id_pac: c.id_pac, id_pod: c.id_pod, titulo: 'Cita Tratamiento', subtitulo: c.tratamiento?.nombres_tra,
                estado: c.estado_cit, color: 'border-l-4 border-pie-green bg-green-50',
                datosCompletos: c // Guardamos el objeto original
            }));
    
            dataConsultas.forEach(c => lista.push({
                tipo: 'consulta', id: c.id_con, horaInicio: c.horaInicio_con, horaFin: c.horaFin_con,
                id_pac: c.id_pac, id_pod: c.id_pod, titulo: 'Consulta Diagnóstico', subtitulo: c.motivoConsulta_con,
                estado: c.estado_con, color: 'border-l-4 border-oxi-blue bg-blue-50',
                datosCompletos: c // Guardamos el objeto original
            }));
    
            lista.sort((a, b) => new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime());
            setEventos(lista);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [fecha]);

  // Helpers
  const getNombrePaciente = (id: number) => {
      const p = pacientes.find(x => x.id_pac === id);
      return p ? `${p.nombres_pac} ${p.apellidos_pac}` : '...';
  };
  const getNombrePodologa = (id?: number) => {
      if(!id) return 'Sin asignar';
      const p = podologas.find(x => x.id_pod === id);
      return p ? `${p.nombres_pod} ${p.apellidos_pod}` : '...';
  };
  const formatHora = (iso: string) => iso ? new Date(iso).toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit', hour12:false}) : '';

  // --- RENDER ---
  return (
    <div className="px-4 mt-6 max-w-5xl mx-auto relative">
      {/* ... (Cabecera y Filtros idénticos a antes) ... */}
      <div className="md:flex md:items-center md:justify-between mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-oxi-dark">Agenda Diaria</h1>
        <div className="flex gap-2">
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border p-2 rounded"/>
            <Link href="/agenda/nueva" className="bg-pie-green text-white px-4 py-2 rounded">+ Cita</Link>
        </div>
      </div>

      {/* LISTA DE EVENTOS */}
      <div className="space-y-2">
        {eventos.map((ev) => (
            <div key={`${ev.tipo}-${ev.id}`} 
                 onClick={() => setEventoSeleccionado(ev)} // AL CLICK: ABRIR MODAL
                 className={`p-4 rounded shadow-sm cursor-pointer hover:shadow-md transition ${ev.color} flex justify-between items-center`}
            >
                <div className="flex gap-4">
                    <div className="text-center bg-white/80 p-2 rounded min-w-[70px]">
                        <div className="font-bold text-lg">{formatHora(ev.horaInicio)}</div>
                        <div className="text-xs text-gray-500">{formatHora(ev.horaFin)}</div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{getNombrePaciente(ev.id_pac)}</h3>
                        <p className="text-sm text-gray-600">{ev.titulo} - {ev.subtitulo}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium">{getNombrePodologa(ev.id_pod)}</div>
                    <span className="text-xs px-2 py-1 rounded bg-white border uppercase">{ev.estado}</span>
                </div>
            </div>
        ))}
        {eventos.length === 0 && <p className="text-center py-10 text-gray-400">Sin eventos</p>}
      </div>

      {/* --- MODAL POP-UP --- */}
      {eventoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative animate-fade-in-up">
                  
                  {/* Cerrar */}
                  <button onClick={() => setEventoSeleccionado(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                  
                  {/* Título */}
                  <h2 className="text-xl font-bold text-oxi-dark mb-1 border-b pb-2">
                      {eventoSeleccionado.tipo === 'cita' ? '🟢 Detalle de Cita' : '🔵 Detalle de Consulta'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">ID: {eventoSeleccionado.id}</p>

                  {/* Contenido */}
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Paciente</label>
                          <p className="text-lg font-medium">{getNombrePaciente(eventoSeleccionado.id_pac)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Horario</label>
                              <p>{formatHora(eventoSeleccionado.horaInicio)} - {formatHora(eventoSeleccionado.horaFin)}</p>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Especialista</label>
                              <p>{getNombrePodologa(eventoSeleccionado.id_pod)}</p>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded border">
                          <label className="text-xs font-bold text-gray-500 uppercase">Motivo / Tratamiento</label>
                          <p className="text-gray-800">{eventoSeleccionado.subtitulo || 'Sin descripción'}</p>
                          
                          {eventoSeleccionado.tipo === 'cita' && (
                              <p className="mt-2 text-sm text-gray-600 italic">
                                  "{eventoSeleccionado.datosCompletos.notasAdicionales_cit || 'Sin notas adicionales'}"
                              </p>
                          )}
                      </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="mt-6 flex justify-end gap-3">
                      <button 
                          onClick={() => {
                              // Navegar a la página de edición completa
                              const ruta = eventoSeleccionado.tipo === 'cita' 
                                  ? `/citas/${eventoSeleccionado.id}` 
                                  : `/consultas/${eventoSeleccionado.id}`;
                              router.push(ruta);
                          }}
                          className="bg-oxi-blue text-white px-4 py-2 rounded hover:bg-oxi-dark transition"
                      >
                          Editar / Completar
                      </button>
                      <button onClick={() => setEventoSeleccionado(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                          Cerrar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}