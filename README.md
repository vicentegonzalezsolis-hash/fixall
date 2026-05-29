# Fixall — Sistema de gestión para talleres mecánicos

PWA mobile-first para talleres de reparación en Chile.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Auth + PostgreSQL + Storage + Realtime)
- **Tailwind CSS** con diseño dark custom
- **TypeScript** estricto
- **Twilio** (WhatsApp API)

## Setup rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variables de entorno
```bash
cp .env.local.example .env.local
# Completa con tus credenciales
```

### 3. Base de datos Supabase
En el SQL Editor de Supabase ejecuta el archivo:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Configurar Supabase Auth
En Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Correr en desarrollo
```bash
npm run dev
```

## Estructura

```
app/
  login/           → Magic link auth
  dashboard/       → OTs activas + stats
  ot/
    nueva/         → Crear OT con autocompletado de patente
    [id]/          → Detalle OT: items, fotos, estado, presupuesto
  patentes/        → Lista de vehículos
  patentes/nueva/  → Registrar vehículo
  patentes/[pat]/  → Historial del vehículo
  inventario/      → Stock con alertas
  reportes/        → Métricas mensuales
  perfil/          → Config del taller
  p/[token]/       → Presupuesto público para el cliente (sin auth)
  api/
    whatsapp/
      presupuesto/ → Envía link por WhatsApp al crear OT
      listo/       → Avisa cuando el vehículo está listo

components/
  OTCard.tsx       → Card de OT en lista
  EstadoBadge.tsx  → Badge de estado con colores
  FotoGrid.tsx     → Grid de fotos con lightbox
  FotoUploader.tsx → Upload a Supabase Storage
  BottomNav.tsx    → Navegación mobile

lib/
  supabase/        → Clientes (browser, server, middleware)
  twilio/          → sendWhatsApp helper

types/
  database.ts      → Tipos TypeScript de todas las tablas
```

## Flujo principal
1. Taller crea OT → autocompletado de patente → formulario vehículo/cliente
2. Agrega trabajos y repuestos → totales con IVA calculados automáticamente
3. Sube fotos de diagnóstico
4. Sistema envía WhatsApp al cliente con link `/p/[token]`
5. Cliente ve presupuesto público: fotos, desglose, total → aprueba/rechaza
6. Taller ve aprobación en tiempo real (Supabase Realtime)
7. Al marcar "Listo" → WhatsApp de retiro al cliente
8. Cierra OT y documenta con fotos de salida

## WhatsApp (Twilio)
Usa Twilio Sandbox para desarrollo. En producción necesitas número aprobado.
Documentación: https://www.twilio.com/docs/whatsapp/quickstart
