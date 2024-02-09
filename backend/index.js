
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