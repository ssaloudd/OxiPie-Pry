'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoPacientePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombres_pac: '',
    apellidos_pac: '',
    cedula_pac: '',
    genero_pac: 'femenino',
    telefono_pac: '',
    direccion_pac: '',
    email_pac: '',
    fechaNac_pac: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Paciente registrado exitosamente');
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

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 border-t-4 border-pie-green">
      <h2 className="text-2xl font-bold mb-6 text-oxi-dark border-b pb-2">Registrar Nuevo Paciente</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          
          {/* Nombres */}
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Nombres *</label>
            <input type="text" name="nombres_pac" required onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2" />
          </div>

          {/* Apellidos */}
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Apellidos *</label>
            <input type="text" name="apellidos_pac" required onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2" />
          </div>

          {/* Cédula */}
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Cédula *</label>
            <input type="text" name="cedula_pac" required onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2" />
          </div>

          {/* Fecha Nacimiento */}
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento *</label>
            <input type="date" name="fechaNac_pac" required onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2" />
          </div>

          {/* Género */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Género *</label>
            <select name="genero_pac" onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2">
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Teléfono */}
          <div className="sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" name="telefono_pac" onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2" />
          </div>
          
          {/* Email */}
          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" name="email_pac" onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2" />
          </div>

          {/* Dirección */}
          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input type="text" name="direccion_pac" onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oxi-blue focus:ring-oxi-blue sm:text-sm border p-2" />
          </div>

        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-pie-green py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-pie-dark focus:outline-none focus:ring-2 focus:ring-pie-green focus:ring-offset-2"
            >
              Guardar Paciente
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}