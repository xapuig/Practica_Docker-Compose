
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        default: "user"
    },
    refreshToken: {
        type: String
    }
})

const User = mongoose.model('Users', userSchema)

module.exports = User