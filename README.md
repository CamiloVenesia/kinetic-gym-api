# 🚀 Kinetic Gym — Sistema de Gestión Profesional

**Kinetic Gym** es una solución integral diseñada para la gestión moderna de gimnasios. Este sistema fue desarrollado para transformar la experiencia de gestión deportiva, eliminando la dependencia de *software legacy* y ofreciendo una interfaz rápida, intuitiva y profesional para dueños, recepcionistas y socios.

> El proyecto implementa **Arquitectura por Capas (Controller-Route-Model)**, garantizando una separación clara de responsabilidades y facilitando la escalabilidad del sistema.

---

## 🛠️ Stack Tecnológico

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

- **Frontend:** HTML5, CSS3 (Custom Properties / Variables), Vanilla JavaScript ES6+
- **Backend:** Node.js + Express — API RESTful
- **Base de Datos:** MongoDB Atlas con Mongoose ODM

---

## 📋 Características Principales

- **Modo Kiosco de Autoservicio:** Interfaz optimizada con modo horizontal estilo "ventana clásica" para que los socios consulten su estado de forma autónoma ingresando su DNI.
- **Control de Accesos:** Validación instantánea de DNI, detección de cuotas vencidas y límites de clases semanales por plan.
- **Panel de Administración:** Gestión total sobre altas, bajas y modificaciones de clientes, planes y métricas en tiempo real.
- **Diseño de Roles (RBAC):** Acceso diferenciado por permisos — Administrador, Dueño y Recepción.
- **Dashboard Reactivo:** Métricas de recaudación mensual, horarios pico de asistencia, distribución de planes y vencimientos próximos.
- **Historial de Clientes:** Registro completo de ingresos con heatmap de asistencia y racha de días consecutivos.
- **Exportación CSV:** Descarga de reportes de pagos y alumnos activos directamente desde el panel.
- **Modo Claro/Oscuro:** Toggle de tema con persistencia en `localStorage`.

---

## 🔐 Credenciales de Acceso (Demo)

| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin1234` | `kinetic.dev` |
| **Dueño** | `kinetic1270` | `gimnasio1270` |
| **Recepción** | `recepcion01` | `kinetic` |

---

## 🚀 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/CamiloVenesia/kinetic-gym-api.git
cd kinetic-gym-api

# 2. Instalar dependencias del backend
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
# Editá .env con tu string de conexión a MongoDB Atlas

# 4. Iniciar el servidor
npm run dev
```

Luego abrí `index.html` con **Live Server** en VS Code.  
El frontend se conecta al backend en `http://localhost:3000`.

---

## 📂 Estructura del Proyecto

```text
KINETIC/
├── css/
│   └── styles.css          # Estilos globales y variables CSS
├── js/
│   ├── data.js             # Estado global y constantes
│   ├── app.js              # Login, navegación, modales, roles
│   ├── kiosk.js            # Lógica del kiosco de autoservicio
│   ├── dashboard.js        # Dashboard reactivo y métricas
│   ├── clientes.js         # Tabla de clientes y búsqueda
│   ├── inscripcion.js      # Formulario de alta de clientes
│   └── perfil.js           # Panel lateral de historial
├── src/                    # Backend Node.js
│   ├── controllers/
│   │   └── clientes.controller.js   # Lógica de negocio
│   ├── middlewares/
│   │   └── errorHandler.js          # Manejo global de errores
│   ├── models/
│   │   └── cliente.model.js         # Esquema Mongoose
│   ├── routes/
│   │   └── clientes.routes.js       # Definición de endpoints
│   └── index.js                     # Entrada del servidor
├── index.html              # Entrada principal del frontend
├── .env                    # Variables de entorno (no subir)
├── .gitignore
└── package.json
```

---

## 🔌 Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/ping` | Health check del servidor |
| `GET` | `/api/clientes` | Obtener todos los clientes |
| `GET` | `/api/clientes/dni/:dni` | Buscar cliente por DNI (kiosco) |
| `POST` | `/api/clientes` | Inscribir nuevo cliente |
| `PUT` | `/api/clientes/:id` | Editar datos de un cliente |
| `DELETE` | `/api/clientes/:id` | Eliminar cliente |
| `POST` | `/api/clientes/:id/ingreso` | Registrar ingreso por kiosco |
| `POST` | `/api/clientes/:id/renovar` | Renovar cuota y registrar pago |

---

## 💡 Futuras Implementaciones

- [ ] Modo **Offline-first** con sincronización local
- [ ] Exportación avanzada de reportes en PDF
- [ ] Integración con sistemas de facturación electrónica
- [ ] Notificaciones automáticas de vencimiento por WhatsApp
- [ ] App móvil para socios (credencial digital + rutinas)

---

*Desarrollado con dedicación para optimizar la gestión de gimnasios.*

---

### 📬 Contacto

¿Tenés dudas sobre el proyecto o querés conectar?

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/camilovenesia/)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:venesiacamilo.dev@gmail.com)