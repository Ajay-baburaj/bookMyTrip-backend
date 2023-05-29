const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const hotelRoutes = require('./routes/hotelRoutes')
const cookieParser = require("cookie-parser");
const morgan = require('morgan')
require('dotenv').config();
const app = express()


const corsOptions = {
    origin: true,
    credentials: true,
    allowedHeaders: 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,Forest-Context-Url',
    methods: 'GET, PUT, PATCH, DELETE, POST'
};

app.use(cors(corsOptions));
app.use(morgan("dev"))



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
    console.log(`server started at port ${process.env.PORT}`)
})




