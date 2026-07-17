# Kinetic Gym — Sistema de Gestión Web

Plataforma integral de gestión deportiva y control de accesos diseñada para reemplazar sistemas *legacy*. El proyecto está dividido en dos capas principales: un **Frontend** estático (Fase 1) y un **Backend** en Node.js/Express para la persistencia de datos (Fase 2).

---

## 📂 Estructura del Proyecto

El sistema está dividido en dos directorios principales: cliente (frontend) y servidor (backend).

### Frontend (`/kinetic`)
```text
kinetic/
├── index.html          ← Entrada principal de la app
├── css/
│   └── styles.css      ← Todos los estilos
└── js/
    ├── data.js         ← Datos y estado global (clientes, inscripciones temporales)
    ├── app.js          ← Login, tabs, modales, toast
    ├── kiosk.js        ← Teclado numérico y control de acceso por DNI
    ├── dashboard.js    ← Dashboard reactivo con métricas reales
    ├── clientes.js     ← Tabla de clientes con búsqueda
    ├── inscripcion.js  ← Formulario de alta de clientes
    └── perfil.js       ← Panel lateral con historial de ingresos




    ADMIN
Usuario: admin1234
clave: kinetic.dev


RECEPCION
Usuario: recepcion01
clave: kinetic

DUEÑO
Usuario: kinetic1270
clave: gimnasio1270