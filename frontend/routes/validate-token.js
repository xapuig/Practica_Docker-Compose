
const jwt = require('jsonwebtoken')
// const refreshTokenController = require('../controllers/refreshToken')

// Middleware per validar el token JWT
const verifyToken = (req, res, next) => {
    // Llegir el token del header de la petició
    const token = req.get('authorization')

    // Comprovar que rebem el token
    if (!token) {
        return res.status(401).json({
            error: 'Access denied'
        })
    }
    try {
        // Eliminar el prefix 'Bearer ' del token
        const tokenWithoutBearer = token.substring(7)
        // Validar el token
        const verified = jwt.verify(tokenWithoutBearer, process.env.SECRET_KEY)
        req.user = verified
        next()
    } catch (error) {
        res.status(400).json({
            error: 'Invalid token'
        })
    }
}

module.exports = verifyToken

// // Middleware per validar el token JWT
// const verifyTokenView = async (req, res, next) => {
//     // Llegir el token del header de la petició
//
//     const token  = await refreshTokenController.handleRefreshToken(req, res, next)
//     console.log( token )



//     // Comprovar que rebem el token
//     if (!token) {
//         return res.status(401).json({
//             error: 'Access denied'
//         })
//     }
//     try {
//         // Eliminar el prefix 'Bearer ' del token
//         const tokenWithoutBearer = token.substring(7)
//         // Validar el token
//         const verified = jwt.verify(tokenWithoutBearer, process.env.SECRET_KEY)
//         req.user = verified
//         next()
//     } catch (error) {
//         res.status(400).json({
//             error: 'Invalid token'
//         })
//     }
// }

// module.exports = verifyTokenView