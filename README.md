<h1 align="center"> # OxiPie-Pry </h1>

Sistema integral de gestión para centros podológicos. Una solución moderna para administrar historias clínicas, agendas de podólogas y finanzas, construida con una arquitectura de microservicios para máxima escalabilidad.

:construction: Estado: En Desarrollo :construction:


## :clipboard: Requisitos Previos

Antes de comenzar, tener instalado:

- Node.js v18.x o superior (incluye npm).
- MySQL 8.x: Puedes usar XAMPP, WAMP o una instalación limpia de MySQL.

> [!IMPORTANT] Debes tener una base de datos MySQL creada manualmente con el nombre `oxipie_db` antes de correr las migraciones.


## Estructura del Proyecto

El proyecto se divide en dos grandes carpetas:
- /client: Frontend desarrollado en Next.js 15+ con Tailwind CSS.
- /server: Directorio de microservicios.
    - shared/: Contiene el esquema de Prisma y la conexión compartida a la DB.
    - patients-service/: Microservicio para la gestión de pacientes (Puerto 4001).
    - scheduling-service: Microservicio para la gestión de agendamiento (consultas, citas, podólogas, tratamientos) (Puerto 4002).


## Instalación y Configuración

### 1. Clonar el repositorio
```
git clone https://github.com/ssaloudd/OxiPie-Pry.git
cd OxiPie-Pry
```

### 2. Configuración de Base de Datos (Shared)

Primero configuramos Prisma, que es el corazón de nuestros datos:

    1. Navegar a carpeta shared:
```
cd server/shared
npm install
```

    2. Crea un archivo .env en server/shared/ y añade tus credenciales. En este caso, la contraseña es `12345` y el puerto es `3306`.
```
DATABASE_URL="mysql://root:12345@localhost:3306/oxipie_db"
```

    3. Se aplican las migraciones para crear las tablas:
```
npx prisma migrate dev
```

### 3. Levantar Microservicio de Pacientes
Abre una nueva terminal en la raíz del proyecto:

    1. Entra al servicio:
```
cd server/patients-service
npm install
```

    2. Crea un archivo .env en server/patients-service/ con:
```
PORT=4001
```

    3. Inicia el servidor
```
npm start
```

### 4. Levantar Microservicio de Agendamiento
Abre una tercera terminal en la raíz del proyecto:

    1. Entra al servicio:
```
cd server/scheduling-service
npm install
```

    2. Crea un archivo .env en server/scheduling-service/ con:
```
PORT=4002
```

    3. Inicia el servidor
```
npm start
```

### 5. Levantar el Frontend (Next.js)
Se abre una cuarta terminal en la raíz del proyecto:

    1. Entra al clienta
```
cd client
npm install
```

    2. Crea un archivo .env.local en client/ para conectar con los servicios. En caso de tener problemas, reemplace `127.0.0.1` por `localhost`:
```
NEXT_PUBLIC_API_PATIENTS="http://127.0.0.1:4001/api"
NEXT_PUBLIC_API_SCHEDULING="http://127.0.0.1:4002/api"
NEXT_PUBLIC_API_FINANCE="http://127.0.0.1:4003/api"
```

    3. Inicia el servidor de desarrollo:
```
npm run dev
```


## Uso del Sistema
Una vez que ambos servidores (Backend y Frontend) estén encendidos, puedes acceder a:

- Dashboard Principal: http://localhost:3000/dashboard

- Gestión de Pacientes: http://localhost:3000/pacientes

- Gestión de Podólogas: http://localhost:3000/podologas

- Gestión de Tratamientos: http://localhost:3000/tratamientos

- Endpoints de la API (Pacientes): http://localhost:4001/api/pacientes