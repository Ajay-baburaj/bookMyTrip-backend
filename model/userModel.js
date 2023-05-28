const mongoose = require('mongoose')

const userschema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        min:3,
        max:20,
        unique:true
    },
    email:{
        type:String,
        required:true,
        max:20,
        unique:true
    },
    phone:{
        type:String,
        // required:true,
        max:10,
        // unique:true,
    },
    password:{
        type: String,
        required:true,
        min:6,
    },
    status:{
        type:Boolean
    },
    wallet:{
        type:Number,
        default:0,
        min:0
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    notification:{
        type:Array
    }
    
})

module.exports = mongoose.model("users",userschema)