const Movie = require('../models/movies.js')
const crypto = require('crypto')

// GET /movies - Retorna la llista de pel·lícules amb la opció de filtrar per gènere
exports.getMovies_View = async (req, res) => {
    const { genre } = req.query;


    try {
        const movies = await Movie.find({})

        if (genre) {
            const filteredMovies = movies.filter(movie => movie.genre.includes(genre))
            res.render('movies/llistar', { movies: filteredMovies })
        }
        if (Object.keys(req.query).length === 0)
            res.render('movies/llistar', { movies })
    } catch (error) {
        res.render('error', { error })
    }
}

// POST /movies - Afegeix una pel·lícula
exports.postMovie_View = async (req, res) => {
    const { title, year, director, duration, genre, rate } = req.body;


    try {
        const newMovie = await Movie.create({
            id: crypto.randomUUID(), // Generem un id únic (requereix mòdul crypto)
            title,
            year,
            director,
            duration,
            genre,
            rate
        })

        res.redirect('/movies')
    } catch (error) {
        const movie = new Movie(req.body) // Creem un nou objecte Movie amb les dades antigues del formulari
        // Si hi ha errors de validació, tornem a renderitzar el formulari amb els errors i les dades antigues
        res.render('movies/inserir', { movie, errors: error.errors })
    }
}

exports.addMovies_View = async (req, res) => {
    try {
        res.render('movies/inserir')
    } catch (error) {
        res.render('error', { error })
    }
}


exports.deleteMovie_View = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedMovie = await Movie.findByIdAndDelete(id)
        res.redirect('/movies')
    } catch (error) {
        res.render('error', { error })
    }
}

// Mostra el formulari d'edició de pel·lícules
exports.editMovie_View = async (req, res) => {
    const { id } = req.params;

    try {
        const movie = await Movie.findById(id)
        res.render('movies/editar', { movie })
    } catch (error) {
        res.render('error', { error })
    }
}

// POST /movies/:id - Actualitza una pel·lícula
exports.updateMovie_View = async (req, res) => {


    try {
        const { id } = req.params;
        //const movie = await Movie.findById(id)

        await Movie.findByIdAndUpdate(id, { title: req.body.title, year: req.body.year, director: req.body.director, duration: req.body.duration, genre: req.body.genre, rate: req.body.rate }, { runValidators: true })

        res.redirect('/movies')
    } catch (error) {

        const movie = new Movie(req.body) // Creem un nou objecte Movie amb les dades antigues del formulari
        // Si hi ha errors de validació, tornem a renderitzar el formulari amb els errors i les dades antigues
        res.render('movies/editar', { movie, errors: error.errors })
    }
}

exports.infoMovie_View = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.findById(id)
        res.render('movies/detall', { movie })
    } catch (error) {
        res.render('error', { error })
    }
}