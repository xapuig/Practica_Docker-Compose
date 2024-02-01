
const express = require('express')

let routerUsersAPI = express.Router()

const usersController = require('../controllers/usersAPI.js')

routerUsersAPI.post('/', usersController.loginUser)

routerUsersAPI.post('/register', usersController.registerUser)


module.exports = routerUsersAPI