const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const hotelRoutes = require('./routes/hotelRoutes')
const cookieParser = require("cookie-parser");
require('dotenv').config();
const app = express()

app.use(cors({
    origin: ['http://localhost:3000','http://localhost:3001','http://localhost:3002'],
    credentials: true
}));



app.use(express.json())
app.use(cookieParser())

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("database connect succesfully")
}).catch((err) => {
    console.log(err.message)
})



app.use('/api', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/hotel', hotelRoutes)




const server = app.listen(process.env.PORT, () => {
    console.log(`server started at port${process.env.PORT}`)
})




