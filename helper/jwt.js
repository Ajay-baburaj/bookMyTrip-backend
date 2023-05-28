const jwt = require('jsonwebtoken')

module.exports.generateToken = (payload,secret,expiryTime)=>{

    return jwt.sign({...payload},secret,{expiresIn:`${expiryTime}`})
}

module.exports.verify_JWT_Token = (token,secret)=>{
    return new Promise ((resolve,reject)=>{
        jwt.verify(token,secret,async(err,payload)=>{
            if(err){
                reject(err)
            }else{
                resolve(payload)
            }
        })
    })
}

