'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Consulta, Paciente, Podologa, Tratamiento } from '@/types';
import SearchableSelect from '@/components/SearchableSelect'; // <--- Usamos el mismo componente

const getHora = (isoDate: string) => isoDate ? new Date(isoDate).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit', hour12: false}) : '';
const getDate = (isoDate: string) => isoDate ? new Date(isoDate).toISOString().split('T')[0] : '';

export default function EditarConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  
  // Catálogos completos
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);

  // Form unificado
  const [formData, setFormData] = useState({
      id_pac: '', // Ahora es editable/seleccionable si fuera necesario, aunque usualmente se bloquea al editar.
      id_pod: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      estado_con: '',
      motivoConsulta_con: '',
      diagnostico_con: '',
      id_tra_recomendado: '',
      notasAdicionales_con: '',
      precioSugerido_con: 0,
      pagado_con: false,
      cantidadPagada_con: 0
  });

  useEffect(() => {
    const init = async () => {
        try {
            // Cargar Catálogos
            const [resPac, resPod, resTra, resCon] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas/${id}`)
            ]);

            setPacientes(await resPac.json());
            setPodologas(await resPod.json());
            setTratamientos(await resTra.json());

            if(!resCon.ok) throw new Error("Consulta no encontrada");
            const dataCon: Consulta = await resCon.json();
            setConsulta(dataCon);

            // Llenar Formulario
            setFormData({
                id_pac: dataCon.id_pac.toString(), // Convertimos a string para el select
                id_pod: dataCon.id_pod?.toString() || '',
                fecha: getDate(dataCon.fechaHora_con),
                horaInicio: getHora(dataCon.horaInicio_con),
                horaFin: getHora(dataCon.horaFin_con),
                estado_con: dataCon.estado_con,
                
                motivoConsulta_con: dataCon.motivoConsulta_con || '',
                diagnostico_con: dataCon.diagnostico_con || '',
                id_tra_recomendado: dataCon.id_tra_recomendado?.toString() || '',
                notasAdicionales_con: dataCon.notasAdicionales_con || '',
                
                precioSugerido_con: Number(dataCon.precioSugerido_con || 0),
                pagado_con: dataCon.pagado_con || false,
                cantidadPagada_con: Number(dataCon.cantidadPagada_con || 0)
            });

        } catch(e) { console.error(e); } finally { setLoading(false); }
    };
    if(id) init();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
        const newState = { ...prev, [name]: val };
        if (name === 'pagado_con') {
            if (val === true && prev.cantidadPagada_con === 0) {
                 newState.cantidadPagada_con = prev.precioSugerido_con;
            } else if (val === false) {
                 newState.cantidadPagada_con = 0;
            }
        }
        return newState;
    });
  };

  const handleSelectChange = (field: string, val: string | number) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });

        if(res.ok) {
            alert("Consulta actualizada correctamente");
            router.push('/consultas');
        } else {
             const err = await res.json();
             alert("Error: " + err.error);
        }
    } catch(e) { alert("Error al guardar"); }
  };

  const irACitaDeTratamiento = () => {
    if(!consulta) return;
    const query = new URLSearchParams({
        origen: consulta.id_con.toString(),
        paciente: formData.id_pac, // Usamos el del form por si cambió
        tratamiento: formData.id_tra_recomendado || ""
    }).toString();
    router.push(`/agenda/nueva?${query}`);
  };

  // Preparar opciones para selects
  const opcionesPacientes = pacientes.map(p => ({
    value: p.id_pac,
    label: `${p.nombres_pac} ${p.apellidos_pac} - CI: ${p.cedula_pac}`
  }));

  const opcionesPodologas = podologas.map(p => ({
    value: p.id_pod,
    label: `${p.nombres_pod} ${p.apellidos_pod}`
  }));

  const opcionesTratamientos = tratamientos.map(t => ({
    value: t.id_tra,
    label: t.nombres_tra
  }));


  if(loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg border-t-4 border-oxi-blue mt-6">
        
        {/* HEADER CON BOTÓN DE DERIVACIÓN */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Editar Consulta #{id}</h1>
                <p className="text-sm text-gray-500">Gestión completa</p>
            </div>
            {/* Botón Derivación (HU 3) */}
            <button 
                type="button"
                onClick={irACitaDeTratamiento}
                className="flex items-center gap-2 bg-pie-green hover:bg-pie-dark text-white px-4 py-2 rounded-md font-bold shadow-sm transition-all text-sm"
            >
                <span>➔ Agendar Tratamiento</span>
            </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS ADMINISTRATIVOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <SearchableSelect 
                        label="Paciente"
                        options={opcionesPacientes}
                        value={formData.id_pac}
                        onChange={(val) => handleSelectChange('id_pac', val)}
                        placeholder="Buscar paciente..."
                        required
                    />
                </div>
                <div>
                    <SearchableSelect 
                        label="Especialista"
                        options={opcionesPodologas}
                        value={formData.id_pod}
                        onChange={(val) => handleSelectChange('id_pod', val)}
                        placeholder="Buscar especialista..."
                    />
                </div>
            </div>

            {/* SECCIÓN 2: AGENDA */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-sm font-bold text-oxi-blue mb-3 uppercase">Datos de Agenda</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Fecha</label>
                        <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full border p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Inicio</label>
                        <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} className="w-full border p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Fin</label>
                        <input type="time" name="horaFin" value={formData.horaFin} onChange={handleChange} className="w-full border p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Estado</label>
                        <select name="estado_con" value={formData.estado_con} onChange={handleChange} className="w-full border p-2 rounded-md bg-white">
                            <option value="pendiente">Pendiente</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: REGISTRO CLÍNICO */}
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-1">Registro Clínico</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Motivo de Consulta</label>
                        <textarea name="motivoConsulta_con" rows={2} value={formData.motivoConsulta_con} onChange={handleChange} className="mt-1 block w-full border-gray-300 border p-2 rounded-md focus:ring-oxi-blue focus:border-oxi-blue"></textarea>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 text-oxi-blue">Diagnóstico</label>
                        <textarea name="diagnostico_con" rows={3} value={formData.diagnostico_con} onChange={handleChange} className="mt-1 block w-full border-blue-200 border-2 p-2 rounded-md focus:ring-oxi-blue focus:border-oxi-blue"></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <SearchableSelect 
                                label="Tratamiento Sugerido"
                                options={opcionesTratamientos}
                                value={formData.id_tra_recomendado}
                                onChange={(val) => handleSelectChange('id_tra_recomendado', val)}
                                placeholder="Buscar tratamiento..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Notas Adicionales</label>
                            <textarea name="notasAdicionales_con" rows={1} value={formData.notasAdicionales_con} onChange={handleChange} className="mt-0 block w-full border-gray-300 border p-2 rounded-md h-[42px]"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 4: PAGO (FINANZAS) */}
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2 uppercase">
                    <span>Finanzas</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Costo Consulta ($)</label>
                        <input type="number" step="0.01" name="precioSugerido_con" value={formData.precioSugerido_con} onChange={handleChange} className="mt-1 block w-full border p-2 rounded-md bg-white" />
                    </div>

                    <div className="flex items-center h-12">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="pagado_con" checked={formData.pagado_con} onChange={handleChange} className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            <span className="ms-3 text-sm font-bold text-gray-700">¿Pagado?</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Monto Recibido ($)</label>
                        <input 
                            type="number" step="0.01" name="cantidadPagada_con" 
                            value={formData.cantidadPagada_con} onChange={handleChange} 
                            disabled={!formData.pagado_con}
                            className={`mt-1 block w-full border p-2 rounded-md font-bold ${formData.pagado_con ? 'bg-white text-green-700 border-green-500' : 'bg-gray-100 text-gray-400'}`} 
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-oxi-blue text-white rounded hover:bg-oxi-dark font-medium shadow">Guardar Cambios</button>
            </div>
        </form>
    </div>
  );
}