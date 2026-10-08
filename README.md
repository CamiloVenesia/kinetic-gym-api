<div align="center">

<img src="./public/assets/kinetic-logo.png" alt="Kinetic Gym Logo" width="170">

# Kinetic Gym

### Sistema Full-Stack de Gestión para Gimnasios

Aplicación web para administrar socios, membresías, pagos, accesos y métricas de un gimnasio desde una interfaz centralizada.

[Ver Demo Online](https://kinetic-gym-api.onrender.com) · [Repositorio](https://github.com/CamiloVenesia/kinetic-gym-api)

</div>

---

## Sobre el proyecto

**Kinetic Gym** es un sistema full-stack de gestión diseñado a partir de necesidades reales de administración de gimnasios.

Permite centralizar el manejo de socios, planes, vencimientos, pagos y accesos, incorporando además un dashboard administrativo, diferentes roles de usuario y un modo kiosco para autogestión.

El proyecto utiliza una arquitectura separada en **Models, Controllers, Routes y Middlewares**, con una API REST desarrollada en Node.js y Express y persistencia de datos en MongoDB Atlas.

---

## Demo pública

La aplicación se encuentra desplegada y puede probarse directamente desde:

### https://kinetic-gym-api.onrender.com

Desde la pantalla de acceso seleccioná:

**Entrar como demo**

No es necesario ingresar usuario ni contraseña.

El entorno demo utiliza una base de datos independiente con información completamente ficticia para permitir explorar el sistema sin exponer datos reales.

> El servicio se encuentra desplegado utilizando el plan gratuito de Render, por lo que el primer acceso puede demorar algunos segundos si el servidor se encontraba inactivo.

---

## Funcionalidades

### Dashboard administrativo

El dashboard centraliza información relevante para la administración del gimnasio:

- cantidad de alumnos activos;
- recaudación mensual;
- cuotas vencidas;
- ingresos diarios;
- distribución de planes;
- horarios de mayor actividad;
- vencimientos próximos;
- últimas inscripciones.

---

### Gestión de socios

Permite administrar completamente la información de los clientes:

- alta de nuevos socios;
- búsqueda por nombre o DNI;
- edición de información;
- eliminación de registros;
- visualización del estado de la membresía;
- renovación de cuotas;
- historial de pagos;
- historial de ingresos.

---

### Membresías y planes

El sistema contempla diferentes modalidades de membresía.

**Planes mensuales**

- Mensual 2x por semana
- Mensual 3x por semana
- Mensual Libre

**Planes semanales**

- Semanal 5 días
- Semanal 3 días
- Semanal 2 días

**Otros**

- Pase Diario

El backend calcula y valida los vencimientos y límites de asistencia correspondientes a cada plan.

---

### Modo Kiosco

Kinetic Gym incorpora una interfaz de autoservicio diseñada para utilizarse en la recepción del gimnasio.

El socio ingresa su DNI y el sistema verifica automáticamente:

- existencia del socio;
- estado de la membresía;
- fecha de vencimiento;
- límite semanal de ingresos;
- autorización o rechazo del acceso.

Para probar distintos escenarios dentro del modo demo se pueden utilizar los siguientes DNI ficticios:

| DNI | Resultado |
| --- | --- |
| `11111111` | Acceso permitido |
| `22222222` | Cuota vencida |
| `33333333` | Límite semanal alcanzado |

> Todos los registros utilizados en la demo son ficticios y fueron creados exclusivamente con fines demostrativos.

---

### Perfiles e historial de asistencia

Cada socio dispone de una vista detallada con:

- datos personales;
- membresía actual;
- cantidad total de ingresos;
- ingresos del mes;
- historial de accesos;
- heatmap de asistencia;
- racha de entrenamiento.

---

### Gestión de pagos

El sistema mantiene un historial individual de pagos que permite calcular automáticamente:

- recaudación mensual;
- cantidad de pagos realizados;
- importe promedio;
- detalle de operaciones.

Las renovaciones generan nuevos registros de pago dentro del historial del cliente.

---

### Exportación de información

Desde el panel administrativo se pueden exportar datos en formato CSV, incluyendo:

- alumnos activos;
- información de pagos;
- reportes administrativos.

---

### Roles y permisos

El sistema cuenta con diferentes perfiles de acceso:

| Rol | Acceso |
| --- | --- |
| Administrador | Gestión completa |
| Dueño | Gestión y métricas |
| Recepción | Operaciones administrativas |
| Demo | Exploración del sistema público |

Los permisos son validados tanto desde la interfaz como desde el backend.

---

## Autenticación y seguridad

Kinetic Gym implementa autenticación mediante **JSON Web Tokens (JWT)**.

Las credenciales no se almacenan directamente en el código fuente.

Las contraseñas configuradas para los diferentes roles son almacenadas como hashes utilizando **bcrypt**.

Entre las medidas implementadas se incluyen:

- autenticación mediante JWT;
- contraseñas hasheadas con bcrypt;
- control de acceso basado en roles;
- protección de rutas privadas;
- rate limiting en autenticación;
- cabeceras de seguridad mediante Helmet;
- validación de datos desde el backend;
- variables sensibles mediante variables de entorno;
- separación entre base de datos de desarrollo y base demo;
- archivo `.env` excluido del repositorio mediante `.gitignore`.

---

## Stack tecnológico

### Frontend

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

- HTML5
- CSS3
- Vanilla JavaScript ES6+
- Fetch API
- LocalStorage

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

- Node.js
- Express
- API REST
- JWT
- bcrypt
- Helmet
- Express Rate Limit

### Base de datos

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

- MongoDB Atlas
- Mongoose ODM

### Deploy

![Render](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white)

- Render Web Service
- MongoDB Atlas
- Auto Deploy desde GitHub

---

## Arquitectura

El backend sigue una organización basada en separación de responsabilidades:

```text
Cliente / Navegador
        │
        ▼
   Express Routes
        │
        ▼
Authentication / Authorization
      Middlewares
        │
        ▼
    Controllers
        │
        ▼
 Mongoose Models
        │
        ▼
  MongoDB Atlas
```

El mismo servidor Express expone la API y distribuye los archivos estáticos del frontend.

---

## Estructura del proyecto

```text
kinetic/
│
├── public/
│   ├── assets/
│   │   └── kinetic-logo.png
│   │
│   ├── css/
│   │   └── styles.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── clientes.js
│   │   ├── dashboard.js
│   │   ├── data.js
│   │   ├── inscripcion.js
│   │   ├── kiosk.js
│   │   └── perfil.js
│   │
│   ├── favicon.png
│   └── index.html
│
├── scripts/
│   └── seed-demo.js
│
├── src/
│   ├── controllers/
│   │   └── clientes.controller.js
│   │
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   │
│   ├── models/
│   │   └── cliente.model.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── clientes.routes.js
│   │
│   └── index.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## API REST

### Autenticación

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/demo` | Crear sesión demo |

### Sistema

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/api/ping` | Health check del servidor |

### Clientes

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/api/clientes` | Obtener todos los clientes |
| `GET` | `/api/clientes/dni/:dni` | Buscar cliente por DNI |
| `POST` | `/api/clientes` | Inscribir nuevo cliente |
| `PUT` | `/api/clientes/:id` | Editar datos de un cliente |
| `DELETE` | `/api/clientes/:id` | Eliminar cliente |
| `POST` | `/api/clientes/:id/ingreso` | Registrar ingreso |
| `POST` | `/api/clientes/:id/renovar` | Renovar membresía |

Las rutas privadas requieren un token JWT válido.

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/CamiloVenesia/kinetic-gym-api.git
```

### 2. Entrar al proyecto

```bash
cd kinetic-gym-api
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto tomando como referencia:

```text
.env.example
```

Las credenciales reales, contraseñas, URIs de base de datos y secretos JWT nunca deben almacenarse dentro del repositorio.

### 5. Iniciar el servidor en desarrollo

```bash
npm run dev
```

También puede iniciarse mediante:

```bash
npm start
```

### 6. Abrir la aplicación

Con el servidor iniciado:

```text
http://localhost:3000
```

No es necesario utilizar Live Server.

Express sirve directamente tanto el frontend como la API.

---

## Variables de entorno

El proyecto utiliza variables de entorno para mantener credenciales y configuración sensible fuera del código fuente.

La estructura requerida puede consultarse en:

```text
.env.example
```

El archivo `.env` real está excluido del control de versiones.

---

## Base de datos demo

La versión pública utiliza una base independiente de MongoDB creada exclusivamente para demostración.

El proyecto incluye:

```text
scripts/seed-demo.js
```

Este script permite generar un conjunto controlado de clientes ficticios para probar:

- membresías activas;
- membresías vencidas;
- límites de asistencia;
- pagos;
- ingresos;
- métricas del dashboard;
- funcionamiento del modo kiosco.

Los datos demo no corresponden a personas reales.

---

## Deploy

La aplicación se encuentra desplegada en **Render**.

El deploy está conectado directamente con GitHub mediante Auto Deploy.

Cada actualización enviada a la rama principal:

```text
main
```

genera automáticamente un nuevo deploy de la aplicación.

La base de datos está alojada en **MongoDB Atlas**.

### Producción

https://kinetic-gym-api.onrender.com

---

## Estado del proyecto

**Versión funcional desplegada**

Actualmente se encuentran implementados:

- frontend completo;
- API REST;
- persistencia con MongoDB;
- autenticación JWT;
- roles y permisos;
- gestión de clientes;
- membresías;
- pagos;
- historial de ingresos;
- dashboard administrativo;
- modo kiosco;
- exportación CSV;
- modo claro y oscuro;
- modo demo;
- base de datos demo independiente;
- deploy público.

---

## Próximas mejoras

- [ ] Sistema de recuperación de contraseña
- [ ] Panel de configuración del gimnasio
- [ ] Notificaciones automáticas de vencimiento
- [ ] Integración con WhatsApp
- [ ] Facturación electrónica
- [ ] Reportes avanzados en PDF
- [ ] Progressive Web App
- [ ] Aplicación móvil para socios

---

## Autor

**Camilo Venesia**

Desarrollo Full-Stack

[LinkedIn](https://www.linkedin.com/in/camilovenesia/)  
[GitHub](https://github.com/CamiloVenesia)  
[Email](mailto:venesiacamilo.dev@gmail.com)

---

<div align="center">

<img src="./public/assets/kinetic-logo.png" alt="Kinetic Gym" width="80">

### Kinetic Gym

Sistema de gestión desarrollado con Node.js, Express, MongoDB y JavaScript.

[Ver Demo](https://kinetic-gym-api.onrender.com)

</div>