'use client';

import { useState, useEffect, useRef } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label: string;
  required?: boolean;
}

export default function SearchableSelect({ options, value, onChange, placeholder, label, required }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Encontrar la opción seleccionada actualmente para mostrar su etiqueta
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Filtrar opciones basado en lo que escribe el usuario
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Manejar selección
  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm(''); // Limpiar búsqueda al seleccionar
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-bold text-gray-700 mb-1">{label} {required && '*'}</label>
      
      {/* Caja Principal (Input Simulado) */}
      <div 
        className={`w-full border rounded-md p-2 bg-white cursor-text flex justify-between items-center ${isOpen ? 'ring-2 ring-oxi-blue border-oxi-blue' : 'border-gray-300'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
            {selectedOption ? selectedOption.label : (placeholder || 'Seleccione...')}
        </span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>

      {/* Lista Desplegable */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          
          {/* Buscador interno */}
          <div className="sticky top-0 bg-white p-2 border-b">
             <input 
                type="text" 
                className="w-full border p-1 rounded focus:outline-none focus:border-oxi-blue"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
             />
          </div>

          {/* Opciones */}
          {filteredOptions.length === 0 ? (
             <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
               No se encontraron resultados.
             </div>
          ) : (
             filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${String(value) === String(opt.value) ? 'bg-blue-100 text-oxi-blue font-bold' : 'text-gray-900'}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="block truncate">{opt.label}</span>
                </div>
             ))
          )}
        </div>
      )}
    </div>
  );
}