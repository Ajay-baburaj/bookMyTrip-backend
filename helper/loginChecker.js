const {getFromS3} = require("../helper/s3Bucket")

module.exports.getFullDetails = async (hotelData) => {
    async function hotelImages(hotelData) {
        return new Promise((resolve, reject) => {
            const promises = []
            const hotelPromises = hotelData?.hotelImage.map((img, idx) => {
                return getFromS3(img).then((resultUrl) => {
                    hotelData.hotelImage[idx] = resultUrl
                })
            })

            promises.push(Promise.all(hotelPromises))

            Promise.all(promises)
                .then(() => {
                    resolve(hotelData)
                })
                .catch((err) => {
                    console.log(err)
                    reject(err)
                })
        }).catch((err)=>{
            console.log("is error coming from here")
            console.log(err.message)
        })
    }

    await hotelImages(hotelData)
    return ({ hotelData })
}

module.exports.getRoomDetails = async(roomData)=>{
    async function roomImages(roomData){
        return new Promise((resolve,reject)=>{
            const promises=[]
            const roomPromises = roomData?.images.map((img, idx) => {
                console.log("img", img)
                return getFromS3(img).then((resultUrl) => {
                    roomData.images[idx] = resultUrl
                })
            })

            promises.push(Promise.all(roomPromises))

            Promise.all(promises)
                .then(() => {
                    resolve(roomData)
                })
                .catch((err) => {
                    console.log(err)
                    reject(err)
                })
        }).catch((err)=>{
            console.log("is error coming from here")
            console.log(err.message)
        })
    }
    await roomImages(roomData)
    return ({ roomData })
}

module.exports.getWholeImagesOfHotel = async (data) => {
    function hotelImages(hotelData) {
        return new Promise((resolve, reject) => {
            const promises = [];
            const hotelPromises = hotelData?.hotelImage.map((img, idx) => {
                console.log("img", img);
                return getFromS3(img).then((resultUrl) => {
                    hotelData.hotelImage[idx] = resultUrl;
                });
            });

            promises.push(Promise.all(hotelPromises));

            Promise.all(promises)
                .then(() => {
                    resolve(hotelData);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    }

    const updatedHotelData = await hotelImages(data);

    await Promise.all(
        updatedHotelData?.rooms.map((room, index) =>
            Promise.all(
                room.images.map((img, idx) =>
                    getFromS3(img).then((resultUrl) => {
                        room.images[idx] = resultUrl;
                    })
                )
            )
        )
    );

    return updatedHotelData;
};

