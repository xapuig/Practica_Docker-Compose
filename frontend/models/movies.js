const mongoose = require('mongoose');

let moviesSchema = new mongoose.Schema({
    id: String,
    title: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        min: 1900,
        max: 2024
    },
    director: String,
    duration: {
        type: Number,
        min: 1
    },
    genre: [String],
    rate: {
        type: Number,
        min: 0,
        max: 10,
        default: 5
    }
});

let Movie = mongoose.model('Movies', moviesSchema);

module.exports = Movie;