const router = require('express').Router()
const {login, forgotPassword,resetPassword,testing, refresh, users, blockusers,approveHotel,acceptHotel, deleteHotel, getHotelDetails, cmpltDetails, blockHotel, getSingleHotel, getAllBooking, getAllusers, getBookingsForDashBoard} = require('../controllers/adminController')
const { verifyUser } = require('../middlewares/verifyUser')
const secret = process.env.ADMIN_TOKEN_SECRET_KEY

router.post("/login",login)
router.post("/forgot/password",forgotPassword)
router.post("/reset/password",resetPassword)
// router.post('/test',verify,testing)
router.post("/refresh",refresh)
router.get("/users",verifyUser(secret),users)
router.post("/user/block",verifyUser(secret),blockusers)
router.get("/hotel/approve",verifyUser(secret),approveHotel)
router.put("/hotel/accept/:id",verifyUser(secret),acceptHotel)
router.delete("/hotel/delete/:id",verifyUser(secret),deleteHotel)
router.get("/hotel/data",verifyUser(secret),getHotelDetails)
router.get("/get-full/details",verifyUser(secret),cmpltDetails)
router.put("/block/hotel/:id",verifyUser(secret),blockHotel)
router.get("/get/hotel/:id",verifyUser(secret),getSingleHotel)
router.get('/get/all/booking',getAllBooking)
router.get('/get/all/users',getAllusers)
router.get('/get/all/bookings',getBookingsForDashBoard)





module.exports =router;