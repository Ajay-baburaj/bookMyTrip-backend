const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const hotel = require('../model/hotelModel')
const User = require('../model/userModel')
const bcrypt = require('bcrypt')
const { emailsender } = require('../helper/nodemailer');
const { generateToken, verify_JWT_Token } = require('../helper/jwt');
const hotelModel = require('../model/hotelModel');
const { getFromS3 } = require('../helper/s3Bucket');
const {getWholeImagesOfHotel} = require('../helper/loginChecker')
const bookingModal =require('../model/bookingModel');
const { getFormattedDate } = require('../helper/dateFormat');
const bookingModel = require('../model/bookingModel');
// const { resolveClientEndpointParameters } = require('@aws-sdk/client-s3/dist-types/endpoint/EndpointParameters');
const maxAge = 3 * 24 * 60 * 60

const db = mongoose.connection;
const jwt_secret = "itsForSecretAdmin"
const refresh_secret = "itsForRefreshToken"

module.exports.login = async (req, res, next) => {
    const { email, password } = req.body
    try {
        const adminCredentials = await db.collection("admin").findOne({ email })
        if (adminCredentials) {
            const isValidPassword = await bcrypt.compare(password, adminCredentials.password)
            if (isValidPassword) {
                const token = generateToken({ email: email }, jwt_secret, "15m")            
                const refreshToken = generateToken({ email: email }, refresh_secret, "5d");
                res.cookie("accessToken", token, { httpOnly: false, maxage: maxAge * 1000, withCredentials: true })
                res.cookie("refreshToken", refreshToken, { httpOnly: false, maxage: maxAge * 1000, withCredentials: true })
                res.json({ status: true, msg: "log in successfull", user: adminCredentials.email, accessToken: token })
            } else {
                res.json({ paswordStatus: false, msg: "incorrect password" })
            }

        } else {
            res.json({ emailStatus: false, msg: "Incorrect email" })
        }

    } catch (err) {
        console.log(err.message)
    }

}

module.exports.testing = async (req, res, next) => {
    // const cookieValue = req.cookies['refreshToken']
    // console.log("cookie",cookieValue)
    // console.log("body",req.body)
    console.log("why call is not coming")
}

module.exports.refresh = async (req, res, next) => {
    const refreshToken = req.cookies['refreshToken']
    return new Promise(async (resolve, reject) => {
        await verify_JWT_Token(refreshToken, process.env.ADMIN_REFRESH_TOKEN_SECRET_KEY).then((response) => {
            console.log("refresh created")
            const newToken = generateToken(response.email, process.env.ADMIN_TOKEN_SECRET_KEY, "15m")
            resolve({ status: true, newToken })
        }).catch((err) => {
            reject({ status: false, msg: err.message })
        })
    })


}

module.exports.forgotPassword = async (req, res, next) => {
    const adminFetch = await db.collection("admin").find({}).toArray()
    adminCredentials = adminFetch[0]

    const email = req.body
    console.log(email.forgotEmail)
    if (adminCredentials) {
        const secret = jwt_secret + adminCredentials.email
        const payload = {
            email: adminCredentials.email
        }
        const token = jwt.sign(payload, secret, { expiresIn: "150m" })
        const link = `http://localhost:3000/admin/reset/password/${adminCredentials._id}/${token}`
        let result = emailsender(adminCredentials.email, link)
        res.json({ status: true, msg: "password reset link sent successfully" })

    } else {
        res.json({ status: false, msg: "enter registered email" })
        return false;
    }



}

module.exports.resetPassword = async (req, res, next) => {
    const { id, token, password } = req.body
    const adminFetch = await db.collection("admin").findOne({ _id: new mongoose.Types.ObjectId(id) })
    console.log(adminFetch)
    try {
        if (adminFetch) {
            const secret = jwt_secret + adminFetch.email
            jwt.verify(token, secret, async (err, payload) => {
                console.log(token.split("."))
                if (err) {
                    console.log(err.message)
                    res.json({ status: false, msg: err.message })
                } else {
                    console.log(payload)
                    const hashedPassword = await bcrypt.hash(password, 10)
                    await db.collection('admin').updateOne({ email: payload.email }, {
                        $set: {
                            password: hashedPassword
                        }
                    })
                    res.json({ status: true, msg: "password reset successfull" })
                }
            })
        } else {
            res.json({ status: false, msg: "enter registered email" })
        }

    } catch (error) {
        console.log(error.message)
    }
}


module.exports.refreshToken = (req, res, next) => {
    console.log(req)
}


module.exports.users = async (req, res, next) => {
    try {
        const users = await User.find({}).select({
            'email': 1, 'username': 1, '_id': 1, 'status': 1
        })
        res.status(200).json(users)
    } catch (err) {
        next(err)
    }
}

