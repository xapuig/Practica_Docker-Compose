
const express = require('express')

let router = express.Router()

const moviesController = require('../controllers/movies.js')

const verifyToken = require('../routes/validate-token.js')
// const verifyTokenView = require('../routes/validate-token.js')

// GET /movies - Retorna la llista de pel·lícules amb la opció de filtrar per gènere
router.get('/', moviesController.getMovies_View)


// POST /movies - Afegeix una pel·lícula a la llista
router.post('/', moviesController.postMovie_View)

// Resta d'endpoints DELETE, PATCH, etc.

// GET /movies/inserir - Mostra el Formulari per afegir pel·lícules
router.get('/inserir', moviesController.addMovies_View)


// POST /movies/:id - Elimina una pel·lícula de la llista
router.post('/delete/:id', moviesController.deleteMovie_View)


// GET /movies/editar/:id - Mostra el Formulari per editar pel·lícules
router.get('/editar/:id', moviesController.editMovie_View)

// POST /movies/actualitzar/:id - Actualitza una pel·lícula de la llista
router.post('/actualitzar/:id', moviesController.updateMovie_View)

// GET /movies/detall - Mostrar informació d' una pel·lícula 
router.get('/detall/:id', moviesController.infoMovie_View)


module.exports = router