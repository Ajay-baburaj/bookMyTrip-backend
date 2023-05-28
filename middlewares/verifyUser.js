require('dotenv').config();
const jwt = require('jsonwebtoken');
const { verify_JWT_Token } = require('../helper/jwt');


module.exports.verifyUser = (JWT_SECRET) => {
    async function verify(req, res, next){
        const authHeader = req.headers['authorization'];
        console.log("isComing",authHeader)
        if (authHeader) {
            const token = authHeader.split(" ")[1]
            if (token == null) {
                return res.sendStatus(401);
            }
            try {
                const response = await verify_JWT_Token(token, JWT_SECRET);
                req.user = response.email;
                next();
            } catch (err) {
                return res.status(403).json({ msg: "Token is not valid" });
            }
        } else {
            console.log("call is coming from here")
            res.status(401).json({ msg: "you are not authenticated" });
        }
    }
    return verify;
}

