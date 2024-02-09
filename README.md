# Practica final Docker-Compose

## Pasos necesarios para poner en marcha el proyecto

...

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

#### Archivo .env

Añadiremos al archivo **.env** de nuestro repositorio la variable de entorno que especifica el nombre de la base de datos a crear, habría que añadir esta línea:

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

#### Ejecución del docker-compose

Ejecutaremos el siguiente comando para que se cree el contenedor:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 2/2
 ✔ Network ej12_practica_net  Created                                                                              0.0s
 ✔ Container mongo_container  Started                                                                              0.0s
```

#### Comprobación del funcionamiento

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

#### Archivo .env

Hay que actualizar el archivo **.env** que está en la carpeta **backend** para que la variable del host de la base de datos apunte al servicio mongodb, la línea a cambiar quedaría:

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

#### Ejecución del docker-compose

Ejecutaremos el siguiente comando para ejecutar el docker-compose y ver si todo funciona correctamente:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 3/3
 ✔ Network ej12_practica_net  	Created									0.0s
 ✔ Container mongo_container  	Started									0.0s
 ✔ Container backend_container	Started									0.0s
```

#### Comprobación del funcionamiento

Una vez creados los contenedores, probaremos  el funcionamiento del contenedor **backend** entrando a **[http://localhost:4000](http://localhost:4000)**

![1707417685608](image/README/1707417685608.png)

![1707418053089](image/README/1707418053089.png)

Como podemos apreciar, todo funciona correctamente ya que está leyendo la base de datos del contenedor **MongoDB**

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

#### Archivo .env

Actualizaremos el archivo **.env** que está en la carpeta **frontend** para que utilice el puerto 3000, la línea a cambiar quedaría de esta manera:

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

#### Ejecución del docker-compose

Ejecutaremos el siguiente comando para ejecutar el docker-compose y ver si todo funciona correctamente:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 4/4
✔ Network   ej12_practica_net  	Created									0.1s
✔ Container mongo_container  		Started									0.0s
✔ Container backend_container		Started									0.0s
✔ Container frontend_container		Started                                                                 0.0s
```

#### Comprobación del funcionamiento

Una vez creados los contenedores, probaremos  el funcionamiento del contenedor **frontend** entrando a **[http://localhost:3000](http://localhost:3000)**

![1707418280304](image/README/1707418280304.png)

![1707418311134](image/README/1707418311134.png)

Como podemos apreciar, todo funciona correctamente ya que está leyendo la base de datos del contenedor **MongoDB**

### Servicio mongo-express

- **Nos permitirá administrar la base de datos mongo. Utilizará la imagen oficial de
  mongo-express (link)**
- **El contenedor asociado se denominará adminMongo_container**
- **Arrancará después del servicio de mongodb**

---

#### Archivo .env

Actualizaremos nuestro archivo .env de la ruta raíz para almacenar las variables necesarias para que funcione este servicio, modificaremos la variable **DB_HOST** para que quede así:

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

#### Ejecución del docker-compose

Ejecutaremos el siguiente comando para ejecutar el docker-compose y ver si todo funciona correctamente:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 5/5
✔ Network   ej12_practica_net  	Created									0.1s
✔ Container mongo_container  		Started									0.0s
✔ Container backend_container		Started									0.0s
✔ Container adminMongo_container	Started                                                                 0.1s
✔ Container frontend_container		Started                                                                 0.0s
```

#### Comprobación del funcionamiento

Ahora probaremos su funcionamiento accediendo a **[http://localhost:8081](http://localhost:8081)**

![1707418892460](image/README/1707418892460.png)

El servicio funciona, nos pide usuario y contraseña, usaremos las predeterminadas, usuario **admin** y contraseña **pass**

![1707418976495](image/README/1707418976495.png)

Como se ve en la imagen, todo funciona correctamente, ya que tenemos acceso al servidor de mongo y a sus bases de datos correspondientes.

### Servicio nginx-loadbalancer

- **Nos permitirá implementar un sistema de balanceo de carga/proxy en nuestro
  sistema**
- **Partirá de la imagen oficial de nginx**
- **Asociará un fichero de configuración de nginx (nginx.conf) que tendremos en la
  carpeta loadbalancer de nuestro repositorio con el mismo fichero de la carpeta
  /etc/nginx/ de la imagen. Este fichero nos permitirá implementar el balanceador de
  carga y su contenido será similar al adjuntado a esta tarea (realizando las
  modificaciones oportunas para adecuarlo a vuestras necesidades).**
- **Ejecutará como primer comando nada más arrancar: nginx -g daemon off**

---

#### Creación de la estructura

Crearemos una carpeta en la raíz del repositorio con nombre **loadbalancer**, y en esta carpeta, pondremos el archivo **nginx.conf** que se adjuntó con la práctica.

#### Modificación archivo nginx.conf

Ahora debemos modificar el archivo nginx.conf para acodomarlo a nuestras necesidades, en este caso, hay que intercambiar el puerto frontend y backend para que se ajusten a los que hemos usado nosotros.

También cambiaremos la ruta que hace referencia a la API para que apunte a la que utilizamos.

Además, hay que cambiar el nombre de los servidores para que apunte a los servicios backend y frontend.

Así quedaría nuestro documento **nginx.conf** con todas las modificaciones:

```nginx
events {
  worker_connections 1024;
}

http {
  upstream frontend {
    # These are references to our backend containers, facilitated by
    # Compose, as defined in docker-compose.yml
    server frontend:3000;
  } 
  upstream backend {
    # These are references to our backend containers, facilitated by
    # Compose, as defined in docker-compose.yml
    server backend:4000;
  }
  

 server {
    listen 80;
    server_name frontend;
    server_name backend;

    location / {
       resolver 127.0.0.1 valid=30s;
       proxy_pass http://frontend;
       proxy_set_header Host $host;
    }
    location /api/movies {
      resolver 127.0.0.1 valid=30s;
       proxy_pass http://backend;
       proxy_set_header Host $host;
    }
  }
}
```

#### Archivo docker-compose.yml

Volvemos a modificar el archivo **docker-compose.yml** para que se acomode a las necesidades de este servicio:

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
    nginx-loadbalancer:
        image: nginx:latest
        container_name: nginx-loadbalancer_container
        ports: 
            - "80:80"
        volumes:
            - ./loadbalancer/nginx.conf:/etc/nginx/nginx.conf
        command: nginx -g "daemon off;"
        networks:
            - practica_net
networks:
    practica_net:
        driver: bridge
```

Personalmente, le hemos añadido un nombre al contenedor para tener una mejor organización de la práctica.

#### Ejecución del docker-compose

Ejecutaremos el siguiente comando para ejecutar el docker-compose y ver si todo funciona correctamente:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 6/6
 ✔ Network ej12_practica_net               Created                                                                 0.1s
 ✔ Container mongo_container               Started                                                                 0.1s
 ✔ Container nginx-loadbalancer_container  Started                                                                 0.1s
 ✔ Container backend_container             Started                                                                 0.0s
 ✔ Container adminMongo_container          Started                                                                 0.1s
 ✔ Container frontend_container            Started                                                                 0.0s
```

#### Comprobación del funcionamiento

Una vez se han creado e iniciado todos los contenedores, probaremos el funcionamiento del loadbalancer accediendo primero a la dirección **[http://localhost](http://localhost)** para comprobar el funcionamiento del **frontend** y después se probará la dirección **[http://localhost/api/movies](http://localhost/api/movies)** que nos devolverá una respuesta JSON de la **API backend**.

![1707419863520](image/README/1707419863520.png)

![1707420603936](image/README/1707420603936.png)

Todo está funcionando correctamente.

### Servicio Prometheus

- **Servicio Prometheus
  Prometheus es una aplicación que nos permite recoger métricas de una aplicación
  en tiempo real. Como veréis en el ejemplo de app.js, se incluye una dependencia
  en el código (prom-client) que permite crear contadores de peticiones que podemos
  asociar fácilmente a nuestros endpoints de manera que podemos saber cuántas
  veces se ha llamado a una función de nuestra api.
  En nuestro caso, el servicio de prometheus se encargará de arrancar en el puerto
  9090 de nuestro host un contenedor (prometheus_practica) basado en la imagen
  prom/prometheus:v2.20.1. Para poder configurar correctamente este servicio, será
  necesario realizar además dos acciones:**
- **Copiar el fichero adjunto prometheus.yml al directorio /etc/prometheus del
  contenedor**
- **Ejecutar el comando --config.file=/etc/prometheus/prometheus.yml**

---

#### Creación de la estructura

Creamos una carpeta con nombre **prometheus** en el directorio raíz y en esta carpeta ponemos el archivo adjunto **prometheus.yml**

#### Modificación archivo index.js

Ahora, implementaremos Prometheus en nuestro proyecto, para ello modificaremos el archivo **index.js** tanto de la carpeta **backend** como **frontend**

Así quedaría el archivo:

```javascript

const mongoose = require('mongoose');
const express = require('express');
const nunjucks = require('nunjucks');
const cookieParser = require('cookie-parser')
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const counterHomeEndpoint = new client.Counter({
    name: 'counterHomeEndpoint',
    help: 'The total number of processed requests'
});
require('dotenv').config();



const moviesRouter = require('./routes/movies.js')
const moviesRouterAPI = require('./routes/moviesAPI.js')
const usersRouterAPI = require('./routes/usersAPI.js')
const refreshRouter = require('./routes/refresh.js')
const usersRouter = require('./routes/users.js')
const dbHost = process.env.DB_HOST;
const port = process.env.APP_PORT;
const app = express()


app.set('view engine', 'njk');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Totes les rutes associades a /movies estaran definides en moviesRouter

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/refresh', refreshRouter)
app.use('/movies', moviesRouter)
app.use('/api/movies', moviesRouterAPI)
app.use('/users', usersRouter)
app.use('/api/users', usersRouterAPI)



app.get('/', function (req, res) {
    counterHomeEndpoint.inc();
    res.render('index');
});

app.get('/metrics', (req, res) => {
    res.setHeader('Content-Type',client.register.contentType)
    client.register.metrics().then(data => res.send(data));
 });



// Conexión con la BD
mongoose.connect(`mongodb://${dbHost}/movies`);



// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor en funcionament a http://localhost:${port}`);
});
```

Se ha actualizado la función de la ruta /metrics ya que la adjunta no estaba funcionando.

#### Modificación del archivo prometheus.yml

Se modifica el archivo **prometheus.yml** para que apunte a nuestros servidores de **backend** y **frontend.**

Este sería el contenido final del archivo:

```yml
global:
  scrape_interval: 5s
  evaluation_interval: 30s
scrape_configs:
  - job_name: "node.js---movies-mvc"
    honor_labels: true
    static_configs:
      - targets: ["backend:4000", "frontend:3000"]
```

#### Archivo docker-compose.yml

Volvemos a modificar el archivo **docker-compose.yml** para que se acomode a las necesidades de este servicio:

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
    nginx-loadbalancer:
        image: nginx:latest
        container_name: nginx-loadbalancer_container
        ports: 
            - "80:80"
        volumes:
            - ./loadbalancer/nginx.conf:/etc/nginx/nginx.conf
        command: nginx -g "daemon off;"
        networks:
            - practica_net
    prometheus:
        image: prom/prometheus:v2.20.1
        container_name: prometheus_practica
        volumes:
            - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
        command: --config.file=/etc/prometheus/prometheus.yml
        ports:
            - "9090:9090"
        networks:
            - practica_net
networks:
    practica_net:
        driver: bridge
```

#### Ejecución del docker-compose

Ejecutaremos el siguiente comando para ejecutar el docker-compose y ver si todo funciona correctamente:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 7/7
 ✔ Network ej12_practica_net               Created                                                                 0.0s
 ✔ Container prometheus_practica           Started                                                                 0.1s
 ✔ Container mongo_container               Started                                                                 0.1s
 ✔ Container nginx-loadbalancer_container  Started                                                                 0.1s
 ✔ Container backend_container             Started                                                                 0.0s
 ✔ Container adminMongo_container          Started                                                                 0.0s
 ✔ Container frontend_container            Started                                                                 0.0s
```

#### Comprobación del funcionamiento

Ahora que todos los contenedores se crearon y se inciaron, probaremos que funciona el servicio accediendo a **[http://localhost:9090/targets](http://localhost:9090/targets)**

Ahí veremos si los endpoints funcionan:

![1707438642984](image/README/1707438642984.png)

Están funcionando correctamente, ahora comprobaremos que se está registrando cada vez que un usuario acceda a **[http://localhost:3000](http://localhost:3000)** o **[http://localhost:4000](http://localhost:4000)**

Accedemos a las direcciones y refrescamos la página unas cuantas veces para que se sumen los accesos al registro.

Una vez hecho esto, vamos a **[http://localhost:9090](http://localhost:9090)** y en el selector **- insert metric at cursor -** seleccionamos **counterHomeEndPoint** y le damos al botón de **Execute**

![1707438921429](image/README/1707438921429.png)

Como se puede ver, cada vez que se accede a una de estas dos direcciones queda registrado en Prometheus.

### Servicio Grafana

**Este servicio será el encargado de graficar todas las métricas creadas por el
servicio de Prometheus. Por tanto, siempre arrancará tras el de prometheus. En
nuestro caso, el servicio de grafana se encargará de arrancar en el puerto 3500 de
nuestro host un contenedor (grafana_practica) basado en la imagen
grafana/grafana:7.1.5 que, además, se caracterizará por:**

- **Establecer las variables de entorno necesarias para:**
- **Deshabilitar el login de acceso a Grafana**
- **Permitir la autenticación anónima**
- **Que el rol de autenticación anónima sea Admin**
- **Que instale el plugin grafana-clock-panel 1.0.1**
- **Dispondrá de un volumen nombrado (myGrafanaVol) que permitirá
  almacenar los cambios en el servicio ya que se asociará con el directorio
  /var/lib/grafana
  Además, para una correcta configuración de Grafana, será necesario realizar la
  copia del fichero adjunto datasources.yml al directorio del contenedor
  /etc/grafana/provisioning/datasources/.**

---

#### Creación de la estructura

En el directorio raíz de nuestro proyecto crearemos una carpeta **grafana** y otra carpeta con el nombre de **myGrafanaVol**, además, moveremos el archivo **datasources.yml** adjunto en la práctica a la carpeta **grafana**.

#### Archivo .env

Modficaremos el archivo .env que está en la raíz de nuestro proyecto para que contenga las variables de entorno requeridas por el servicio:

Añadiremos al final del archivo estas líneas:

```.env
GF_AUTH_BASIC_ENABLED=false
GF_AUTH_ANONYMOUS_ENABLED=true
GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
GF_INSTALL_PLUGINS=grafana-clock-panel
```

#### Archivo docker-compose.yml

Una vez más, modificaremos el archivo **docker-compose.yml** para que se acomode a las necesidades del servicio Grafana:

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
    nginx-loadbalancer:
        image: nginx:latest
        container_name: nginx-loadbalancer_container
        ports: 
            - "80:80"
        volumes:
            - ./loadbalancer/nginx.conf:/etc/nginx/nginx.conf
        command: nginx -g "daemon off;"
        networks:
            - practica_net
    prometheus:
        image: prom/prometheus:v2.20.1
        container_name: prometheus_practica
        volumes:
            - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
        command: --config.file=/etc/prometheus/prometheus.yml
        ports:
            - "9090:9090"
        networks:
            - practica_net
    grafana:
        image: grafana/grafana:7.1.5
        container_name: grafana_practica
        volumes:
            - ./myGrafanaVol:/var/lib/grafana
            - ./grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
        environment:
            - GF_AUTH_BASIC_ENABLED=${GF_AUTH_BASIC_ENABLED}
            - GF_AUTH_ANONYMOUS_ENABLED=${GF_AUTH_ANONYMOUS_ENABLED}
            - GF_AUTH_ANONYMOUS_ORG_ROLE=${GF_AUTH_ANONYMOUS_ORG_ROLE}
            - GF_INSTALL_PLUGINS=${GF_INSTALL_PLUGINS}
        depends_on:
            - prometheus
        ports:
            - "3500:3000"
        networks:
            - practica_net
networks:
    practica_net:
        driver: bridge
```

#### Ejecución del docker-compose

Ejecutaremos el siguiente comando para ejecutar el docker-compose y ver si todo funciona correctamente:

```powershell
PS E:\EJ12_FINAL\EJ12> docker-compose up -d
[+] Running 8/8
 ✔ Network ej12_practica_net               Created                                                                 0.0s
 ✔ Container mongo_container               Started                                                                 0.1s
 ✔ Container nginx-loadbalancer_container  Started                                                                 0.0s
 ✔ Container prometheus_practica           Started                                                                 0.0s
 ✔ Container grafana_practica              Started                                                                 0.1s
 ✔ Container backend_container             Started                                                                 0.0s
 ✔ Container adminMongo_container          Started                                                                 0.0s
 ✔ Container frontend_container            Started                                                                 0.0s
```

#### Comprobación del funcionamiento

Una vez todo esté creado y puesto en marcha, comprobamos el funcionamiento, accedemos a la dirección **[http://localhost:3500](http://localhost:3500)**

Si todo va bien, veremos la página de inicio de Grafana

![1707442457150](image/README/1707442457150.png)

Ahora vamos a Configurations->Plugins o a **[http://localhost:3500/plugins](http://localhost:3500/plugins)** y buscando la palabra **clock** podremos ver que el plugin grafana-clock-panel está instalado

![1707442637407](image/README/1707442637407.png)

Por último, iremos a la sección **Explore** o a **[http://localhost:3500/explore](http://localhost:3500/explore)** , pulsaremos en **Metrics** y seleccionaremos **counterHomeEndPoint**, si todo funciona correctamente deberíamos poder ver una gráifca con el acceso a las direcciones registradas por Prometheus

![1707442877165](image/README/1707442877165.png)
