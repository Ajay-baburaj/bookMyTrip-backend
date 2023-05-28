const bookingModel = require('../model/bookingModel')
const hotelModel = require('../model/hotelModel')

module.exports.retainRoomCountMiddleware = async (req, res, next) => {
    console.log('call is coming');
    try {
      const bookings = await bookingModel.find({ status: 'confirmed' });
  
      for (const booking of bookings) {
        const dateString = booking.checkOutDate.toISOString().substring(0, 10);
        const currentDateStr = new Date().toISOString().substring(0, 10);
  
        if (dateString < currentDateStr) {
          await bookingModel.findByIdAndUpdate(booking._id, {
            status: 'completed',
          });
  
          await hotelModel.findOneAndUpdate(
            {
              _id: new mongoose.Types.ObjectId(booking.hotel),
              'rooms._id': new mongoose.Types.ObjectId(booking.room),
            },
            {
              $inc: { 'rooms.noOfRooms': booking.numberOfRooms },
            }
          );
        }
      }
  
      console.log('Completed retaining room count');
      next();
    } catch (err) {
      console.log(err.message);
      next(err); // Pass the error to the next middleware or error handler
    }
  };
  
