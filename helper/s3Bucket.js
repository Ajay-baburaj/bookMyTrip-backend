const { s3Client, S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const crypto = require("crypto")
const sharp = require('sharp');
require('dotenv').config();
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");




const BUCKET_NAME = process.env.BUCKET_NAME
const BUCKET_LOCATION = process.env.BUCKET_LOCATION
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY
const S3_SECRET_KEY = process.env.S3_SECRET_KEY

const randomImagName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
const s3 = new S3Client({
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY
    },
    region: BUCKET_LOCATION
})

module.exports.uploadTos3 = async (req) => {
    const imageName = randomImagName()
    const buffer = await sharp(req.buffer)
        // .resize({ height: 1920, width: 1080, fit: 'contain' })
        .toBuffer()
    const params = {
        Bucket: BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: req.mimetype
    }
    const command = new PutObjectCommand(params)
    await s3.send(command)
    return imageName
}


module.exports.getFromS3 = async (image) => {
    try {
        const getObjectParams = {
            Bucket: BUCKET_NAME,
            Key: image
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 10000 })
        return url;
    } catch (err) {
        console.log(err.message)
    }

}

module.exports.deleteFromS3 = async(imageName)=>{
    try{
        const params = {
            Bucket:BUCKET_NAME,
            Key:imageName
        }

        const command = new DeleteObjectCommand(params)
        await s3.send(command)
        return {status:true,msg:"successfully deleted"}
    }catch(err){
        return {status:false,msg: err.message}
    }
}

