export interface Paciente {
  id_pac: number;
  nombres_pac: string;
  apellidos_pac: string;
  cedula_pac: string;
  genero_pac: 'masculino' | 'femenino' | 'otro';
  telefono_pac?: string;
  direccion_pac?: string;
  email_pac?: string;
  fechaNac_pac: string; // Viene como string ISO del backend
}

export interface Podologa {
  id_pod: number;
  nombres_pod: string;
  apellidos_pod: string;
  cedula_pod: string;
  genero_pod: 'masculino' | 'femenino' | 'otro';
  telefono_pod?: string;
  direccion_pod?: string;
  email_pod?: string;
  fechaNac_pod: string;
}

export interface Tratamiento {
  id_tra: number;
  nombres_tra: string;
  descripcion_tra: string;
  precioBase_tra: number;
}