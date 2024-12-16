# API de Trazo

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://www.trazoarq.com/wp-content/uploads/2021/05/logo-30.svg" width="200" alt="Logo de Trazo" /></a>
</p>

## Descripción

Este repositorio contiene la API oficial del proyecto **Trazo**, diseñada para gestionar una tienda en línea y un panel administrativo. Está construida utilizando tecnologías modernas como **NestJS**, **Prisma**, y **PostgreSQL**, garantizando rendimiento, escalabilidad y facilidad de mantenimiento.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Comandos para Ejecutar el Proyecto](#comandos-para-ejecutar-el-proyecto)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## Requisitos Previos

Antes de iniciar, asegúrate de tener instalados los siguientes componentes:

- **[Node.js](https://nodejs.org/)**: v18 o superior
- **[PostgreSQL](https://www.postgresql.org/)**: v13 o superior
- **npm**: v8 o superior (incluido con Node.js)

---

## Instalación

Clona este repositorio e instala las dependencias necesarias:

```bash
# Clonar el repositorio
$ git clone https://github.com/tu-repositorio/trazo-api.git

# Navegar al directorio del proyecto
$ cd trazo-api

# Instalar dependencias
$ npm install
```

Configura las variables de entorno según el archivo `.env.example`. Asegúrate de que las credenciales de la base de datos y otros valores sean correctos.

---

## Comandos para Ejecutar el Proyecto

### Desarrollo

Ejecuta el servidor en modo de desarrollo con recarga automática:

```bash
$ npm run start:dev
```

### Producción

Compila el código TypeScript a JavaScript y ejecuta el servidor en producción:

```bash
$ npm run build
$ npm run start:prod
```

### Otros Comandos Útiles

- **Ejecución en Modo de Observación (Watch Mode)**:
  ```bash
  $ npm run start:dev
  ```
- **Pruebas Unitarias**:
  ```bash
  $ npm run test
  ```
- **Generar Prisma Migrations**:
  ```bash
  $ npx prisma migrate dev
  ```

---

## Contribución

Estamos abiertos a contribuciones de la comunidad. Si deseas colaborar:

1. Haz un fork del repositorio.
2. Crea una nueva rama para tu funcionalidad o corrección:
   ```bash
   $ git checkout -b feature/nueva-funcionalidad
   ```
3. Envía tus cambios en un Pull Request con una descripción detallada.

Por favor, sigue las pautas de contribución y asegúrate de que tus cambios pasen todas las pruebas.

---

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
