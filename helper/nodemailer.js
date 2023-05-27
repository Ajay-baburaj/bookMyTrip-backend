const nodemailer = require("nodemailer");
require('dotenv').config()


module.exports.emailsender = (email,link) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL ,
            pass: process.env.GMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.GMAIL,
        to: email,
        subject: "Reset password",
        html:`<h1>Your Reset Password Link  ${link}<h1/>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return error;
        } else {
            return {status:true}
        }
    });

}


