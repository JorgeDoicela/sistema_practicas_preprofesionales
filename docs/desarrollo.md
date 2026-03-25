# Guía de Desarrollo y Estándares - EmiTesis

Este documento es una referencia para desarrolladores que deseen contribuir o realizar mantenimiento al sistema.

## 1. Estándares de Código

*   **Lenguaje:** TypeScript obligatorio en todo el proyecto.
*   **Formato:** Uso de Prettier configurado para comillas simples y punto y coma.
*   **Naming:** 
    *   Variables y funciones: `camelCase`.
    *   Clases y Interfaces: `PascalCase`.
    *   Archivos: `kebab-case.ts`.

## 2. Comandos de Consola Útiles

### Desarrollo Local (Docker)
```bash
# Levantar el sistema completo
docker-compose up --build

# Ver logs de un servicio específico
docker-compose logs -f api
```

### Gestión de Base de Datos (Prisma)
Dentro de la carpeta `api-emitesis`:
```bash
# Sincronizar esquema con la DB
npx prisma migrate dev

# Abrir el explorador visual de base de datos
npx prisma studio

# Generar el cliente de Prisma
npx prisma generate
```

## 3. Estructura de Carpetas

### Backend (`api-emitesis`)
*   `src/modules/`: Lógica de negocio dividida por dominios (Users, Auth, etc.).
*   `src/infrastructure/`: Proveedores de servicios (Storage, Email).
*   `src/prisma/`: Esquemas y semillas (seeds).

### Frontend (`web-emitesis`)
*   `src/app/`: Estructura de rutas (Next.js App Router) dividida por Roles.
*   `src/components/`: Componentes de interfaz compartidos.

## 4. Documentación de API
Todos los endpoints deben estar marcados con decoradores de Swagger (`@ApiTags`, `@ApiProperty`, etc.). La documentación se consulta en tiempo real en la ruta `/api/docs`.
