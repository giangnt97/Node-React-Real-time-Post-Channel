const User = require('../models/user')
const {
  validationResult
} = require('express-validator/check')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

/*Error Handling Function*/
const errHandling = (err) => {
  if (!err.statusCode) {
    err.statusCode = 500
  }
}
/**************************/

exports.signup = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed")
    error.statusCode = 422
    error.data = errors.array();
    throw error
  }
  const email = req.body.email
  const name = req.body.name
  const password = req.body.password
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        name: name,
        password: hashedPassword,
        email: email
      })
      return user.save()
    })
    .then(result => {
      res
        .status(201)
        .json({
          message: "Register Suceeded",
          userId: result._id
        })
    })
    .catch(err => {
      errHandling(err)
      next(err)
    })
}

exports.login = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  let loadedUser
  User.findOne({
      email: email
    }).then(user => {
      if (!user) {
        const err = new Error('No user found')
        err.statusCode = 401
        throw err
      }
      loadedUser = user
      return bcrypt.compare(password, user.password)
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Incorrect Password')
        error.statusCode = 401
        throw error
      }
      const token = jwt.sign({
        email: loadedUser.email,
        userId: loadedUser._id.toString()
      }, 'somesupersecretsecret', {
        expiresIn: '1h'
      })
      res
        .status(200)
        .json({
          token: token,
          userId: loadedUser._id.toString()
        })
    })
    .catch(err => {
      errHandling(err)
      next(err)
    })
}

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId).then(user => {
    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404;
      throw error
    }
    res.status(200).json({
      status: user.status
    })

  }).catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  })
}

exports.editUserStatus = (req, res, next) => {
  const newStatus = req.body.status;
  User.findById(req.userId).then(user => {
    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404;
      throw error
    }
    user.status = newStatus
    return user.save()
  }).then(result=> {
    res.status(201).json({
      message: "User's status updated",
    })
  })
}