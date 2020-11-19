"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var bcrypt_1 = __importDefault(require("bcrypt"));
var http_1 = __importDefault(require("http"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var user_1 = require("./user");
var userreturn_1 = require("./userreturn");
var post_1 = require("./post");
var comment_1 = require("./comment");
var category_1 = require("./category");
var postcategory_1 = require("./postcategory");
var categorypost_1 = require("./categorypost");
var app = express_1.default();
var key = "abczyxzyxabc";
var server = http_1.default.createServer(app);
var userArr = [];
var postArr = [];
var catArr = [];
var catPostArr = [];
var postCatArr = [];
var commentArr = [];
var catCounter = 0;
var postCounter = 0;
var commentcounter = 0;
var validator = require("email-validator");
server.listen(3000);
app.use(express_1.default.urlencoded({ extended: false }));
app.get("/css/main.css", function (req, res, next) {
    res.sendFile(__dirname + "/css/main.css");
});
app.get("/", function (req, res, next) {
    res.sendFile(__dirname + "/index.html");
});
// Add authentication check to be able to access this
app.get("/Users", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        var returnUserArr = [];
        for (var i = 0; i < userArr.length; i++) {
            var tempuser = userArr[i];
            returnUserArr[i] = new userreturn_1.UserReturn(tempuser.userId, tempuser.firstName, tempuser.lastName, tempuser.emailAddress);
        }
        res.status(200).json(returnUserArr);
    }
});
app.post("/Users", function (req, res, next) {
    var user = new user_1.User();
    var checkUser = getUserId(req.body.userId, true);
    if (!checkUser) {
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.userId = req.body.userId;
        if (emptyString(user.userId)) {
            res
                .status(406)
                .json({ message: "Cannot have blank user id!", status: 406 });
        }
        else {
            user.emailAddress = req.body.emailAddress;
            user.password = req.body.password;
            user.generateHash();
            if (emailValidator(user.emailAddress)) {
                userArr.unshift(user);
                generateToken(user);
                var returneduser = new userreturn_1.UserReturn(user.userId, user.firstName, user.lastName, user.emailAddress);
                res.status(201).json(returneduser);
            }
            else {
                res.status(406).json({ message: "Invalid Email Address", status: 406 });
            }
        }
    }
    else {
        res.status(409).json({ message: "Duplicate User Id!", status: 409 });
    }
});
// Add check for auth token
app.get("/Users/:userId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        var user = getUserId(req.params.userId, true);
        if (!user) {
            res.status(404).json({
                message: "User " + req.params.userId + " not found",
                status: 404,
            });
        }
        else {
            var returneduser = new userreturn_1.UserReturn(user.userId, user.firstName, user.lastName, user.emailAddress);
            res.status(200).json(returneduser);
        }
    }
});
// Add auth token checker 401 response
app.patch("/Users/:userId", function (req, res, next) {
    var user = getUserId(req.params.userId, false);
    if (!user) {
        res.status(404).json({
            message: "User " + req.params.userId + " not found",
            status: 404,
        });
    }
    else {
        user.emailAddress = req.body.emailAddress;
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.password = req.body.password;
        if (emailValidator(user.emailAddress)) {
            userArr.unshift(user);
            var returneduser = new userreturn_1.UserReturn(user.userId, user.firstName, user.lastName, user.emailAddress);
            res.status(200).json(returneduser);
        }
        else {
            res.status(406).json({ message: "Invalid Email Address", status: 406 });
        }
    }
});
// add auth check 401 response, check why the "User Deleted isnt showing up, but its just showing a 1"
app.delete("/Users/:userId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        var user = getUserId(req.params.userId, false);
        if (!user) {
            res.status(404).json({
                message: "User " + req.params.userId + " not found!",
                status: 404,
            });
        }
        else {
            res.status(204).json({ message: "User Deleted" });
        }
    }
});
app.get("/Users/:userId/:password", function (req, res, next) {
    var user = getUserId(req.params.userId, true);
    if (!user) {
        res.status(404).json({
            message: "User " + req.params.userId + " not found!",
            status: 404,
        });
    }
    else {
        if (verifyHash(req.params.password, user.hashedPassword)) {
            res.status(200).json({ token: generateToken(user) });
        }
        else {
            res.status(401).json({ message: "Bad password", status: 401 });
        }
    }
});
app.get("/Posts", function (req, res, next) {
    res.status(200).json(postArr);
});
app.post("/Posts", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (emptyString(req.body.title, req.body.content, req.body.headerImage)) {
            res.status(406).json({
                message: "Not Acceptable: Bad data in the entity IE: Missing Title or Content",
                status: 406,
            });
        }
        else {
            var post = new post_1.Post(postCounter++, dateSetter(), req.body.title, req.body.content, isAuth["user"]["userId"], req.body.headerImage, dateSetter());
            // post.createdDate = dateSetter();
            // post.lastUpdated = dateSetter();
            // post.title = req.body.title;
            // console.log(isAuth);
            // post.userId = isAuth["user"]["userId"];
            // post.content = req.body.content;
            // post.headerImage = req.body.headerImage;
            // post.postId = postCounter++;
            postArr.unshift(post);
            catPostArr.unshift(new categorypost_1.CategoryPost(post.postId));
            res.status(200).json(post);
        }
    }
});
app.get("/Posts/:postId", function (req, res, next) {
    if (verifyId(req.params.postId)) {
        var post = getPostId(parseInt(req.params.postId), true);
        if (!post) {
            res.status(404).json({
                message: "Post " + req.params.postId + " not found",
                status: 404,
            });
        }
        else {
            res.status(200).json(post);
        }
    }
    else {
        res.status(404).json({
            message: "Post " + req.params.postId + " not found",
            status: 404,
        });
    }
});
app.patch("/Posts/:postId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.postId)) {
            var post = getPostId(parseInt(req.params.postId), false);
            if (!post) {
                res.status(404).json({
                    message: "Post " + req.params.postId + " not found",
                    status: 404,
                });
            }
            else {
                post.headerImage = req.body.headerImage;
                post.content = req.body.content;
                post.title = req.body.title;
                post.lastUpdated = dateSetter();
                if (emptyString(post.title, post.content, post.headerImage)) {
                    res.status(406).json({
                        message: "Not Acceptable: Bad data in the entity IE: Missing Title or Content",
                        status: 406,
                    });
                }
                else {
                    postArr.unshift(post);
                    res.status(200).json(post);
                }
            }
        }
        else {
            res.status(404).json({
                message: "Post " + req.params.postId + " not found",
                status: 404,
            });
        }
    }
});
// Update to delete post categories when we get that farll
app.delete("/Posts/:postId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.postId)) {
            var post = getPostId(parseInt(req.params.postId), false);
            if (!post) {
                res.status(404).json({
                    message: "Post " + req.params.postId + " not found!",
                    status: 404,
                });
            }
            else {
                getCatPost(parseInt(req.params.postId), false);
                res.status(204).json({ message: "Post Deleted" });
            }
        }
        else {
            res.status(404).json({
                message: "Post " + req.params.postId + " not found!",
                status: 404,
            });
        }
    }
});
app.get("/Posts/User/:userId", function (req, res, next) {
    var user = getUserId(req.params.userId, true);
    if (user) {
        var userId = user.userId;
        var userPostArr = [];
        for (var i = 0; i < postArr.length; i++) {
            if (postArr[i].userId === userId) {
                userPostArr.unshift(postArr[i]);
            }
        }
        if (userPostArr) {
            res.status(200).json(userPostArr);
        }
        else {
            res
                .status(404)
                .json({ message: "No posts found for user " + userId, status: 404 });
        }
    }
    else {
        res.status(404).json({
            message: "User " + req.params.userId + " not found!",
            status: 404,
        });
    }
});
app.get("/Categories", function (req, res, next) {
    res.status(200).json(catArr);
});
// Add auth
app.post("/Categories", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        var cat = new category_1.Category();
        var checkCat = checkCatNameDupe(req.body.categoryName);
        if (!checkCat) {
            cat.categoryDescription = req.body.categoryDescription;
            cat.categoryName = req.body.categoryName;
            cat.categoryId = catCounter++;
            catArr.unshift(cat);
            postCatArr.unshift(new postcategory_1.PostCategory(cat.categoryId));
            res.status(200).json(cat);
        }
        else {
            res
                .status(409)
                .json({ message: "Duplicate Category Name!", status: 409 });
        }
    }
});
app.get("/Categories/:categoryId", function (req, res, next) {
    if (verifyId(req.params.categoryId)) {
        var cat = getCatId(parseInt(req.params.categoryId), true);
        if (!cat) {
            res.status(404).json({
                message: "Category " + req.params.categoryId + " not found",
                status: 404,
            });
        }
        else {
            res.status(200).json(cat);
        }
    }
    else {
        res.status(404).json({
            message: "Category " + req.params.categoryId + " not found",
            status: 404,
        });
    }
});
app.patch("/Categories/:categoryId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.categoryId)) {
            var cat = getCatId(parseInt(req.params.categoryId), false);
            if (!cat) {
                res.status(404).json({
                    message: "Category " + req.params.categoryId + " not found",
                    status: 404,
                });
            }
            else {
                cat.categoryDescription = req.body.categoryDescription;
                cat.categoryName = req.body.categoryName;
                catArr.unshift(cat);
                res.status(200).json(cat);
            }
        }
        else {
            res.status(404).json({
                message: "Category " + req.params.categoryId + " not found",
                status: 404,
            });
        }
    }
});
app.delete("/Categories/:categoryId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.categoryId)) {
            var cat = getCatId(parseInt(req.params.categoryId), false);
            if (!cat) {
                res.status(404).json({
                    message: "Category " + req.params.categoryId + " not found!",
                    status: 404,
                });
            }
            else {
                getPostCat(parseInt(req.params.categoryId), false);
                res.status(204).json({ message: "Category Deleted" });
            }
        }
        else {
            res.status(404).json({
                message: "Category " + req.params.categoryId + " not found",
                status: 404,
            });
        }
    }
});
app.get("/PostCategory/:postId", function (req, res, next) {
    if (verifyId(req.params.postId)) {
        var post = getPostId(parseInt(req.params.postId), true);
        if (!post) {
            res.status(404).json({
                message: "Post " + req.params.postId + " not found!",
                status: 404,
            });
        }
        else {
            var catpost = getCatPost(post.postId, true);
            if (catpost) {
                res.status(200).json(getCatPost(post.postId, true));
            }
            else {
                res
                    .status(404)
                    .json({ message: "Category Post not found!", status: 404 });
            }
        }
    }
    else {
        res.status(404).json({
            message: "Post " + req.params.postId + " not found!",
            status: 404,
        });
    }
});
app.get("/PostCategory/Posts/:categoryId", function (req, res, next) {
    if (verifyId(req.params.categoryId)) {
        var cat = getCatId(parseInt(req.params.categoryId), true);
        if (!cat) {
            res.status(404).json({
                message: "Category " + req.params.categoryId + " not found!",
                status: 404,
            });
        }
        else {
            var postcat = getPostCat(cat.categoryId, true);
            if (postcat) {
                res.status(200).json(getPostCat(cat.categoryId, true));
            }
            else {
                res
                    .status(404)
                    .json({ message: "PostCategory not found!", status: 404 });
            }
        }
    }
    else {
        res.status(404).json({
            message: "Category " + req.params.categoryId + " not found!",
            status: 404,
        });
    }
});
app.post("/PostCategory/:postId/:categoryId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
            var post = getPostId(parseInt(req.params.postId), true);
            if (!post) {
                res.status(404).json({
                    message: "Post " + req.params.postId + " not found",
                    status: 404,
                });
            }
            else {
                var cat = getCatId(parseInt(req.params.categoryId), true);
                if (!cat) {
                    res.status(404).json({
                        message: "Category " + req.params.categoryId + " not found",
                        status: 404,
                    });
                }
                else {
                    var postcat = getPostCat(cat.categoryId, true);
                    if (postcat) {
                        postcat.addPost(post);
                    }
                    else {
                        var newpostcat = new postcategory_1.PostCategory(cat.categoryId);
                        newpostcat.addPost(post);
                        postCatArr.unshift(newpostcat);
                    }
                    var catpost = getCatPost(post.postId, true);
                    if (catpost) {
                        catpost.addCategory(cat);
                    }
                    else {
                        var newcatpost = new categorypost_1.CategoryPost(post.postId);
                        newcatpost.addCategory(cat);
                        catPostArr.unshift(newcatpost);
                    }
                    res
                        .status(201)
                        .json({ message: "Category Assigned to Post", status: 201 });
                }
            }
        }
        else {
            res
                .status(404)
                .json({ message: "Category or Post not found", status: 404 });
        }
    }
});
app.delete("/PostCategory/:postId/:categoryId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
            var post = getPostId(parseInt(req.params.postId), true);
            if (!post) {
                res.status(404).json({
                    message: "Post " + req.params.postId + " not found",
                    status: 404,
                });
            }
            else {
                var cat = getCatId(parseInt(req.params.categoryId), true);
                if (!cat) {
                    res.status(404).json({
                        message: "Category " + req.params.categoryId + " not found",
                        status: 404,
                    });
                }
                else {
                    removeRelationship(cat.categoryId, post.postId);
                    res
                        .status(204)
                        .json({ message: "Category Removed from Post", status: 201 });
                }
            }
        }
        else {
            res
                .status(404)
                .json({ message: "Category or Post not found", status: 404 });
        }
    }
});
app.get("/Comments/:postId", function (req, res, next) {
    if (verifyId(req.params.postId)) {
        var post = getPostId(parseInt(req.params.postId), true);
        if (!post) {
            res.status(404).json({
                message: "Post " + req.params.postId + " not found",
                status: 404,
            });
        }
        else {
            var tempCommentArr = [];
            for (var i = 0; i < commentArr.length; i++) {
                if (commentArr[i].postId === post.postId) {
                    tempCommentArr.unshift(commentArr[i]);
                }
            }
            res.status(200).json(tempCommentArr);
        }
    }
    else {
        res.status(404).json({
            message: "Post " + req.params.postId + " not found!",
            status: 404,
        });
    }
});
app.post("/Comments/:postId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.postId)) {
            var post = getPostId(parseInt(req.params.postId), true);
            if (!post) {
                res.status(404).json({
                    message: "Post " + req.params.postId + " not found",
                    status: 404,
                });
            }
            else {
                var comment = new comment_1.Comment();
                comment.commentId = commentcounter++;
                comment.userId = isAuth["user"]["userId"];
                comment.postId = post.postId;
                comment.comment = req.body.comment;
                comment.commentDate = dateSetter();
                commentArr.unshift(comment);
                res.status(201).json(comment);
            }
        }
        else {
            res.status(404).json({
                message: "Post " + req.params.postId + " not found!",
                status: 404,
            });
        }
    }
});
app.patch("/Comments/:postId/:commentId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
            var post = getPostId(parseInt(req.params.postId), true);
            if (!post) {
                res.status(404).json({
                    message: "Post " + req.params.postId + " not found",
                    status: 404,
                });
            }
            else {
                var comment = getCommentid(parseInt(req.params.commentId), false);
                if (!comment) {
                    res.status(404).json({
                        message: "Comment " + req.params.commentId + " not found",
                        status: 404,
                    });
                }
                else {
                    comment.comment = req.body.comment;
                    comment.commentDate = dateSetter();
                    commentArr.unshift(comment);
                    res.status(201).json(comment);
                }
            }
        }
        else {
            res
                .status(404)
                .json({ message: "Comment or Post not found", status: 404 });
        }
    }
});
app.delete("/Comments/:postId/:commentId", function (req, res, next) {
    var isAuth = verifyToken(req.headers.authorization);
    if (!isAuth) {
        res.status(401).json({ message: "Unauthorized", status: 401 });
    }
    else {
        if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
            var post = getPostId(parseInt(req.params.postId), true);
            if (!post) {
                res.status(404).json({
                    message: "Post " + req.params.postId + " not found",
                    status: 404,
                });
            }
            else {
                var comment = getCommentid(parseInt(req.params.commentId), false);
                if (!comment) {
                    res.status(404).json({
                        message: "Comment " + req.params.commentId + " not found",
                        status: 404,
                    });
                }
                else {
                    res
                        .status(204)
                        .json({ message: "Comment removed from post", status: 204 });
                }
            }
        }
        else {
            res
                .status(404)
                .json({ message: "Comment or Post not found", status: 404 });
        }
    }
});
app.get("*", function (req, res) { return res.redirect("/"); });
function getUserId(userId, get) {
    var length = userArr.length;
    if (get) {
        for (var i = 0; i < length; i++) {
            if (userArr[i].userId == userId) {
                return userArr[i];
            }
        }
    }
    else if (!get) {
        for (var i = 0; i < length; i++) {
            if (userArr[i].userId == userId) {
                var temp = userArr[i];
                userArr.splice(i, 1);
                return temp;
            }
        }
    }
}
function getPostId(postId, get) {
    var length = postArr.length;
    if (get) {
        for (var i = 0; i < length; i++) {
            if (postArr[i].postId == postId) {
                return postArr[i];
            }
        }
    }
    else if (!get) {
        for (var i = 0; i < length; i++) {
            if (postArr[i].postId == postId) {
                var temp = postArr[i];
                postArr.splice(i, 1);
                return temp;
            }
        }
    }
}
function getCommentid(commentId, get) {
    var length = commentArr.length;
    if (get) {
        for (var i = 0; i < length; i++) {
            if (commentArr[i].commentId == commentId) {
                return commentArr[i];
            }
        }
    }
    else if (!get) {
        for (var i = 0; i < length; i++) {
            if (commentArr[i].commentId == commentId) {
                var temp = commentArr[i];
                commentArr.splice(i, 1);
                return temp;
            }
        }
    }
}
function getCatId(catId, get) {
    var length = catArr.length;
    if (get) {
        for (var i = 0; i < length; i++) {
            if (catArr[i].categoryId == catId) {
                return catArr[i];
            }
        }
    }
    else if (!get) {
        for (var i = 0; i < length; i++) {
            if (catArr[i].categoryId == catId) {
                var temp = catArr[i];
                catArr.splice(i, 1);
                return temp;
            }
        }
    }
}
function checkCatNameDupe(name) {
    var length = catArr.length;
    for (var i = 0; i < length; i++) {
        if (catArr[i].categoryName == name) {
            return catArr[i];
        }
    }
    return undefined;
}
function getPostCat(catId, get) {
    if (get) {
        for (var i = 0; i < postCatArr.length; i++) {
            if (postCatArr[i].categoryId === catId) {
                return postCatArr[i];
            }
        }
    }
    else {
        for (var i = 0; i < postCatArr.length; i++) {
            if (postCatArr[i].categoryId === catId) {
                postCatArr.splice(i, 1);
                i -= 1;
            }
        }
    }
}
function getCatPost(postId, get) {
    if (get) {
        for (var i = 0; i < catPostArr.length; i++) {
            if (catPostArr[i].postId === postId) {
                return catPostArr[i];
            }
        }
    }
    else {
        for (var i = 0; i < catPostArr.length; i++) {
            if (catPostArr[i].postId === postId) {
                catPostArr.splice(i, 1);
                i -= 1;
            }
        }
    }
}
function emailValidator(email) {
    if (validator.validate(email)) {
        return true;
    }
    return false;
}
function emptyString() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    for (var arg = 0; arg < arguments.length; arg++) {
        if (arguments[arg].replace(/\s/g, "") === "") {
            return true;
        }
    }
    return false;
}
function dateSetter() {
    var date = new Date();
    var month = date.getMonth() + 1;
    return date.getFullYear() + "-" + month + "-" + date.getDate();
}
function verifyHash(pass, hashed) {
    if (pass === undefined || hashed === undefined) {
        return false;
    }
    return bcrypt_1.default.compareSync(pass, hashed);
}
function generateToken(user) {
    var token = jsonwebtoken_1.default.sign({ user: user }, key, {
        algorithm: "HS256",
        expiresIn: 900,
    });
    console.log(token);
    return token;
}
function verifyToken(token) {
    if (token) {
        token = token.split(" ")[1];
    }
    var payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, key);
    }
    catch (e) {
        return false;
    }
    return payload;
}
function verifyId(id) {
    var tempid = String(parseInt(id));
    if (tempid === id) {
        return true;
    }
    return false;
}
function removeRelationship(catId, postId) {
    var catpost = getCatPost(postId, true);
    var postcat = getPostCat(catId, true);
    for (var i = 0; i < postCatArr.length; i++) {
        if (postCatArr[i].categoryId === (postcat === null || postcat === void 0 ? void 0 : postcat.categoryId)) {
            for (var j = 0; j < postCatArr[i].posts.length; j++) {
                if (postCatArr[i].posts[j].postId === postId) {
                    postCatArr[i].posts.splice(j, 1);
                    j -= 1;
                }
            }
        }
    }
    for (var i = 0; i < catPostArr.length; i++) {
        if (catPostArr[i].postId === (catpost === null || catpost === void 0 ? void 0 : catpost.postId)) {
            for (var j = 0; j < catPostArr[i].categories.length; j++) {
                if (catPostArr[i].categories[j].categoryId === catId) {
                    catPostArr[i].categories.splice(j, 1);
                    j -= 1;
                }
            }
        }
    }
}
