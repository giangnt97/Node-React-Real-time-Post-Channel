const fs = require('fs')
const path = require('path')
const isAuth = require('../middleware/isAuth')
const User = require('../models/user')
const Post = require('../models/post')
const {
    validationResult
} = require('express-validator/check')
const io = require('../socket')


/*Error Handling Function*/

const errHandling = function (err) {
    if (!err.statusCode) {
        err.statusCode = 500
    }
}
/**************************/
exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 6;
    try {
        const totalItems = await Post.find().countDocuments()
        const posts = await Post.find().populate('creator')
        .sort({createdAt: -1}).skip((currentPage - 1) * perPage).limit(perPage)
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            totalItems: totalItems
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
exports.createPost = async (req, res, next) => {
    try {

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const error = new Error("Validation failed, entered data is incorrect")
            error.statusCode = 422;
            throw error;
        }
        if (!req.file) {
            const error = new Error('No image');
            error.statusCode = 422;
            throw error;
        }
        const imageUrl = req.file.path
        const title = req.body.title
        const content = req.body.content
        const post = new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            creator: req.userId
        })
        post.save()
        const user = await User.findById(req.userId)
        user.posts.pull(post)
        const creator = user;
        user.save()
        io.getIO().emit('posts', {
            action: "create",
            post: {
                ...post._doc,
                creator: {
                    _id: req.userId,
                    name: user.name
                }
            }
        })
        res.status(201).json({
            message: 'post created successfully',
            post: post,
            creator: {
                _id: creator._id,
                name: creator.name
            }
        })
    } catch (err) {
        errHandling(err)
        next(err)
    }

}


exports.getPost = (req, res, next) => {
    const postId = req.params.postId
    Post.findById(postId).then(post => {
            if (!post) {
                const error = new Error('Cant find post')
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: "post fetched",
                post: post
            })
        })
        .catch(err => {
            errHandling(err)
            next(err)
        })
}


exports.editPost = async (req, res, next) => {
    const postId = req.params.postId
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl
    if (req.file) {
        imageUrl = req.file.path;
    } 
    if (!imageUrl) {
        const oldPost = await Post.findById(postId)
        imageUrl = oldPost.imageUrl
    }
    Post.findById(postId).populate('creator').then(post => {
            if (!post) {
                const error = new Error('Couldnt find post')
                error.statusCode = 404
                throw error
            }
            if (post.creator._id.toString() !== req.userId.toString()) {
                const err = new Error('Not Authorized')
                err.statusCode = 401
                throw err
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl)
            }
            post.title = title;
            post.imageUrl = imageUrl
            post.content = content
            return post.save()
        }).then(result => {
            io.getIO().emit("posts", {action: 'edit', post: result})
            res.status(200).json({
                message: "post updated",
                post: result
            })
        })
        .catch(err => {
            errHandling(err)
            next(err)
        })
}
exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId).then(post => {
            if (!post) {
                const error = new Error("Could not find post")
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId.toString()) {
                const err = new Error('Not Authorized')
                err.statusCode = 401
                throw err
            }
            //Check Login User  TODO
            clearImage(post.imageUrl)
            return Post.findByIdAndRemove(postId)

        })
        .then(result => {
            return User.findById(req.userId)
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save()
        })
        .then(result => {
            io.getIO().emit('posts', {action: 'delete', post: postId})
            console.log(result)
            res.status(200).json({
                message: "Deletion succeeded"
            })
        })
        .catch(err => {
            errHandling(err)
            next(err)
        })
}



const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => console.log(err))
}
