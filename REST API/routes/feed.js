const express = require('express')
const feedController = require('../controllers/feed')
const isAuth = require('../middleware/isAuth')
const {
    body
} = require('express-validator/check')
const router = express.Router()

router.get("/posts",isAuth, feedController.getPosts)

router.post("/post", isAuth,
    [body('title', 'Title must be at least 5 characters long').isLength({
        min: 5
    }), body('content', 'Content must be at least 5 Characters Long').isLength({
        min: 5
    })],
    feedController.createPost)

router.get('/post/:postId', isAuth, feedController.getPost)

router.put('/post/:postId', isAuth,
    [body('title', 'Title must be at least 5 characters long').isLength({
        min: 5
    }), body('content', 'Content must be at least 5 Characters Long').isLength({
        min: 5
    })],
    feedController.editPost)


router.delete('/post/:postId',isAuth, feedController.deletePost)


module.exports = router