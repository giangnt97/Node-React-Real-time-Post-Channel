const express = require('express')
const {body} = require('express-validator/check')

const User = require('../models/user')
const router = express.Router()
const isAuth = require('../middleware/isAuth')
const authController = require("../controllers/auth")



router.put('/signup',
    [body('email', 'Your email is invalid').isEmail().custom((value, {req}) => {
        return User.findOne({
            email: value
        }).then(userDoc => {
            if (userDoc) {
                return Promise.reject('Email address already exists')
            }
        })
    }).normalizeEmail(),
    body('password',"Please use a stronger Password")
    .trim()
    .isLength({min: 5}),
    body('name')
    .trim()
    .not()
    .isEmpty()
],
authController.signup)

router.post('/login', authController.login)

router.get('/status', isAuth, authController.getUserStatus)

router.patch('/status', isAuth, [body('status', 'Cannot let your status empty').trim().not().isEmpty()], authController.editUserStatus)

module.exports = router