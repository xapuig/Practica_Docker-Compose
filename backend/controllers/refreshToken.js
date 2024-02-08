const jwt = require('jsonwebtoken');

const User = require('../models/users.js');


const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken });
    if (!foundUser) return res.sendStatus(403); //Forbidden 
    // evaluate jwt 
    jwt.verify(
        refreshToken,
        process.env.SECRET_REFRESH_KEY,
        (err, decoded) => {
            if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
            const accessToken = jwt.sign(
                { "username": decoded.username },
                process.env.SECRET_KEY,
                { expiresIn: '30s' }
            );
            res.json({ accessToken })
            // console.log(accessToken)
            // return accessToken
        }
    );
}

module.exports = { handleRefreshToken }