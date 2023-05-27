const router = require('express').Router()
const {register,forgotPassword,login,InfoSubmit,getImages,resetPassword,signInWithOtp,verifyOtp,
    roomInfoSubmit,getRoomDetails,deleteRoom,editRoom,submitEditRoom, deletePhoto, deleteRoomImages, getBookings, getAllBookings, dayWiseSales} = require('../controllers/hotelController');
// const upload = require('../middlewares/multer')
const multer = require("multer");
const { verifyUser } = require('../middlewares/verifyUser');
const storage = multer.memoryStorage()
const upload = multer({ storage })
const secret = process.env.HOTEL_LOGIN_SECRET

router.post('/register',register)
router.post('/login',login)
router.post('/forgot/password',forgotPassword)
router.post('/reset/password',resetPassword)
router.post('/sign-in/otp',signInWithOtp)
router.post('/get/otp',verifyOtp)
router.post('/info/submit',verifyUser(secret),upload.array("images",10),InfoSubmit)
router.get('/get/data/:email',verifyUser(secret),getImages)
router.post('/submit/room',verifyUser(secret),upload.array("images",10),roomInfoSubmit)
router.get('/get/roomdata',verifyUser(secret),getRoomDetails)
router.post('/delete/room',verifyUser(secret),deleteRoom)
router.post('/edit/room',verifyUser(secret),editRoom)
router.post('/edit/submit',verifyUser(secret),upload.array("images",10),submitEditRoom)
router.put('/delete/photo',verifyUser(secret),deletePhoto)
router.delete('/delete/room/image/',deleteRoomImages)
router.get('/get/booking/:id',getBookings)
router.get('/get/all/bookings/:id',getAllBookings)
router.get('/get/day/wise/:id',dayWiseSales)



module.exports = router