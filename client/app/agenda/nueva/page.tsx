'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Paciente, Podologa, Tratamiento } from '@/types';
import SearchableSelect from '@/components/SearchableSelect';

function NuevaCitaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parámetros de derivación (si viene de una consulta)
  const origenParam = searchParams.get('origen');
  const pacienteParam = searchParams.get('paciente');
  const tratamientoParam = searchParams.get('tratamiento');

  // Catálogos
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  
  const [formData, setFormData] = useState({
    id_pac: pacienteParam || '',
    id_pod: '', 
    id_tra: tratamientoParam || '',
    id_con_origen: origenParam || '',
    
    // Agenda
    fecha: new Date().toISOString().split('T')[0], 
    horaInicio: '09:00',
    horaFin: '09:30',
    estado_cit: 'pendiente', // Nuevo campo solicitado

    // Notas
    notasAdicionales_cit: '',
    
    // Finanzas
    precioAcordado_cit: '',
    pagado_cit: false,
    cantidadPagada_cit: '0.00'
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resPac, resPod, resTra] = await Promise.all([
             fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`),
             fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`),
             fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos`)
        ]);
        const dataTra = await resTra.json();
        
        setPacientes(await resPac.json());
        setPodologas(await resPod.json());
        setTratamientos(dataTra);

        // Si viene tratamiento pre-seleccionado, buscar su precio
        if(tratamientoParam) {
            const tra = dataTra.find((t:any) => t.id_tra === parseInt(tratamientoParam));
            if(tra) {
                setFormData(prev => ({...prev, precioAcordado_cit: tra.precioBase_tra.toString()}));
            }
        }
      } catch (error) { console.error(error); }
    };
    fetchAll();
  }, [tratamientoParam]);

  // Manejo genérico de cambios
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
        const newState = { ...prev, [name]: val };
        
        // Lógica automática de pago
        if (name === 'pagado_cit') {
            newState.cantidadPagada_cit = val ? prev.precioAcordado_cit : '0.00';
        }
        return newState;
    });
  };

  // Manejo de Selects Buscables
  const handleSelectChange = (field: string, val: string | number) => {
    setFormData(prev => {
        const newState = { ...prev, [field]: val };
        
        // Si cambia el tratamiento, actualizamos el precio sugerido
        if (field === 'id_tra') {
            const tra = tratamientos.find(t => t.id_tra.toString() === val.toString());
            if (tra) {
                newState.precioAcordado_cit = tra.precioBase_tra.toString();
            }
        }
        return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Cita agendada correctamente');
        if (origenParam) {
            router.push(`/consultas/${origenParam}`);
        } else {
            router.push('/citas');
        }
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) { alert('Error de conexión'); }
  };

  // Preparar Opciones
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

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 border-t-4 border-pie-green mt-6">
      <div className="flex justify-between border-b pb-2 mb-6">
          <h2 className="text-2xl font-bold text-oxi-dark">
              {origenParam ? 'Agendar Cita (Derivada)' : 'Agendar Nueva Cita'}
          </h2>
          {origenParam && <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Vinculado a Consulta #{origenParam}</span>}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECCIÓN 1: DATOS CLÍNICOS Y PERSONAL */}
        <div className="space-y-4">
            <div>
                {/* Paciente primero */}
                <SearchableSelect 
                    label="Paciente"
                    options={opcionesPacientes}
                    value={formData.id_pac}
                    onChange={(val) => handleSelectChange('id_pac', val)}
                    placeholder="Buscar paciente..."
                    required
                />
                {pacienteParam && <p className="text-xs text-gray-500 mt-1">Paciente bloqueado por derivación.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <SearchableSelect 
                        label="Tratamiento / Procedimiento"
                        options={opcionesTratamientos}
                        value={formData.id_tra}
                        onChange={(val) => handleSelectChange('id_tra', val)}
                        placeholder="Buscar tratamiento..."
                        required
                    />
                </div>
                <div>
                    <SearchableSelect 
                        label="Especialista (Opcional)"
                        options={opcionesPodologas}
                        value={formData.id_pod}
                        onChange={(val) => handleSelectChange('id_pod', val)}
                        placeholder="Asignar especialista..."
                    />
                </div>
            </div>
        </div>

        {/* SECCIÓN 2: AGENDA (AZUL) */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="text-sm font-bold text-oxi-blue mb-3 uppercase">Datos de Agenda</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Fecha</label>
                    <input type="date" name="fecha" value={formData.fecha} required onChange={handleChange} className="w-full border p-2 rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Inicio</label>
                    <input type="time" name="horaInicio" value={formData.horaInicio} required onChange={handleChange} className="w-full border p-2 rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Fin</label>
                    <input type="time" name="horaFin" value={formData.horaFin} required onChange={handleChange} className="w-full border p-2 rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Estado</label>
                    <select name="estado_cit" value={formData.estado_cit} onChange={handleChange} className="w-full border p-2 rounded-md bg-white">
                        <option value="pendiente">Pendiente</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                        <option value="noAsistio">No Asistió</option>
                    </select>
                </div>
            </div>
        </div>

        {/* SECCIÓN 3: NOTAS */}
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Notas Adicionales</label>
            <textarea name="notasAdicionales_cit" rows={2} value={formData.notasAdicionales_cit} onChange={handleChange} className="w-full border-gray-300 border p-2 rounded-md"></textarea>
        </div>

        {/* SECCIÓN 4: FINANZAS (VERDE) */}
        <div className="bg-green-50 p-4 rounded-md border border-green-200">
             <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2 uppercase">
                <span>Finanzas</span>
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Acordado ($)</label>
                    <input type="number" step="0.01" name="precioAcordado_cit" value={formData.precioAcordado_cit} required onChange={handleChange} className="mt-1 block w-full border p-2 rounded-md bg-white" />
                </div>

                <div className="flex items-center h-12">
                    <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="pagado_cit" checked={formData.pagado_cit} onChange={handleChange} className="sr-only peer" />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="ms-3 text-sm font-bold text-gray-700">¿Ya Pagó?</span>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Monto Recibido ($)</label>
                    <input 
                        type="number" step="0.01" name="cantidadPagada_cit" 
                        value={formData.cantidadPagada_cit} onChange={handleChange} 
                        disabled={!formData.pagado_cit}
                        className={`mt-1 block w-full border p-2 rounded-md font-bold ${formData.pagado_cit ? 'bg-white text-green-700 border-green-500' : 'bg-gray-100 text-gray-400'}`} 
                    />
                </div>
             </div>
        </div>

        <div className="pt-5 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-pie-green py-2 px-4 text-sm font-medium text-white hover:bg-pie-dark shadow-md">
                {origenParam ? 'Confirmar Cita' : 'Agendar Cita'}
            </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaCitaPage() {
    return (
        <Suspense fallback={<div>Cargando formulario...</div>}>
            <NuevaCitaForm />
        </Suspense>
    );
}