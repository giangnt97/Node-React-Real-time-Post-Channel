const express = require('express')

const app = express();

const mongoose = require('mongoose')

const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')

const bodyParser = require('body-parser')

const path = require('path')

const multer = require('multer')    

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})
const MONGODB_URI = 'mongodb+srv://giangng:TIAslMBTLYCTBIG%40CNN44@api-test-1-uryhd.gcp.mongodb.net/message?retryWrites=true'


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + "_" + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg' || 
    file.mimetype === 'image/jpeg' || 
    file.mimetype === 'image/png') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(bodyParser.json())
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/auth', authRoutes)
app.use('/feed', feedRoutes)



app.use((err, req, res, next) => {
    console.log(err);
    const status = err.statusCode || 500;
    const message = err.message;
    const data = err.data
    res.status(status).json({
        message: message,
        data : data
    })
})


mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true
    })
    .then(result => {
        console.log("Connected to database")
        const server = app.listen(8080)
        const io = require('./socket').init(server)
        io.on('connection', socket => {
            console.log('Client Connected')
        })
    })
    .catch(err => console.log(err))