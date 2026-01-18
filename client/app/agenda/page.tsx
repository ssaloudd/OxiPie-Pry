'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cita, Consulta, Paciente, Podologa } from '@/types';
import SearchableSelect from '@/components/SearchableSelect'; // Asegúrate de tener este componente
import { 
  format, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, isSameDay, 
  addMonths, subMonths, isToday, parseISO 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Interface unificada
interface EventoAgenda {
  tipo: 'cita' | 'consulta';
  id: number;
  horaInicio: string; // ISO String
  horaFin: string;    // ISO String
  id_pac: number;
  id_pod?: number;
  titulo: string;
  subtitulo?: string;
  estado: string;
  color: string;
  datosCompletos?: any;
  fecha: Date; // Objeto Date para comparaciones fáciles en calendario
}

export default function AgendaPage() {
  const router = useRouter();
  
  // --- ESTADOS CALENDARIO ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // --- ESTADOS FILTROS ---
  const [filterPac, setFilterPac] = useState<string | number>('');
  const [filterPod, setFilterPod] = useState<string | number>('');
  
  // --- ESTADOS DATOS ---
  // "eventosMes" contiene TODO lo del mes (filtrado o no) para pintar los círculos
  const [eventosMes, setEventosMes] = useState<EventoAgenda[]>([]);
  // "eventosDia" son los que se muestran a la derecha
  const [eventosDia, setEventosDia] = useState<EventoAgenda[]>([]);
  
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoAgenda | null>(null);

  // 1. Cargar Catálogos Iniciales
  useEffect(() => {
     const cargarCatalogos = async () => {
         try {
             const [resPac, resPod] = await Promise.all([
                 fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`),
                 fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`)
             ]);
             setPacientes(await resPac.json());
             setPodologas(await resPod.json());
         } catch(e) { console.error(e); }
     };
     cargarCatalogos();
  }, []);

  // 2. Cargar Eventos cuando cambia el MES o los FILTROS
  useEffect(() => {
    const fetchEventosDelMes = async () => {
        setLoading(true);
        try {
            // Formato YYYY-MM para filtrar todo el mes
            const mesStr = format(currentMonth, 'yyyy-MM');
            
            // Construir Query Params
            const params = new URLSearchParams({ mes: mesStr });
            if (filterPac) params.append('id_pac', filterPac.toString());
            if (filterPod) params.append('id_pod', filterPod.toString());

            const [resCitas, resConsultas] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas?${params}`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas?${params}`)
            ]);
            
            const dataCitas: Cita[] = await resCitas.json();
            const dataConsultas: Consulta[] = await resConsultas.json();

            const lista: EventoAgenda[] = [];

            dataCitas.forEach(c => lista.push({
                tipo: 'cita', id: c.id_cit, 
                horaInicio: c.horaInicio_cit, horaFin: c.horaFin_cit,
                fecha: parseISO(c.fechaHora_cit), // Convertir a Date objeto real
                id_pac: c.id_pac, id_pod: c.id_pod, 
                titulo: 'Cita Tratamiento', subtitulo: c.tratamiento?.nombres_tra,
                estado: c.estado_cit, color: 'border-l-4 border-pie-green bg-green-50',
                datosCompletos: c
            }));

            dataConsultas.forEach(c => lista.push({
                tipo: 'consulta', id: c.id_con, 
                horaInicio: c.horaInicio_con, horaFin: c.horaFin_con,
                fecha: parseISO(c.fechaHora_con), // Convertir a Date objeto real
                id_pac: c.id_pac, id_pod: c.id_pod, 
                titulo: 'Consulta Diagnóstico', subtitulo: c.motivoConsulta_con,
                estado: c.estado_con, color: 'border-l-4 border-oxi-blue bg-blue-50',
                datosCompletos: c
            }));

            // Orden global por fecha
            lista.sort((a, b) => new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime());
            
            setEventosMes(lista); // Guardamos TODO el mes
            
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchEventosDelMes();
  }, [currentMonth, filterPac, filterPod]); // Se dispara al cambiar mes o filtros

  // 3. Filtrar eventos para el DÍA seleccionado (localmente)
  useEffect(() => {
     const filtrados = eventosMes.filter(ev => isSameDay(ev.fecha, selectedDate));
     setEventosDia(filtrados);
  }, [selectedDate, eventosMes]);


  // --- HELPERS ---
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

  // ¿Tiene eventos este día? (Para el círculo rosado)
  const tieneEventos = (day: Date) => {
      return eventosMes.some(ev => isSameDay(ev.fecha, day));
  };

  // Opciones para filtros
  const opcionesPacientes = pacientes.map(p => ({ value: p.id_pac, label: `${p.nombres_pac} ${p.apellidos_pac} - CI: ${p.cedula_pac}` }));
  const opcionesPodologas = podologas.map(p => ({ value: p.id_pod, label: `${p.nombres_pod} ${p.apellidos_pod} - CI: ${p.cedula_pod}` }));

  // --- CALENDARIO GRID ---
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const limpiarFiltros = () => {
      setFilterPac('');
      setFilterPod('');
      // Volvemos a hoy
      const hoy = new Date();
      setCurrentMonth(hoy);
      setSelectedDate(hoy);
  };

  return (
    <div className="px-4 mt-6 max-w-7xl mx-auto pb-10">
      
      {/* === ZONA DE FILTROS SUPERIOR === */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="w-full md:w-1/3">
                 <SearchableSelect 
                    label="Filtrar por Paciente"
                    placeholder="Buscar paciente..."
                    options={opcionesPacientes}
                    value={filterPac}
                    onChange={(val) => setFilterPac(val)}
                 />
             </div>
             <div className="w-full md:w-1/3">
                 <SearchableSelect 
                    label="Filtrar por Especialista"
                    placeholder="Buscar especialista..."
                    options={opcionesPodologas}
                    value={filterPod}
                    onChange={(val) => setFilterPod(val)}
                 />
             </div>
             <div className="w-full md:w-auto">
                 <button 
                    onClick={limpiarFiltros}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Limpiar / Restaurar
                 </button>
             </div>
          </div>
          {(filterPac || filterPod) && (
              <div className="mt-2 text-sm text-pink-600 font-semibold animate-pulse">
                  * Mostrando agenda filtrada. Los días marcados tienen coincidencias.
              </div>
          )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* === CALENDARIO === */}
        <div className="lg:w-1/3 space-y-4">
             <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">←</button>
                <h2 className="font-bold text-lg text-oxi-dark capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">→</button>
             </div>

             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                 <div className="grid grid-cols-7 mb-2 text-center">
                    {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
                        <div key={day} className="text-xs font-bold text-gray-400 py-1">{day}</div>
                    ))}
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((day, idx) => {
                        const hayEvento = tieneEventos(day);
                        const esSeleccionado = isSameDay(day, selectedDate);
                        const esHoy = isToday(day);
                        const esMesActual = isSameMonth(day, currentMonth);

                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm transition-all relative",
                                    !esMesActual && "text-gray-300",
                                    esMesActual && "text-gray-700 hover:bg-blue-50",
                                    esSeleccionado && "bg-oxi-blue text-white shadow-md hover:bg-oxi-blue z-10",
                                    esHoy && !esSeleccionado && "text-oxi-blue font-bold ring-1 ring-oxi-blue"
                                )}
                            >
                                {format(day, 'd')}
                                
                                {/* CÍRCULO ROSADO INDICADOR */}
                                {hayEvento && !esSeleccionado && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                                    </span>
                                )}
                                {/* Si está seleccionado, mostramos un puntito blanco discreto */}
                                {hayEvento && esSeleccionado && (
                                     <span className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full"></span>
                                )}
                            </button>
                        );
                    })}
                 </div>
             </div>

             <div className="flex flex-col gap-3">
                <Link href="/consultas/nueva" className="w-full bg-oxi-blue text-white border border-gray-300 text-center py-3 rounded-lg shadow-sm font-medium hover:bg-oxi-dark">
                    + Agendar Consulta
                </Link>
                <Link href="/agenda/nueva" className="w-full bg-pie-green text-white text-center py-3 rounded-lg shadow font-bold hover:bg-pie-dark transition">
                    + Agendar Cita
                </Link>
             </div>
        </div>

        {/* === AGENDA DEL DÍA (DERECHA) === */}
        <div className="lg:w-2/3">
             <h1 className="text-2xl font-bold text-gray-800 mb-4">
                 Agenda del <span className="text-oxi-blue capitalize">{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</span>
             </h1>

             <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px] p-1">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">Actualizando agenda...</div>
                ) : eventosDia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <p className="text-lg">No hay actividades {filterPac || filterPod ? 'con estos filtros' : ''} para este día.</p>
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {eventosDia.map((ev) => (
                            <div key={`${ev.tipo}-${ev.id}`} 
                                onClick={() => setEventoSeleccionado(ev)}
                                className={`p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition flex items-center gap-4 ${ev.color} border-l-[6px]`}
                            >
                                <div className="flex flex-col items-center justify-center bg-white/60 p-2 rounded min-w-[80px]">
                                    <span className="text-xl font-bold text-gray-800">{formatHora(ev.horaInicio)}</span>
                                    <span className="text-xs text-gray-500">{formatHora(ev.horaFin)}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h3 className="font-bold text-gray-800 text-lg">{getNombrePaciente(ev.id_pac)}</h3>
                                        <span className={`text-xs px-2 py-1 rounded border capitalize h-fit ${
                                            ev.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                                            ev.estado === 'completada' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                                        }`}>
                                            {ev.estado}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">{ev.titulo} - {ev.subtitulo}</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        Esp: <span className="font-semibold">{getNombrePodologa(ev.id_pod)}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        </div>

      </div>

      {/* --- MODAL POP-UP (Mismo código de antes) --- */}
      {eventoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative animate-fade-in-up">
                  <button onClick={() => setEventoSeleccionado(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                  <h2 className="text-xl font-bold text-oxi-dark mb-1 border-b pb-2">
                      {eventoSeleccionado.tipo === 'cita' ? '🟢 Detalle de Cita' : '🔵 Detalle de Consulta'}
                  </h2>
                  <div className="space-y-3 mt-4">
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
                          <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                          <p className="text-gray-800">{eventoSeleccionado.subtitulo || 'Sin descripción'}</p>
                          {eventoSeleccionado.tipo === 'cita' && (
                              <p className="mt-2 text-sm text-gray-600 italic">
                                  "{eventoSeleccionado.datosCompletos.notasAdicionales_cit || 'Sin notas'}"
                              </p>
                          )}
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                      <button 
                          onClick={() => {
                              const ruta = eventoSeleccionado.tipo === 'cita' 
                                  ? `/citas/${eventoSeleccionado.id}` 
                                  : `/consultas/${eventoSeleccionado.id}`;
                              router.push(ruta);
                          }}
                          className="bg-oxi-blue text-white px-4 py-2 rounded hover:bg-oxi-dark transition"
                      >
                          ✏️ Editar / Completar
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