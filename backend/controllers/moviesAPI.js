const Movie = require('../models/movies.js')
const crypto = require('crypto')

// GET /api/movies - Retorna la llista de pel·lícules amb la opció de filtrar per gènere
exports.getMovies_API = async (req, res) => {
    const { genre } = req.query;
    try {
        const movies = await Movie.find({})

        if (genre) {
            const filteredMovies = movies.filter(movie => movie.genre.includes(genre))
            res.json(filteredMovies)
        }
        if (Object.keys(req.query).length === 0)
            res.json(movies);
    } catch (error) {
        res.json({ message: "Error: " + error });
    }
}

// POST /api/movies - Afegeix una pel·lícula
exports.postMovie_API = async (req, res) => {
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
        res.json(newMovie)
    } catch (error) {
        res.json({ message: "Error: " + error });
    }
}


// DELETE /api/movies/:id - Esborrar una pel·lícula
exports.deleteMovie_API = async (req, res) => {
    try {
        const { id } = req.params;
        if (await Movie.findByIdAndDelete(id)) {
            res.json({ message: "Pel·lícula esborrada" });
        } else {
            res.status(404).json({ message: "Pel·lícula no encontrada" });
        }
    } catch (error) {
        res.json({ message: "Error: " + error });
    }
}


// PATCH /api/movies/:id Actualitzar una pel·lícula
exports.updateMovie_API = async (req, res) => {
    try {
        const { id } = req.params;

        if (await Movie.findByIdAndUpdate(id, req.body, { runValidators: true })) {
            res.json({ message: "Pel·lícula actualitzada" });
        } else {
            res.status(404).json({ message: "Pel·lícula no encontrada" });
        }
    } catch (error) {
        res.json({ message: "Error: " + error });
    }
}