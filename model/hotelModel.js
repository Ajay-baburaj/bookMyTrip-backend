const mongoose = require('mongoose')





const roomSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: mongoose.Types.ObjectId
    },
    roomType: String,
    roomDesc: String,
    price: Number,
    numberOfRooms: Number,
    amenities: String,
    image: Array,
    capacity: Number
});


const Room = mongoose.model('Room', roomSchema);

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 3,
        max: 20,
        unique: true
    },
    email: {
        type: String,
        required: true,
        max: 20,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        max: 10,
        unique: true,
    },
    landmark: {
        type: String,
        required:true
    },  
    city: {
        type: String,
        required:true
    }, 
    pincode: {
        type: String,
        required:true
    }, 
    street: {
        type: String,
        required:true
    }, 
    state: {
        type: String,
        required:true
    }, 
    distance: {
        type: String,
    },                                                                                             
    password: {
        type: String,
        required: true,
        min: 6,
    },
    status: {
        type: Boolean,
    },
    isRegistered: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        min: 10,
    },
    hotelImage: {
        type: Array,
    },
    rooms:{
        type:Array,
    },
    reviews:{
        type:Object
    },
    rating:{
       type:Number 
    }

})



module.exports = mongoose.model("hotel", hotelSchema)