module.exports.blockusers = async (req, res, next) => {
    try {
        const email = req.body.email
        const user = await User.findOne({ email });
        console.log(user)
        console.log(user.status)
        const currentStatus = !user.status;
        console.log(currentStatus);
        await User.findOneAndUpdate({ email }, { status: currentStatus }).then((response) => {
            res.status(201).json({ status: true })
        })

    } catch (err) {
        next(err)
    }
}

module.exports.approveHotel = async (req, res, next) => {
    try {
        const details = await hotelModel.find({ status: false, isRegistered: false ,isBlocked:false});
        console.log("details",details)
        res.status(200).json(details)
    } catch (err) {
        next(err)
    }
}

module.exports.acceptHotel = async (req, res, next) => {
    const id = req.params.id
    await hotelModel.findByIdAndUpdate({ _id:id }, { status: true, isRegistered: true })
        .then((response) => {
            res.status(201).json({ status: true })
        }).catch((err) => {
            console.log(err.message)
            res.status(401).json({ msg: err.message })
        })
    
}

module.exports.deleteHotel = async (req, res, next) => {
    await hotelModel.findByIdAndDelete({ _id:id })
        .then((response) => {
            res.status(201).json({ status: true })
        }).catch((err) => {
            res.status(401).json({ msg: err.message })
        })
    }

module.exports.getHotelDetails = async(req,res,next)=>{
    console.log("call coming details")
    try{
        const details = await hotelModel.find({status:true,isRegistered:true}).select({
            "password":0
        })
        res.status(200).json(details)
    }catch(err){
        console.log(err)
    }
}

module.exports.cmpltDetails = async (req,res,next)=>{
    console.log(req.query.id)
    const hotelData = await hotelModel.findOne({ _id: new mongoose.Types.ObjectId(req.query.id) })
     function hotelImages(hotelData) {
      return new Promise((resolve, reject) => {
        const promises = []
        const hotelPromises = hotelData?.hotelImage.map((img, idx) => {
          return getFromS3(img).then((resultUrl) => {
            hotelData.hotelImage[idx] = resultUrl
          })
        })
  
        promises.push(Promise.all(hotelPromises))
  
        Promise.all(promises)
          .then(() => {
            resolve(hotelData)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }
    await hotelImages(hotelData)
    res.status(200).json({ hotelData })
}

module.exports.blockHotel = async(req,res,next)=>{
    console.log("call is coming inside block")
    try{
        const id = req.params.id
        const hotel = await hotelModel.findById({_id:id})
        const block = !hotel?.isBlocked
        await hotelModel.findByIdAndUpdate({_id:id},{isBlocked:block})
        .then((response)=>{
            res.status(201).json({block})
        })
    }catch(err){
        console.log(err)
        next(err)
    }
}

module.exports.getSingleHotel = async(req,res)=>{
    try{
        const id = req.params.id
        const data = await hotelModel.findById({_id:id})
        const cmpltData = await getWholeImagesOfHotel(data)
        res.status(201).json(cmpltData)
    }catch(err){
        res.status(401).json({msg:err.message})
        console.log(err.meassage)
    }
}

module.exports.getAllBooking= async(req,res)=>{
    try{
        console.log('call is coming here')
        const data = await bookingModal.find({status:{$ne:'pending'}})
        const bookings = await Promise.all(data.map(async (booking)=>{
            const checkInDate = await getFormattedDate(booking.checkInDate)
            const checKOutDate = await getFormattedDate(booking.checkOutDate)
            const hotelData = await hotelModel.findById(booking.hotel)
            const completeHotel = await getWholeImagesOfHotel(hotelData)
            const roomdata = completeHotel.rooms.find((room)=>{
                return JSON.stringify(room._id) === JSON.stringify(booking.room)
            })

            return {
                ...booking.toJSON(),
                checkInDate,
                checKOutDate,
                hoteldetails:completeHotel,
                roomDetails:roomdata
            }
        }))
        res.status(200).json(bookings)
    }catch(err){
        console.log(err.message)
    }
}

module.exports.getAllusers = async(req,res,next)=>{
    try{
        const data= await User.find({}).select({
            username:1,email:1,phone:1,status:1,wallet:1,createdAt:1
        })
        res.status(200).json(data)

    }catch(err){
        console.log(err.message)
    }

}

module.exports.getBookingsForDashBoard = async (req, res, next) => {
    try {
        const data = await bookingModel.find({ status: { $nin: ["pending", "cancelled"] } })
        const count = data.length
        let totalSum = 0;
        for (const booking of data) {
            totalSum += booking.total;
        }
        const hotelCount = await hotel.find({
            status: true,
            isRegistered: true,
            isBlocked: false
          }).countDocuments()
        res.status(200).json({data,count,total:totalSum,hotelCount})
    } catch (err) {
        console.log(err.message)
    }
}
