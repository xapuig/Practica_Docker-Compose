
const express = require('express')

let routerUsers = express.Router()

const usersController = require('../controllers/users.js')

routerUsers.get('/login', usersController.getloginUser_View)
routerUsers.post('/login', usersController.postloginUser_View)

routerUsers.get('/register', usersController.getRegisternUser_View)
routerUsers.post('/register', usersController.postRegisterUser_View)


module.exports = routerUsers