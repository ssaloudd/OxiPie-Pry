'use client';

import { useState, useEffect, use } from 'react'; // <--- Importamos 'use'
import { useRouter } from 'next/navigation';
import { Paciente } from '@/types';

// Helper para formatear fecha ISO a YYYY-MM-DD
const formatDateForInput = (isoDate: string) => {
  if (!isoDate) return '';
  return new Date(isoDate).toISOString().split('T')[0];
};

// Definimos el tipo como una Promesa
export default function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  // Desempaquetamos la promesa de params usando 'use'
  const { id } = use(params); 
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Paciente>>({
    nombres_pac: '',
    apellidos_pac: '',
    cedula_pac: '',
    genero_pac: 'femenino',
    telefono_pac: '',
    direccion_pac: '',
    email_pac: '',
    fechaNac_pac: '',
  });

  // 1. Cargar datos usando el 'id' ya resuelto
  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes/${id}`);
        if (!res.ok) throw new Error("Paciente no encontrado");
        
        const data = await res.json();
        
        setFormData({
            ...data,
            fechaNac_pac: formatDateForInput(data.fechaNac_pac)
        });
      } catch (error) {
        console.error(error);
        alert("Error cargando paciente");
        router.push('/pacientes');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchPaciente();
  }, [id, router]);

  // 2. Manejar envío (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id_pac, ...datosParaEnviar } = formData as Paciente;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaEnviar)
      });

      if (res.ok) {
        alert('Paciente actualizado correctamente');
        router.push('/pacientes');
        router.refresh(); 
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-10 text-oxi-blue font-bold">Cargando datos del paciente...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 border-t-4 border-oxi-blue mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-2xl font-bold text-oxi-dark">Editar Paciente</h2>
        {/* Usamos el id resuelto para mostrarlo */}
        <span className="text-sm text-gray-500">ID: {id}</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Nombres</label>
            <input type="text" name="nombres_pac" value={formData.nombres_pac} onChange={handleChange} required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900" />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Apellidos</label>
            <input type="text" name="apellidos_pac" value={formData.apellidos_pac} onChange={handleChange} required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900" />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Cédula</label>
            <input type="text" name="cedula_pac" value={formData.cedula_pac} onChange={handleChange} required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900" />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento</label>
            <input type="date" name="fechaNac_pac" value={formData.fechaNac_pac} onChange={handleChange} required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Género</label>
            <select name="genero_pac" value={formData.genero_pac} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900">
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" name="telefono_pac" value={formData.telefono_pac || ''} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900" />
          </div>
          
          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" name="email_pac" value={formData.email_pac || ''} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900" />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input type="text" name="direccion_pac" value={formData.direccion_pac || ''} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2 text-gray-900" />
          </div>
        </div>

        <div className="pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-oxi-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-oxi-dark"
            >
              Actualizar Datos
            </button>
        </div>
      </form>
    </div>
  );
}