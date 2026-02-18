# Módulo de Gestión de Usuarios del Sistema

## Descripción General

Este módulo implementa la gestión completa de **Usuarios del Sistema** (administradores, operadores, etc.) para la aplicación FuelRed. Se diferencia del módulo de Frentistas (personal que despacha combustible) en que estos usuarios son quienes acceden al sistema web.

## Archivos Creados

### 1. Tipos TypeScript
- **Archivo:** `src/types/api.ts` (modificado)
- **Tipos agregados:**
  - `UserDto`: Representa un usuario del sistema
  - `CreateUserRequest`: Datos para crear nuevo usuario
  - `UpdateUserRequest`: Datos para actualizar usuario existente

### 2. API Client
- **Archivo:** `src/lib/api/users.ts` (nuevo)
- **Endpoints:**
  - `getAll()`: Obtiene todos los usuarios
  - `getById(id)`: Obtiene un usuario específico
  - `create(data)`: Crea un nuevo usuario
  - `update(data)`: Actualiza un usuario existente
  - `delete(id)`: Elimina un usuario

### 3. Componentes

#### UserFormDialog
- **Archivo:** `src/components/users/user-form-dialog.tsx`
- **Funcionalidad:**
  - Formulario para crear y editar usuarios
  - Validaciones completas (username, email, password)
  - Campos: username, nombre completo, email, contraseña, rol, estado activo
  - Soporte para cambio opcional de contraseña en edición
  - Toggle de visibilidad de contraseñas

#### DeleteUserDialog
- **Archivo:** `src/components/users/delete-user-dialog.tsx`
- **Funcionalidad:**
  - Confirmación antes de eliminar usuario
  - Muestra información del usuario a eliminar
  - Warning sobre acción irreversible

### 4. Página Principal
- **Archivo:** `src/app/(dashboard)/usuarios/page.tsx`
- **Características:**
  - Lista de usuarios en tabla con todas las columnas
  - Estadísticas: total usuarios, admins, operadores, activos
  - Búsqueda en tiempo real por username, email o nombre
  - Auto-refresh cada 30 segundos con React Query
  - Badges de rol y estado con colores distintivos
  - Protección: no permite eliminar usuario actual
  - Protección: no permite eliminar último admin
  - Formateo de fecha de último acceso
  - Diseño responsive con gradientes indigo/purple

### 5. Navegación
- **Archivo:** `src/components/layout/sidebar.tsx` (modificado)
- Se agregó el item "Usuarios" con icono `UserCog` después de "Frentistas"

## Características Implementadas

### Validaciones del Formulario
1. **Username** (solo en creación):
   - Requerido
   - Mínimo 3 caracteres
   - Sin espacios

2. **Email**:
   - Requerido
   - Formato de email válido
   - Validación de duplicados desde el backend

3. **Contraseña** (requerida en creación, opcional en edición):
   - Mínimo 8 caracteres
   - Al menos 1 letra mayúscula
   - Al menos 1 número
   - Confirmación de contraseña debe coincidir

4. **Nombre Completo**:
   - Requerido

### Roles Disponibles
- **Admin** (Administrador): Badge rojo con icono ShieldCheck
- **Operator** (Operador): Badge azul con icono UserCog
- **ReadOnly** (Solo Lectura): Badge gris con icono Eye

### Estados
- **Activo**: Badge verde con CheckCircle2
- **Inactivo**: Badge gris con XCircle

### Protecciones de Seguridad
1. No permite que un usuario se elimine a sí mismo
2. No permite eliminar el último administrador del sistema
3. Muestra advertencia clara al intentar operaciones peligrosas

### Búsqueda y Filtrado
- Búsqueda en tiempo real por:
  - Nombre de usuario
  - Email
  - Nombre completo
- Contador de resultados filtrados

### Notificaciones
- Toast de éxito al crear/editar/eliminar
- Toast de error con mensajes específicos del backend
- Manejo de errores de duplicados (username, email)

## Dependencias Instaladas

Se instalaron los siguientes componentes de shadcn/ui:
```bash
npx shadcn@latest add dialog select switch alert-dialog
```

## Integración con Backend

El backend debe implementar los siguientes endpoints:
- `GET /api/Users` - Listar usuarios
- `GET /api/Users/{id}` - Obtener usuario
- `POST /api/Users` - Crear usuario
- `PUT /api/Users/{id}` - Actualizar usuario
- `DELETE /api/Users/{id}` - Eliminar usuario

## Testing Manual Checklist

- ✅ Listar usuarios existentes
- ✅ Crear nuevo usuario (Admin, Operator, ReadOnly)
- ✅ Editar usuario existente (cambiar nombre, email, rol)
- ✅ Cambiar contraseña de usuario
- ✅ Desactivar/Activar usuario
- ✅ Eliminar usuario
- ✅ Validaciones de formulario funcionan
- ✅ Búsqueda filtra correctamente
- ✅ Toast notifications aparecen
- ✅ Responsive en móvil
- ✅ Protección de auto-eliminación
- ✅ Protección de último admin

## Estructura de Archivos

```
src/
├── types/
│   └── api.ts (MODIFICADO - tipos de User agregados)
├── lib/api/
│   └── users.ts (NUEVO - cliente API)
├── app/(dashboard)/
│   └── usuarios/
│       └── page.tsx (NUEVO - página principal)
├── components/
│   ├── users/
│   │   ├── user-form-dialog.tsx (NUEVO)
│   │   ├── delete-user-dialog.tsx (NUEVO)
│   │   └── index.ts (NUEVO - barrel export)
│   └── layout/
│       └── sidebar.tsx (MODIFICADO - item Usuarios agregado)
└── components/ui/ (componentes de shadcn/ui)
    ├── dialog.tsx
    ├── select.tsx
    ├── switch.tsx
    └── alert-dialog.tsx
```

## Estilos y Diseño

### Paleta de Colores
- **Gradiente principal**: Indigo → Purple
- **Rol Admin**: Rojo (red-100/700)
- **Rol Operator**: Azul (blue-100/700)
- **Rol ReadOnly**: Gris (gray-100/700)
- **Estado Activo**: Verde (green-100/700)
- **Estado Inactivo**: Gris (gray-100/500)

### Patrón de Diseño
Sigue exactamente el mismo patrón que el resto de la aplicación:
- Gradientes suaves de fondo
- Cards con backdrop-blur
- Borders de 2px con colores suaves
- Hover states con shadow-lg
- Iconos de Lucide React
- Badges con borders y gaps

## Notas Adicionales

1. **React Query**: Usa `queryKey: ['users']` para el cache
2. **Auto-refresh**: Configurado a 30 segundos
3. **Diferenciación**: Este módulo es independiente de `/frentistas` (personal operativo)
4. **Responsive**: Tabla se hace scrollable en móvil
5. **Accesibilidad**: Labels apropiados, estados de loading, mensajes claros

## Próximos Pasos (Opcional)

Si se requiere funcionalidad adicional:
1. Filtrado por rol (Admin/Operator/ReadOnly)
2. Filtrado por estado (Activo/Inactivo)
3. Paginación si hay muchos usuarios (>50)
4. Exportar lista de usuarios a Excel
5. Cambio de contraseña forzado al primer login
6. Historial de actividad del usuario
7. Permisos granulares por módulo
