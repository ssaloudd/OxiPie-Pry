'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevaPodologaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombres_pod: '', 
    apellidos_pod: '', 
    cedula_pod: '', 
    genero_pod: 'femenino',
    telefono_pod: '', 
    direccion_pod: '', // Campo agregado
    email_pod: '',     // Campo agregado
    fechaNac_pod: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Podóloga registrada exitosamente');
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

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 border-t-4 border-pie-green mt-6">
      <h2 className="text-2xl font-bold mb-6 text-oxi-dark border-b pb-2">Registrar Especialista</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombres *</label>
                <input type="text" name="nombres_pod" required onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Apellidos *</label>
                <input type="text" name="apellidos_pod" required onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
        </div>

        {/* Cédula y Género */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Cédula *</label>
                <input type="text" name="cedula_pod" required maxLength={10} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Género *</label>
                <select name="genero_pod" onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2 bg-white">
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                </select>
            </div>
        </div>

        {/* Fecha Nacimiento y Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento *</label>
                <input type="date" name="fechaNac_pod" required onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                 <input type="tel" name="telefono_pod" maxLength={10} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
        </div>

        {/* Email */}
        <div>
             <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
             <input type="email" name="email_pod" onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        {/* Dirección */}
        <div>
             <label className="block text-sm font-medium text-gray-700">Dirección</label>
             <input type="text" name="direccion_pod" onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        <div className="pt-5 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-pie-green py-2 px-4 text-sm font-medium text-white hover:bg-pie-dark shadow">Guardar</button>
        </div>
      </form>
    </div>
  );
}