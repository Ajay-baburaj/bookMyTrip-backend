require('dotenv').config()
let YOUR_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
let YOUR_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
let YOUR_SERVICE_ID = process.env.TWILIO_SERVICE_ID
const client = require("twilio")(YOUR_ACCOUNT_SID, YOUR_AUTH_TOKEN);


module.exports.sendOtp = (mobile) => {
  return new Promise((resolve, reject) => {
    client.verify
      .services(YOUR_SERVICE_ID) // Change service ID
      .verifications.create({
        to: `+91${mobile}`,
        channel: "sms",
      }).then((response) => {
        resolve({ status: true, msg: "otp send successfully" })
      }).catch((err) => {
        reject(err)
      })
  })
}

module.exports.verifyOtp = (otp, mobile) => {
  console.log(mobile,otp)
  return new Promise(async(resolve, reject) => {
  client.verify
    .services(YOUR_SERVICE_ID) // Change service ID
    .verificationChecks.create({
      to: `+91${(mobile)}`,
      code: otp,
    }).then((data) => {
      console.log(data)
      if (data.valid) {
        console.log("call is  coming ")
        console.log(data)
        resolve({ status: true, msg: "otp verification successfull" })
      }
    }).catch((err) => {
      reject(err)
     
    })
  
 
  })
}
