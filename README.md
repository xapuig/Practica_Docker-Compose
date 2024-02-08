# Practica final Docker-Compose

## **Cambios realizados para implementar la configuración pedida**

### **Servicio MongoDB**

- **Servicio de mongodb**
- **Utilizará la imagen docker oficial de mongo (link)**
- **El contenedor asociado se denominará mongo_container**
- **Será el primer servicio en arrancar**
- **La primera tarea que hará nada más arrancar será crear las tablas necesarias (link)
  y realizar una restauración de datos (link) partiendo de un fichero dump (link) que
  previamente habréis generado y almacenado en una carpeta mongo de vuestro
  proyecto.**
- **Todos los ficheros de configuración necesarios residirán en una carpeta mongo de
  nuestro repositorio**

---

#### Pasos necesarios para la creación y restauración del dump de la base de datos

Lo primero que hemos realizado es un dump de nuestra base de datos de MongoDB, se ha realizado con el la herramienta **mongodump** que pertenece al paquete **MongoDB Database Tools.**

Para realizar el dump, se ha ejecutado el siguiente comando en el terminal:

```powershell
PS C:\Program Files\MongoDB\Tools\100\bin> .\mongodump.exe --db movies --gzip --archive=dump_movies.gz
2024-02-07T20:21:10.243+0100    writing movies.movies to archive 'dump_movies.gz'
2024-02-07T20:21:10.258+0100    writing movies.users to archive 'dump_movies.gz'
2024-02-07T20:21:10.260+0100    done dumping movies.users (6 documents)
2024-02-07T20:21:10.260+0100    done dumping movies.movies (13 documents)
```

El resultado de esto es un archivo llamado **dump_movies.gz** con la base de datos **movies** y sus **colecciones** listas para restaurar en nuestro contenedor.

Ahora, creamos una carpeta **mongo** en nuestro repositorio y dentro de ésta, copiaremos el archivo **dump_movies.gz** que acabamos de generar.

Para poder restaurar el dump, hace falta crear un archivo llamado **mongorestore.sh** que colocaremos en el mismo directorio **mango** que acabamos de crear.

Este será su contenido:

```bash
mongorestore -d movies --gzip --archive="/mongo_restore/dump_movies.gz"
```

#### Fichero .env

Añadiremos al fichero **.env** de nuestro repositorio la variable de entorno que especifica el nombre de la base de datos a crear, habría que añadir esta línea:

`MONGODB_INITDB_DATABASE=movies`

#### Archivo docker-compose.yml

Procederemos a crear el archivo **docker-compose.yml** con los parámetros necesarios para conseguir lo requerido:

```yml
services:
    mongodb:
        image: mongo:latest
        container_name: mongo_container
        restart: always
        environment:
            - MONGO_INITDB_DATABASE=${MONGODB_INITDB_DATABASE}
        ports:
            - "27017:27017"
        volumes:
          - ./mongo/mongorestore.sh:/docker-entrypoint-initdb.d/mongorestore.sh
          - ./mongo:/mongo_restore
        networks:
            - practica_net
networks:
    practica_net:
        driver: bridge
```

A destacar, estamos montando el fichero local **mongorestore.sh** en la carpeta del contenedor **docker-entrypoint-initdb.d,** debido a que, cualquier archivo **sh** o **js** que se encuentre en este directorio se ejecutará automáticamente al crear el contenedor. También montamos la carpeta **mongo** de nuestro repositorio para que el contenedor tenga acceso al fichero **dump_movies.gz**

#### Ejecución del docker-compose y comprobación de funcionamiento:

Ejecutaremos el siguiente comando para que se cree el contenedor:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 2/2
 ✔ Network ej12_practica_net  Created                                                                              0.0s
 ✔ Container mongo_container  Started                                                                              0.0s
```

Ahora que el contenedor se ha creado y está en funcionamiento, veremos que MongoDB funciona y que se ha creado la base de datos, para comprobarlo, en este caso utilizaremos la herramienta propia de mongo **MongoDBCompass**

![1707332139807](image/README/1707332139807.png "Conexión MongoDBCompass")

Nos conectaremos a **mongodb://localhost:27017** y comprobamos que está la base de datos y las colecciones:

![1707333929779](image/README/1707333929779.png)

Como se puede ver, la base de datos y sus colecciones han sido creadas.

### Servicio backend

- **Igual que el servicio anterior, utilizará una multi-stage build (al menos tendrá dos
  etapas) para generar la imagen de la parte backend de vuestro proyecto
  implementada con express. Partirá de una imagen node:19-alpine**
- **No arrancará hasta que el servicio de mongodb no esté preparado completamente**
- **El contenedor asociado se denominará backend_container**
- **Ejecutará como primer comando nada más arrancar: npm start**

---

#### Creación de la estructura

Lo primero será crear la carpeta **backend** en nuestro repositorio local y mover todos los archivos necesarios para poder ejecutar el servicio:

Contenido de la carpeta backend:

![1707355867594](image/README/1707355867594.png)

#### Fichero .env

Hay que actualizar el fichero **.env** que está en la carpeta **backend** para que la variable del host de la base de datos apunte al servicio mongodb, la línea a cambiar quedaría:

`DB_HOST=mongodb`

Además, debemos cambiar también la línea del puerto, ya que para backend utilizaremos el puerto 4000, cambiaremos la línea y quedará así:

`APP_PORT=4000`

#### Dockerfile backend

En la carpeta **backend** crearemos un **Dockerfile** multi-etapa para implementar lo requerido:

Contenido del **Dockerfile:**

```.Dockerfile
# Etapa 1: Build
FROM node:19-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:19-alpine
WORKDIR /app
COPY --from=build /app/ ./
COPY package*.json ./
RUN npm install 
CMD ["npm", "start"]
```

En este **Dockerfile** de dos etapas, en la primera se construye la aplicación, y en la segunda, se crea la imagen final con tamaño reducido.

#### Archivo docker-compose.yml

Modificaremos el **docker-compose.yml** creado anteriormente añadiendo los cambios para cumplir con lo requerido en el servicio y quedaría así:

```yml
services:
    mongodb:
        image: mongo:latest
        container_name: mongo_container
        restart: always
        environment:
            - MONGO_INITDB_DATABASE=${MONGODB_INITDB_DATABASE}
        ports:
            - "27017:27017"
        volumes:
          - ./mongo/mongorestore.sh:/docker-entrypoint-initdb.d/mongorestore.sh
          - ./mongo:/mongo_restore
        networks:
            - practica_net
    backend:
        build:
            context: ./backend
            dockerfile: Dockerfile
        container_name: backend_container
        command: npm start
        ports:
            - "4000:4000"
        depends_on:
            - mongodb
        networks:
            - practica_net
