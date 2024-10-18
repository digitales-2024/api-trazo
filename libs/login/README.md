<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripcion

[Nest](https://docs.nestjs.com/) Crear un Proyecto - Documentacion oficial Nest.

[Crear Libreria Nest](https://docs.nestjs.com/cli/libraries) Crea una libreria documentacion oficial Nest.

## Crear y Usar la Libreria Login en un Proyecto

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://thumbs.dreamstime.com/b/team-hierarchy-connection-group-digital-digitalteam-high-quality-photo-208264515.jpg" width="300" alt="Nest Logo" /></a>
</p>

```bash

# Crear una libreria en el proyecto con el nombre del repositorio "login".

nest g library login

# La configuracion al usar el comando sera.

? What... ? @login

# Se creara una carpeta "libs" que administra librearias creadas ubicamos "login".

# El comando configurara las dependencias de la libreria creada dentro del proyecto en los archivos.

tsconfig.json

package.json

# La estructura de libs con la libreria login debe de ser la siguente.

libs
└───login
    │   tsconfig.lib.json
    │
    └───src
            index.ts
            login.module.ts
            login.service.spec.ts
            login.service.ts

# Podemos crear mas librerias dentro de libs con.

nest g library nueva-libreria

# Y podemos gestionar logica para esa nueva librearia como crear un CRUD basico con el comando Cli de nest.

nest g resource nuevo-modulo --no-spec

Api

Yes

# //Pero no nos enfocaremos en el crud//

# Vamos a reemplazar la libreria "login" con el repositorio Git de Login con.

git clone https://github.com/alexfloresv/login.git

# Para este paso tenemos que ubicarnos dentro de libs y reemplar a login.
# las depencias ya estan creadas al crear la libreria "login" con el nombre del repositorio Git

```
## Importacion de la libreria Login a el Proyecto

```bash
# Ingresamos al modulo principal del Proyecto

app.module.ts

# Importamos la libreria

import { LoginModule } from '@login/login';// Importar librearía de login
import { AdminModule } from '@login/login/admin/admin.module'; // Importar AdminModule para acceder a toda la lógica de autentificacion de admin
import { UsersModule } from '@login/login/admin/users/users.module'; // Importar UsersModule para acceder a toda la lógica CRUD de creación de usuarios

imports: [LoginModule,AdminModule, UsersModule], // Importar LoginModule para acceder a toda la lógica

# Configuramos el archivo  "main.ts" del proyecto principal  con la Importacion de "cookieParser".

import * as cookieParser from 'cookie-parser';// Importar cookieParser

# Agregamos el uso de esta libreria dentro de la funcion principal

app.use(cookieParser());//parsear cookies


```

## Configuracion estandar de paquetes de NodeJs

```bash
# Una vez Importada la libreria configuramos las dependencias que usa la libreria
# Dentro del proyecto principal en "package.json".

"dependencies": {
    "@nestjs-modules/mailer": "^2.0.2",
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.2.3",
    "@nestjs/core": "^10.0.0",
    "@nestjs/event-emitter": "^2.0.4",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/mapped-types": "*",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.4.0",
    "@prisma/client": "^5.20.0",
    "bcrypt": "5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "cookie-parser": "^1.4.6",
    "ejs": "^3.1.10",
    "express-session": "^1.18.0",
    "generate-password": "^1.7.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.3.0",
    "@commitlint/config-conventional": "^19.2.2",
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^4.17.17",
    "@types/express-session": "^1.18.0",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.0.0",
    "husky": "^8.0.0",
    "jest": "^29.5.0",
    "lint-staged": "^15.2.8",
    "prettier": "^3.3.3",
    "prisma": "^5.20.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },

  # Una vez configurada las depencias usar el comando

$ npm i

```

## Configuracion de la base de datos que usa la libreria Login

```bash
# Creamos las tablas basicas que usa la libreria usando el ORM Prisma
# Instamos Prisma en el proyecto principal si no esta aun instalado con.

npm install prisma -g

prisma init

# Configuracion del archivo .env
# Copiamos y pegamos la configuracion de .env que se encuentra dentro de la libreria en el archivo.

env.txt

# Configuramos env para que apunte a nuestra base de datos
# Esta configuracion apunta a una base de datos llamada login 

DATABASE_URL="postgresql://admin:admin@localhost:5432/login?schema=public"

# Copiar y pegar la estructura de tablas de la libreria login que esta en el archivo.

schemaLogin.txt

# El archivo se encuetra dentro de la libreria login copiamos esta estructura.
# Al proyecto principal dentro del archivo.

schema.prisma

# ejecutamos la Migracion de la estructura a nuestra base de datos con el comando

npx prisma migrate dev

# Fin de la configuracion de la libreria login


```

## Uso de la libreria 

```bash
# Ejecutamos el Proyecto Principal con

$ npm run start:dev

# verificamos que no envie errores si es el caso verificar las depencias  en los archivos 
# Antes mencionados del proyecto principal

tsconfig.json

package.json

# Iniciamos Postman o otro para enviar solicitudes al backend

# Primero crearemos el super admin con

# crear super admin usuario

@post
http://localhost:3000/seeds

# Login usuario

@post
http://localhost:3000/auth/login

# Cerrar Seccion user
@post
http://localhost:3000/auth/logout

# Ver todos los usuarios
@get
http://localhost:3000/users

# Para crear un nuevo usuario es necesario un rol iremos la tabla rol de la base de datos
# y agregaremos de manera forzada un nuevo rol como id en el registro ingresaremos
# "1634ead1-8146-47ac-8aa7-4cf97f76efc3" y llenamos los campos 

id:1634ead1-8146-47ac-8aa7-4cf97f76efc3 ; name:usuario ; description:usuario ; isActive:t ("t=true; f=false") ; createAt: ; updatedAt: ;

# Ahora podemos crear usuarios

#  crea usuarios

@post
http://localhost:3000/users

# enviar json* contraseña con mayusculas minimas (1) y minimo (1) numero y minimo de caracteres de contraseña (6)
{
"name": "usuarioNuevo",
"email": "usuario.nuevo@gmail.com",
"password": "Usuario1234",
"phone": "",
"roles": [
"1634ead1-8146-47ac-8aa7-4cf97f76efc3"
]
}

# Actualizamos usuarios

@Patch
http://localhost:3000/users/"id del usuario creado "

# enviar json*

{
"name": "tuNombre"
}

# Eliminar usuario

@delete
http://localhost:3000/users/"id-del usuario"}

# Fin uso de entrade datos que maneja la libreria Login

# Usar restringcion de login usando el decorador de. 

@Auth

# En el sistema para ingresar al sistema invocalo en el contralador del Proyecto Principal

```

## Soporte

Documetacion Nest [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Alx,Fernado]
- Website - [https://nestjs.com](https://nestjs.com/)

## License

Nest is [MIT licensed](https://nestjs.com).
