const express = require("express");
const mongoose = require("mongoose");

// Connexió a MongoDB
mongoose
.connect(
    "mongodb://127.0.0.1:27017/movies",
    { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((error) => {
    console.log("Error connecting to MongoDB", error);
});


// Model de Movie
const Movie = require("../models/movies.js");

// Dades de prova
const movies = require("../movies.json");

// Inserir dades a la base de dades a partir del fitxer JSON
Movie.insertMany(movies)
.then(() => {
    console.log("Data inserted");
})
.catch((error) => {
    console.log("Error inserting data", error);
});