networks:
    practica_net:
        driver: bridge
```

### Servicio frontend

- **Servicio de frontend**
- **Utilizará una multi-stage build (al menos tendrá dos etapas) para generar la
  imagen de vuestra parte implementada en angularjs o otro framework. Partirá de
  una imagen node:19-alpine**
- **Arrancará tras el servicio de backend**
- **El contenedor asociado se denominará frontend_container**
- **Ejecutará como primer comando nada más arrancar: npm start**

---

#### Creación de la estructura

Haremos una copia de la carpeta **backend** creada anteriormente y le cambiaremos el nombre a **frontend**

#### Fichero .env

Actualizaremos el fichero **.env** que está en la carpeta **frontend** para que utilice el puerto 3000, la línea a cambiar quedaría de esta manera:

`APP_PORT=3000`

#### Dockerfile frontend

En la carpeta **frontend** crearemos un **Dockerfile** multi-etapa para implementar lo requerido:

Contenido del **Dockerfile:**

```.Dockerfile
# Etapa 1: Build
FROM node:19-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:19-alpine
WORKDIR /app
COPY --from=build /app/ ./
COPY package*.json ./
RUN npm install 
CMD ["npm", "start"]
```

En este **Dockerfile** de dos etapas, en la primera se construye la aplicación, y en la segunda, se crea la imagen final con tamaño reducido.

#### Archivo docker-compose.yml

Modificaremos el **docker-compose.yml** creado anteriormente añadiendo los cambios para cumplir con lo requerido en el servicio y quedaría así:

```yml
services:
    mongodb:
        image: mongo:latest
        container_name: mongo_container
        restart: always
        environment:
            - MONGO_INITDB_DATABASE=${MONGODB_INITDB_DATABASE}
        ports:
            - "27017:27017"
        volumes:
          - ./mongo/mongorestore.sh:/docker-entrypoint-initdb.d/mongorestore.sh
          - ./mongo:/mongo_restore
        networks:
            - practica_net
    backend:
        build:
            context: ./backend
            dockerfile: Dockerfile
        container_name: backend_container
        command: npm start
        ports:
            - "4000:4000"
        depends_on:
            - mongodb
        networks:
            - practica_net
    frontend:
        build:
            context: ./frontend
            dockerfile: Dockerfile
        container_name: frontend_container
        command: npm start
        ports:
            - "3000:3000"
        depends_on:
            - backend
        networks:
            - practica_net
networks:
    practica_net:
        driver: bridge
```

### Servicio mongo-express

- **Nos permitirá administrar la base de datos mongo. Utilizará la imagen oficial de
  mongo-express (link)**
- **El contenedor asociado se denominará adminMongo_container**
- **Arrancará después del servicio de mongodb**

---

#### Fichero .env

Actualizaremos nuestro fichero .env de la ruta raíz para almacenar las variables necesarias para que funcione este servicio, modificaremos la variable **DB_HOST** para que quede así:

`DB_HOST=mongodb`

Y además, añadiremos esta variable:

`ME_CONFIG_MONGODB_URL=mongodb://mongodb:27017`

#### Archivo docker-compose.yml

Actualizaremos el archivo **docker-compose.yml** con los cambios necesarios para cumplir lo que pide este servicio:

```yml
services:
    mongodb:
        image: mongo:latest
        container_name: mongo_container
        restart: always
        environment:
            - MONGO_INITDB_DATABASE=${MONGODB_INITDB_DATABASE}
        ports:
            - "27017:27017"
        volumes:
          - ./mongo/mongorestore.sh:/docker-entrypoint-initdb.d/mongorestore.sh
          - ./mongo:/mongo_restore
        networks:
            - practica_net
    backend:
        build:
            context: ./backend
            dockerfile: Dockerfile
        container_name: backend_container
        command: npm start
        ports:
            - "4000:4000"
        depends_on:
            - mongodb
        networks:
            - practica_net
    frontend:
        build:
            context: ./frontend
            dockerfile: Dockerfile
        container_name: frontend_container
        command: npm start
        ports:
            - "3000:3000"
        depends_on:
            - backend
        networks:
            - practica_net
    mongo-express:
        image: mongo-express
        container_name: adminMongo_container
        ports:
            - "8081:8081"
        environment:
            - ME_CONFIG_MONGODB_SERVER=${DB_HOST}
            - ME_CONFIG_MONGODB_URL=${ME_CONFIG_MONGODB_URL}
        depends_on:
            - mongodb
        networks:
            - practica_net
networks:
    practica_net:
        driver: bridge
```


## Pasos necesarios para poner en marcha el proyecto
