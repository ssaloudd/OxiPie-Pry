'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Paciente, Podologa, Tratamiento } from '@/types';

function NuevaCitaForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook para leer URL
  
  // Parámetros de derivación
  const origenParam = searchParams.get('origen');
  const pacienteParam = searchParams.get('paciente');
  const tratamientoParam = searchParams.get('tratamiento');

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  
  const [formData, setFormData] = useState({
    id_pac: pacienteParam || '', // Pre-llenar si viene de consulta
    id_pod: '', 
    id_tra: tratamientoParam || '', // Pre-llenar si viene de consulta
    id_con_origen: origenParam || '', // CAMPO CLAVE
    fecha: new Date().toISOString().split('T')[0], 
    horaInicio: '09:00',
    horaFin: '09:30',
    precioAcordado_cit: '',
    notasAdicionales_cit: ''
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

  const handleTratamientoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idTra = e.target.value;
    const tratamiento = tratamientos.find(t => t.id_tra === parseInt(idTra));
    setFormData(prev => ({
        ...prev,
        id_tra: idTra,
        precioAcordado_cit: tratamiento ? tratamiento.precioBase_tra.toString() : prev.precioAcordado_cit
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        // Si venía de una consulta origen, volvemos a esa consulta o a la agenda
        if (origenParam) {
            router.push(`/consultas/${origenParam}`);
        } else {
            router.push('/agenda');
        }
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) { alert('Error de conexión'); }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6 border-t-4 border-pie-green mt-6">
      <div className="flex justify-between border-b pb-2 mb-6">
          <h2 className="text-2xl font-bold text-oxi-dark">
              {origenParam ? 'Agendar Tratamiento (Derivado)' : 'Agendar Nueva Cita'}
          </h2>
          {origenParam && <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Vinculado a Consulta #{origenParam}</span>}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: ¿QUIÉN? */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-md font-semibold text-oxi-blue mb-4">Datos del Paciente</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Paciente *</label>
                <select name="id_pac" required value={formData.id_pac} onChange={handleChange} 
                    // Si viene precargado el paciente, deshabilitamos el cambio para mantener integridad
                    disabled={!!pacienteParam}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 bg-white disabled:bg-gray-200">
                    <option value="">Seleccione un paciente...</option>
                    {pacientes.map(p => (
                        <option key={p.id_pac} value={p.id_pac}>{p.apellidos_pac} {p.nombres_pac} - {p.cedula_pac}</option>
                    ))}
                </select>
                {pacienteParam && <p className="text-xs text-gray-500 mt-1">Paciente bloqueado por derivación de consulta.</p>}
            </div>
        </div>

        {/* SECCIÓN 2: ¿QUÉ Y CON QUIÉN? */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tratamiento *</label>
                <select name="id_tra" required value={formData.id_tra} onChange={handleTratamientoChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2 bg-white">
                    <option value="">Seleccione servicio...</option>
                    {tratamientos.map(t => (
                        <option key={t.id_tra} value={t.id_tra}>{t.nombres_tra}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Especialista (Opcional)</label>
                <select name="id_pod" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2 bg-white">
                    <option value="">-- Pendiente de Asignar --</option>
                    {podologas.map(p => (
                        <option key={p.id_pod} value={p.id_pod}>{p.nombres_pod} {p.apellidos_pod}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* SECCIÓN 3: ¿CUÁNDO? */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="text-md font-semibold text-oxi-blue mb-4">Fecha y Hora</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha *</label>
                    <input type="date" name="fecha" value={formData.fecha} required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Inicio *</label>
                    <input type="time" name="horaInicio" value={formData.horaInicio} required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fin *</label>
                    <input type="time" name="horaFin" value={formData.horaFin} required onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2" />
                </div>
            </div>
        </div>

        {/* SECCIÓN 4: DETALLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Precio Acordado ($)</label>
                <input type="number" step="0.01" name="precioAcordado_cit" value={formData.precioAcordado_cit} required onChange={handleChange} 
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
                <textarea name="notasAdicionales_cit" rows={2} value={formData.notasAdicionales_cit} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 border p-2"></textarea>
            </div>
        </div>

        <div className="pt-5 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-pie-green py-2 px-4 text-sm font-medium text-white hover:bg-pie-dark shadow-md">
                {origenParam ? 'Confirmar Tratamiento' : 'Agendar Cita'}
            </button>
        </div>
      </form>
    </div>
  );
}

// Wrapper necesario para Suspense en Next.js App Router usando useSearchParams
export default function NuevaCitaPage() {
    return (
        <Suspense fallback={<div>Cargando formulario...</div>}>
            <NuevaCitaForm />
        </Suspense>
    );
}