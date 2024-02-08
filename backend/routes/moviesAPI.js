
const express = require('express')

let routerAPI = express.Router()

const moviesController = require('../controllers/moviesAPI.js')
const verifyToken = require('../routes/validate-token.js')

// GET /api/movies - Retorna la llista de pel·lícules amb la opció de filtrar per gènere
routerAPI.get('/', moviesController.getMovies_API)

// POST /api/movies - Afegeix una pel·lícula a la llista (versió amb validació de token)
routerAPI.post('/', verifyToken, moviesController.postMovie_API)

// Resta d'endpoints DELETE, PATCH, etc.

// DELETE /api/movies/:id - Elimina una pel·lícula de la llista (versió amb validació de token)
routerAPI.delete('/:id', verifyToken, moviesController.deleteMovie_API)

// PATCH /api/movies/:id Actualitzar una pel·lícula (versió amb validació de token)
routerAPI.patch('/:id', verifyToken, moviesController.updateMovie_API)


module.exports = routerAPI