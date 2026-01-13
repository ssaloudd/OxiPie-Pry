'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Podologa } from '@/types';

// Helper para fecha input type="date"
const formatDateForInput = (isoDate: string) => {
  if (!isoDate) return '';
  return new Date(isoDate).toISOString().split('T')[0];
};

export default function EditarPodologaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Inicializamos con TODOS los campos
  const [formData, setFormData] = useState<Partial<Podologa>>({
      nombres_pod: '', apellidos_pod: '', cedula_pod: '', 
      genero_pod: 'femenino', telefono_pod: '', 
      direccion_pod: '', email_pod: '', fechaNac_pod: ''
  });

  useEffect(() => {
    const fetchPodologa = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas/${id}`);
        if (!res.ok) throw new Error("No encontrado");
        const data = await res.json();
        
        setFormData({ 
            ...data, 
            // Manejar nulos para que el input no lance warnings
            telefono_pod: data.telefono_pod || '',
            direccion_pod: data.direccion_pod || '',
            email_pod: data.email_pod || '',
            fechaNac_pod: data.fechaNac_pod ? formatDateForInput(data.fechaNac_pod) : '' 
        });
      } catch (error) { router.push('/podologas'); } 
      finally { setLoading(false); }
    };
    if (id) fetchPodologa();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id_pod, ...datos } = formData as Podologa;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      
      if (res.ok) { 
          alert('Datos actualizados correctamente');
          router.push('/podologas'); 
          router.refresh(); 
      } else { 
          const err = await res.json();
          alert(`Error: ${err.error}`); 
      }
    } catch (err) { alert('Error de conexión'); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-10 text-oxi-blue text-center">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 border-t-4 border-oxi-blue mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
         <h2 className="text-2xl font-bold text-oxi-dark">Editar Especialista</h2>
         <span className="text-sm text-gray-500">ID: {id}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombres</label>
                <input type="text" name="nombres_pod" value={formData.nombres_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Apellidos</label>
                <input type="text" name="apellidos_pod" value={formData.apellidos_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Cédula</label>
                <input type="text" name="cedula_pod" value={formData.cedula_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Género</label>
                <select name="genero_pod" value={formData.genero_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2">
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
                </select>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento</label>
                <input type="date" name="fechaNac_pod" value={formData.fechaNac_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input type="tel" name="telefono_pod" value={formData.telefono_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" name="email_pod" value={formData.email_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input type="text" name="direccion_pod" value={formData.direccion_pod} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
         </div>

         <div className="pt-5 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-oxi-blue py-2 px-4 text-sm font-medium text-white hover:bg-oxi-dark shadow">Actualizar</button>
        </div>
      </form>
    </div>
  );
}