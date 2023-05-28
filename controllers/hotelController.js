const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
require('dotenv').config
const hotel = require('../model/hotelModel');
const moment = require('moment');
const { uploadTos3, getFromS3, deleteFromS3 } = require('../helper/s3Bucket')
const { emailsender } = require("../helper/nodemailer")
const { sendOtp, verifyOtp } = require("../helper/twilio")
const { getFullDetails, getRoomDetails } = require('../helper/loginChecker')
const { generateToken, verify_JWT_Token } = require("../helper/jwt");
const { getFormattedDate } = require('../helper/dateFormat');
const { getWholeImagesOfHotel } = require('../helper/loginChecker')
const bookingModel = require('../model/bookingModel')
const { response } = require('express');
const maxAge = 3 * 24 * 60 * 60


module.exports.register = async (req, res, next) => {
  const { name, email, phone, password, street, landmark, city, pincode } = req.body
  const hotelCheck = await hotel.findOne({ email })
  const phoneCheck = await hotel.findOne({ phone })
  const nameCheck = await hotel.findOne({ email })
  if (hotelCheck) {
    return res.json({ status: false, msd: "hotel already exits" })
  }
  if (nameCheck) {
    return res.json({ status: false, msd: "hotel already exits" })
  }
  if (phoneCheck) {
    return res.json({ status: false, msd: "hotel already exits" })
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const hotelData = await hotel.create({
    name,
    email,
    phone,
    street,
    landmark,
    city,
    pincode,
    password: hashedPassword,
    status: false,
    isRegistered: false,
  })
  return res.json({ status: true, msg: "registration successfull" })
}

module.exports.login = async (req, res, next) => {
  console.log(req.body)
  const { email, password } = req.body
  try {
    const hotelCheck = await hotel.findOne({ email })
    if (hotelCheck) {
      if (!hotelCheck.isBlocked) {
        const isValidPassword = await bcrypt.compare(password, hotelCheck.password)
        if (isValidPassword) {
          const token = generateToken(hotelCheck._id, process.env.HOTEL_LOGIN_SECRET, "1d")
          console.log(token)
          res.cookie("jwt", token, { httpOnly: false, maxage: maxAge * 1000, withCredentials: true })
          console.log(token, "token")
          if (hotelCheck.isRegistered === true) {
            const hotelDetails = await getFullDetails(hotelCheck)
            res.status(201).json({ status: true, msg: "log in successfull", hotelCheck: hotelDetails?.hotelData })
          } else {
            res.status(201).json({ status: true, msg: "log in successfull", hotelCheck })
          }
        } else {
          console.log("else 1")
          res.json({ status: false, msg: "incorrect password", passwordError: true })
        }
      } else {
        res.json({ status: false, msg: "account has been blocked", emailError: true })
      }
    } else {
      res.status.json({ status: false, msg: "email not found", emailError: true })
    }
  } catch (err) {
    res.status(500).json(err.message)
  }

}


module, exports.forgotPassword = async (req, res, next) => {
  const { forgotEmail } = req.body
  const hotelExits = await hotel.findOne({ email: forgotEmail })
  if (hotelExits) {
    const secret = process.env.HOTEL_RESET_SECRET + hotelExits.password;
    const payload = {
      email: hotelExits.email,
      _id: hotelExits._id
    }
    const token = generateToken(payload, secret, "5m")
    const link = `http://localhost:3000/hotel/reset/password/${hotelExits._id}/${token}`
    let result = emailsender(hotelExits.email, link)
    res.json({ status: true, msg: "password reset link sent successfully" })
  } else {
    res.json({ status: false, msg: "enter registered email" })
  }
}


module.exports.resetPassword = async (req, res, next) => {
  const { id, token, password } = req.body
  try {
    const hotelCheck = await hotel.findById(id)
    if (hotelCheck) {
      const secret = process.env.HOTEL_RESET_SECRET + hotelCheck.password;
      verify_JWT_Token(token, secret).then(async (response) => {
        const hashedPassword = await bcrypt.hash(password, 10)
        await hotel.updateOne({ email: response.email }, { password: hashedPassword })
        res.json({ status: true, msg: "password reset successfull" })
      }).catch((err) => {
        res.json({ status: false, msg: "something went wrong" })
        console.log(err.message)
      })
    }
  } catch (err) {
    next(err)
  }
}

module.exports.signInWithOtp = async (req, res, next) => {
  const { mobileForOtp } = req.body
  try {
    const mobileCheck = await hotel.findOne({ phone: mobileForOtp })
    if (mobileCheck) {
      sendOtp(mobileCheck.phone)
      return res.json({ status: true, msg: "otp send successfully", mobile: mobileCheck.phone })
    } else {
      res.json({ status: false, msg: "enter registered mobile number" })
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

module.exports.verifyOtp = async (req, res, next) => {
  const { mobile, otp } = req.body
  try {
    const hotelFind = await hotel.findOne({ phone: mobile })
    verifyOtp(otp, mobile).then((response) => {
      if (response.status) {
        res.json({ status: true, msg: response.msg, user: hotelFind })
      }
    }).catch((err) => {
      res.json({ status: false, msg: "Invalid otp" })
    })
  } catch (err) {
    next(err)

  }

}


module.exports.InfoSubmit = async (req, res, next) => {
  console.log("call incoming")
  const { name, email, description, phone, street, landmark, city, pincode } = req.body
  const images = req.files
  return new Promise(async (resolve, reject) => {
    if (images.length == 0) {
      try {
        const updatedHotel = await hotel.findOneAndUpdate({ email },
          {
            $set: {
              email,
              name,
              description,
              phone,
              street,
              landmark,
              city,
              pincode
            }
          })
        res.status(200).json({ status: true, msg: "submitted successfully", hotelDetails: updatedHotel })
      } catch (err) {
        res.status(401).json({ status: false, error: err.message })
      }
    } else {
      images.forEach(async file => {
        uploadTos3(file).then(async (response) => {
          await hotel.updateOne({ email: req.body.email }, { $push: { hotelImage: response } }).then(async (result) => {
            const updatedHotel = await hotel.findOneAndUpdate({ email },
              {
                $set: {
                  email,
                  name,
                  description,
                  phone,
                  street,
                  landmark,
                  city,
                  pincode
                }
              })
            res.status(200).json({ status: true, msg: "submitted successfully", updatedHotel })
          }).catch((err) => {
            console.log(err.message)
            // res.json({ status: false, error: err.message })
          })
        })
      })
    }

  })
}

module.exports.getImages = async (req, res, next) => {
  const hotelData = await hotel.findOne({ email: req.params.email })
  function processTripImages(hotelData) {
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

  await processTripImages(hotelData)
  res.status(200).json({ hotelData })
}


module.exports.roomInfoSubmit = async (req, res, next) => {
  const { roomType, roomDesc, numberOfRooms, price, amenities, email } = req.body;
  const priceInt = parseInt(price)
  const numOfRoomInt = parseInt(numberOfRooms)
  const newId = new mongoose.Types.ObjectId();
  const roomDetails = {
    _id: newId,
    roomType,
    roomDesc,
    numberOfRooms: numOfRoomInt,
    price: priceInt,
    amenities,
    images: [],
  };
  try {
    const responses = await Promise.all(req.files.map((file) => uploadTos3(file)));
    roomDetails.images = responses;
    const result = await hotel.findOneAndUpdate(
      { email: email },
      {
        $push: { rooms: roomDetails }
      }
    );
    res.status(201).json({ status: true, msg: "room added successfully" })
    return roomDetails;
  } catch (err) {
    throw err;
  }
};


module.exports.getRoomDetails = async (req, res, next) => {
  const roomData = await hotel.findOne({ email: req.query.email })
  function roomImages(roomData) {
    return new Promise((resolve, reject) => {
      const roomPromises = roomData?.rooms.map((room) =>
        Promise.all(
          room.images.map((image, idx) =>
            getFromS3(image).then((resultUrl) => {
              room.images[idx] = resultUrl;
            })
          )
        )
      );

      Promise.all(roomPromises)
        .then(() => {
          resolve(roomData);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  roomImages(roomData)
    .then((updatedRoomData) => {
      res.status(201).json({ status: true, roomDetails: updatedRoomData })
    })
    .catch((err) => {
      res.status(401).json({ status: false, msg: err.msg })
    });

}

module.exports.deleteRoom = async (req, res, next) => {
  const { roomType, email } = req.body;
  try {
    const roomDetails = await hotel.findOne({ email: email, "rooms.roomType": roomType })
    roomDetails?.rooms.map(room => {
      if (room.roomType === roomType) {
        room?.images.map(imageName => deleteFromS3(imageName))
      }
    })
    await hotel.findOneAndUpdate({ email }, {
      $pull: {
        rooms: { roomType: roomType }
      }
    }).then((response) => {

    })
  } catch (err) {
    console.log(err)
  }
}

module.exports.editRoom = async (req, res, next) => {
  try {
    const { email, id } = req.body
    await hotel.aggregate([
      {
        $match: {
          email: email,
          "rooms._id": new mongoose.Types.ObjectId(id)
        }
      },
      {
        $project: {
          rooms: 1
        }
      },
      {
        $unwind: "$rooms"
      },
      {
        $match: {
          "rooms._id": new mongoose.Types.ObjectId(id)
        }
      }

    ])
      .then(async (response) => {
        if (response) {
          const details = response ? response[0].rooms : null;
          const roomDetails = await getRoomDetails(details)
          res.status(201).json({ status: true, roomDetails })
        } else {
          res.status(401).json({ status: false, msg: err.message })
        }
      })
  } catch (err) {
    console.log(err)
  }
}


module.exports.submitEditRoom = async (req, res, next) => {
  let uploaded = req.files
  const { email, roomType, roomDesc, numberOfRooms, price, amenities, images } = req.body;
  const priceInt = parseInt(price)
  const numOfRoomInt = parseInt(numberOfRooms)
  await hotel.updateOne({ email: email, 'rooms.roomType': roomType },
    {
      $set: {
        "rooms.$.email": email,
        "rooms.$.roomType": roomType,
        "rooms.$.roomDesc": roomDesc,
        "rooms.$.numberOfRooms": numOfRoomInt,
        "rooms.$.price": priceInt,
        "rooms.$.amenities": amenities
      }
    }).then(async (response) => {
      if (uploaded.length == 0) {
        res.status(201).json({ status: true, msg: "edit successfull" })
      } else {
        uploaded.map(async (img, index) => {
          await uploadTos3(img).then(async (response) => {
            await hotel.findOneAndUpdate({ email, "rooms.roomType": roomType },
              {
                $push: {
                  "rooms.$.images": response
                }
              })
          })
        })
        res.status(201).json({ status: true, msg: "edit successfull" })
      }

    }).catch((err) => {
      console.log(err.message)
      res.status(401).json({ status: false, msg: "something went wrong" })
    })
}


module.exports.deletePhoto = async (req, res, next) => {
  console.log(req.query.index, req.query.id)
  try {
    const data = await hotel.findById({ _id: req.query.id })
    const imgUrl = data?.hotelImage[req.query.index]
    deleteFromS3(imgUrl).then(async (response) => {
      console.log(response)
      await hotel.findByIdAndUpdate({ _id: req.query.id },
        {
          $pull: { hotelImage: imgUrl }
        }).then((response) => {
          res.status(201).json({ status: true })
        }).catch((err) => {
          console.log(err)
        })

    })
  } catch (err) {
    console.log(err)
  }
}

module.exports.deleteRoomImages = async (req, res, next) => {
  const index = req.query.index
  const roomId = req.query.roomId
  const hotelId = req.query.hotelId
  console.log(index, roomId, hotelId)

  const details = await hotel.findById({ _id: hotelId })
  const room = details.rooms.find((room) => room._id == roomId);
  console.log(room)
  const imageName = room.images[index];
  deleteFromS3(imageName)
  await hotel.updateOne(
    {
      _id: new mongoose.Types.ObjectId(hotelId),
      'rooms': {
        $elemMatch: {
          '_id': new mongoose.Types.ObjectId(roomId),
          'images': imageName
        }
      }
    },
    {
      $pull: {
        'rooms.$[].images': imageName
      }
    }).then((response) => {
      console.log(response)
      res.status(201).json({ status: true })
    })
}

module.exports.getBookings = async (req, res, next) => {
  try {
    const hotelId = req.params.id
    const data = await bookingModel.find({ hotel: new mongoose.Types.ObjectId(hotelId), status: { $ne: 'pending' } })
    const bookings = await Promise.all(data.map(async (booking) => {
      const checkInDate = await getFormattedDate(booking.checkInDate)
      const checkOutDate = await getFormattedDate(booking.checkOutDate)
      const hotelData = await hotel.findById(booking.hotel)
      const completeHotel = await getWholeImagesOfHotel(hotelData)
      const roomdata = completeHotel.rooms.find((room) => {
        return JSON.stringify(room._id) === JSON.stringify(booking.room)
      })

      return {
        ...booking.toJSON(),
        checkInDate,
        checkOutDate,
        hoteldetails: completeHotel,
        roomDetails: roomdata
      }
    }))
    console.log(bookings)
    res.status(200).json(bookings)
  } catch (err) {
    console.log(err.message)
  }
}

module.exports.getAllBookings = async (req, res, next) => {
  try {
    const hotelId = req.params.id
    const data = await bookingModel.find({ hotel: new mongoose.Types.ObjectId(hotelId), status: { $nin: ['pending', 'cancelled'] } })
    const bookingCount = data?.length
    let totalSum = 0;
    for (const booking of data) {
      totalSum += booking.total
    }
    const todaysBookings = await bookingModel.find({
      hotel: new mongoose.Types.ObjectId(hotelId),
      status: { $nin: ['pending', 'cancelled'] },
      bookedDate: Date.now()
    }).countDocuments()

    const startDate = moment().startOf('month').toDate();
    const endDate = moment().endOf('month').toDate();

    const monthlyBookings = await bookingModel.find({
      hotel: new mongoose.Types.ObjectId(hotelId),
      status: { $nin: ['pending', 'cancelled'] },
      bookedDate: { $gte: startDate, $lte: endDate }
    }).countDocuments();
    res.status(200).json({ monthlyBookings,todaysBookings, bookingCount, totalSum, data })
  } catch (err) {
    console.log(err.message)
  }
}

module.exports.dayWiseSales = async(req,res,next)=>{
  const hotelId = req.params.id
  try{
    const data = await bookingModel.aggregate([
      {
        $match: {
          hotel: new mongoose.Types.ObjectId(hotelId),
          status: { $nin: ['pending', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: "$bookedDate",
          totalAmount: { $sum: "$total" }
        }
      }
    ]);

    res.status(200).json(data)

  }catch(err){
    console.log(err.message)
  }
}

