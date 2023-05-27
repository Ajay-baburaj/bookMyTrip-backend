const Razorpay = require('razorpay');
const crypto = require('crypto');



module.exports.generateRazorpay = (orderId, total) => {
  console.log("total",total)
  return new Promise((resolve, reject) => {
    const instance = new Razorpay({
      key_id: 'rzp_test_wBILsF6sI8t8aF',
      key_secret: '8C84FoP90AqSyOjByzG9WHTR',
    });

    const options = {
      amount: total*100,
      currency: "INR",
      receipt: orderId
    }
    console.log(options)
    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error.message)
        reject(error.message)
      }
      resolve(order)
    })
  })
}

module.exports.verifyPayment = (reqBody) => {
  return new Promise(async (resolve, reject) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = reqBody;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", "8C84FoP90AqSyOjByzG9WHTR")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      resolve({ status: true, message: "Payment verified successfully" });
    } else {
      reject({ status: false, message: "Invalid signature sent!" });
    }
  })
}