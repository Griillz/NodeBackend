import express from "express";
import bcrypt from "bcrypt";
import http from "http";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import { User } from "./user";
import { UserReturn } from "./userreturn";
import { Post } from "./post";
import { Comment } from "./comment";
import { Category } from "./category";
import { PostCategory } from "./postcategory";
import { CategoryPost } from "./categorypost";

let app = express();
let key: string = "abczyxzyxabc";
let server = http.createServer(app);
let userArr: User[] = [];
let postArr: Post[] = [];
let catArr: Category[] = [];
let catPostArr: CategoryPost[] = [];
let postCatArr: PostCategory[] = [];
let commentArr: Comment[] = [];
let catCounter = 0;
let postCounter = 0;
let commentcounter = 0;
let validator = require("email-validator");

server.listen(3000);
app.use(express.urlencoded({ extended: false }));

app.get("/css/main.css", (req, res, next) => {
  res.sendFile(__dirname + "/css/main.css");
});

app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
});

// Add authentication check to be able to access this
app.get("/Users", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    let returnUserArr: UserReturn[] = [];
    for (let i = 0; i < userArr.length; i++) {
      let tempuser = userArr[i];
      returnUserArr[i] = new UserReturn(
        tempuser.userId,
        tempuser.firstName,
        tempuser.lastName,
        tempuser.emailAddress
      );
    }
    res.status(200).json(returnUserArr);
  }
});

app.post("/Users", (req, res, next) => {
  let user = new User();
  let checkUser = getUserId(req.body.userId, true);
  if (!checkUser) {
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.userId = req.body.userId;
    if (emptyString(user.userId)) {
      res
        .status(406)
        .json({ message: "Cannot have blank user id!", status: 406 });
    } else {
      user.emailAddress = req.body.emailAddress;
      user.password = req.body.password;
      user.generateHash();

      if (emailValidator(user.emailAddress)) {
        userArr.unshift(user);
        generateToken(user);
        let returneduser = new UserReturn(
          user.userId,
          user.firstName,
          user.lastName,
          user.emailAddress
        );
        res.status(201).json(returneduser);
      } else {
        res.status(406).json({ message: "Invalid Email Address", status: 406 });
      }
    }
  } else {
    res.status(409).json({ message: "Duplicate User Id!", status: 409 });
  }
});

// Add check for auth token
app.get("/Users/:userId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    let user = getUserId(req.params.userId, true);
    if (!user) {
      res.status(404).json({
        message: "User " + req.params.userId + " not found",
        status: 404,
      });
    } else {
      let returneduser = new UserReturn(
        user.userId,
        user.firstName,
        user.lastName,
        user.emailAddress
      );
      res.status(200).json(returneduser);
    }
  }
});

// Add auth token checker 401 response
app.patch("/Users/:userId", (req, res, next) => {
  let user = getUserId(req.params.userId, false);
  if (!user) {
    res.status(404).json({
      message: "User " + req.params.userId + " not found",
      status: 404,
    });
  } else {
    user.emailAddress = req.body.emailAddress;
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.password = req.body.password;
    if (emailValidator(user.emailAddress)) {
      userArr.unshift(user);
      let returneduser = new UserReturn(
        user.userId,
        user.firstName,
        user.lastName,
        user.emailAddress
      );
      res.status(200).json(returneduser);
    } else {
      res.status(406).json({ message: "Invalid Email Address", status: 406 });
    }
  }
});

// add auth check 401 response, check why the "User Deleted isnt showing up, but its just showing a 1"
app.delete("/Users/:userId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    let user = getUserId(req.params.userId, false);
    if (!user) {
      res.status(404).json({
        message: "User " + req.params.userId + " not found!",
        status: 404,
      });
    } else {
      res.status(204).json({ message: "User Deleted" });
    }
  }
});

app.get("/Users/:userId/:password", (req, res, next) => {
  let user = getUserId(req.params.userId, true);
  if (!user) {
    res.status(404).json({
      message: "User " + req.params.userId + " not found!",
      status: 404,
    });
  } else {
    if (verifyHash(req.params.password, user.hashedPassword)) {
      res.status(200).json({ token: generateToken(user) });
    } else {
      res.status(401).json({ message: "Bad password", status: 401 });
    }
  }
});

app.get("/Posts", (req, res, next) => {
  res.status(200).json(postArr);
});

app.post("/Posts", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (emptyString(req.body.title, req.body.content, req.body.headerImage)) {
      res.status(406).json({
        message:
          "Not Acceptable: Bad data in the entity IE: Missing Title or Content",
        status: 406,
      });
    } else {
      let post = new Post(
        postCounter++,
        dateSetter(),
        req.body.title,
        req.body.content,
        isAuth["user"]["userId"],
        req.body.headerImage,
        dateSetter()
      );
      // post.createdDate = dateSetter();
      // post.lastUpdated = dateSetter();
      // post.title = req.body.title;
      // console.log(isAuth);
      // post.userId = isAuth["user"]["userId"];
      // post.content = req.body.content;
      // post.headerImage = req.body.headerImage;
      // post.postId = postCounter++;
      postArr.unshift(post);
      catPostArr.unshift(new CategoryPost(post.postId));
      res.status(200).json(post);
    }
  }
});

app.get("/Posts/:postId", (req, res, next) => {
  if (verifyId(req.params.postId)) {
    let post = getPostId(parseInt(req.params.postId), true);
    if (!post) {
      res.status(404).json({
        message: "Post " + req.params.postId + " not found",
        status: 404,
      });
    } else {
      res.status(200).json(post);
    }
  } else {
    res.status(404).json({
      message: "Post " + req.params.postId + " not found",
      status: 404,
    });
  }
});

app.patch("/Posts/:postId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.postId)) {
      let post = getPostId(parseInt(req.params.postId), false);
      if (!post) {
        res.status(404).json({
          message: "Post " + req.params.postId + " not found",
          status: 404,
        });
      } else {
        post.headerImage = req.body.headerImage;
        post.content = req.body.content;
        post.title = req.body.title;
        post.lastUpdated = dateSetter();
        if (emptyString(post.title, post.content, post.headerImage)) {
          res.status(406).json({
            message:
              "Not Acceptable: Bad data in the entity IE: Missing Title or Content",
            status: 406,
          });
        } else {
          postArr.unshift(post);
          res.status(200).json(post);
        }
      }
    } else {
      res.status(404).json({
        message: "Post " + req.params.postId + " not found",
        status: 404,
      });
    }
  }
});

// Update to delete post categories when we get that farll
app.delete("/Posts/:postId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.postId)) {
      let post = getPostId(parseInt(req.params.postId), false);
      if (!post) {
        res.status(404).json({
          message: "Post " + req.params.postId + " not found!",
          status: 404,
        });
      } else {
        getCatPost(parseInt(req.params.postId), false);
        res.status(204).json({ message: "Post Deleted" });
      }
    } else {
      res.status(404).json({
        message: "Post " + req.params.postId + " not found!",
        status: 404,
      });
    }
  }
});

app.get("/Posts/User/:userId", (req, res, next) => {
  let user = getUserId(req.params.userId, true);
  if (user) {
    let userId = user.userId;
    let userPostArr: Post[] = [];
    for (let i = 0; i < postArr.length; i++) {
      if (postArr[i].userId === userId) {
        userPostArr.unshift(postArr[i]);
      }
    }
    if (userPostArr) {
      res.status(200).json(userPostArr);
    } else {
      res
        .status(404)
        .json({ message: "No posts found for user " + userId, status: 404 });
    }
  } else {
    res.status(404).json({
      message: "User " + req.params.userId + " not found!",
      status: 404,
    });
  }
});

app.get("/Categories", (req, res, next) => {
  res.status(200).json(catArr);
});

// Add auth
app.post("/Categories", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    let cat = new Category();
    let checkCat = checkCatNameDupe(req.body.categoryName);
    if (!checkCat) {
      cat.categoryDescription = req.body.categoryDescription;
      cat.categoryName = req.body.categoryName;
      cat.categoryId = catCounter++;
      catArr.unshift(cat);
      postCatArr.unshift(new PostCategory(cat.categoryId));
      res.status(200).json(cat);
    } else {
      res
        .status(409)
        .json({ message: "Duplicate Category Name!", status: 409 });
    }
  }
});

app.get("/Categories/:categoryId", (req, res, next) => {
  if (verifyId(req.params.categoryId)) {
    let cat = getCatId(parseInt(req.params.categoryId), true);
    if (!cat) {
      res.status(404).json({
        message: "Category " + req.params.categoryId + " not found",
        status: 404,
      });
    } else {
      res.status(200).json(cat);
    }
  } else {
    res.status(404).json({
      message: "Category " + req.params.categoryId + " not found",
      status: 404,
    });
  }
});

app.patch("/Categories/:categoryId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.categoryId)) {
      let cat = getCatId(parseInt(req.params.categoryId), false);
      if (!cat) {
        res.status(404).json({
          message: "Category " + req.params.categoryId + " not found",
          status: 404,
        });
      } else {
        cat.categoryDescription = req.body.categoryDescription;
        cat.categoryName = req.body.categoryName;
        catArr.unshift(cat);
        res.status(200).json(cat);
      }
    } else {
      res.status(404).json({
        message: "Category " + req.params.categoryId + " not found",
        status: 404,
      });
    }
  }
});

app.delete("/Categories/:categoryId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.categoryId)) {
      let cat = getCatId(parseInt(req.params.categoryId), false);
      if (!cat) {
        res.status(404).json({
          message: "Category " + req.params.categoryId + " not found!",
          status: 404,
        });
      } else {
        getPostCat(parseInt(req.params.categoryId), false);
        res.status(204).json({ message: "Category Deleted" });
      }
    } else {
      res.status(404).json({
        message: "Category " + req.params.categoryId + " not found",
        status: 404,
      });
    }
  }
});

app.get("/PostCategory/:postId", (req, res, next) => {
  if (verifyId(req.params.postId)) {
    let post = getPostId(parseInt(req.params.postId), true);
    if (!post) {
      res.status(404).json({
        message: "Post " + req.params.postId + " not found!",
        status: 404,
      });
    } else {
      let catpost = getCatPost(post.postId, true);
      if (catpost) {
        res.status(200).json(getCatPost(post.postId, true));
      } else {
        res
          .status(404)
          .json({ message: "Category Post not found!", status: 404 });
      }
    }
  } else {
    res.status(404).json({
      message: "Post " + req.params.postId + " not found!",
      status: 404,
    });
  }
});

app.get("/PostCategory/Posts/:categoryId", (req, res, next) => {
  if (verifyId(req.params.categoryId)) {
    let cat = getCatId(parseInt(req.params.categoryId), true);
    if (!cat) {
      res.status(404).json({
        message: "Category " + req.params.categoryId + " not found!",
        status: 404,
      });
    } else {
      let postcat = getPostCat(cat.categoryId, true);
      if (postcat) {
        res.status(200).json(getPostCat(cat.categoryId, true));
      } else {
        res
          .status(404)
          .json({ message: "PostCategory not found!", status: 404 });
      }
    }
  } else {
    res.status(404).json({
      message: "Category " + req.params.categoryId + " not found!",
      status: 404,
    });
  }
});

app.post("/PostCategory/:postId/:categoryId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
      let post = getPostId(parseInt(req.params.postId), true);
      if (!post) {
        res.status(404).json({
          message: "Post " + req.params.postId + " not found",
          status: 404,
        });
      } else {
        let cat = getCatId(parseInt(req.params.categoryId), true);
        if (!cat) {
          res.status(404).json({
            message: "Category " + req.params.categoryId + " not found",
            status: 404,
          });
        } else {
          let postcat = getPostCat(cat.categoryId, true);
          if (postcat) {
            postcat.addPost(post);
          } else {
            let newpostcat = new PostCategory(cat.categoryId);
            newpostcat.addPost(post);
            postCatArr.unshift(newpostcat);
          }
          let catpost = getCatPost(post.postId, true);
          if (catpost) {
            catpost.addCategory(cat);
          } else {
            let newcatpost = new CategoryPost(post.postId);
            newcatpost.addCategory(cat);
            catPostArr.unshift(newcatpost);
          }
          res
            .status(201)
            .json({ message: "Category Assigned to Post", status: 201 });
        }
      }
    } else {
      res
        .status(404)
        .json({ message: "Category or Post not found", status: 404 });
    }
  }
});

app.delete("/PostCategory/:postId/:categoryId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
      let post = getPostId(parseInt(req.params.postId), true);
      if (!post) {
        res.status(404).json({
          message: "Post " + req.params.postId + " not found",
          status: 404,
        });
      } else {
        let cat = getCatId(parseInt(req.params.categoryId), true);
        if (!cat) {
          res.status(404).json({
            message: "Category " + req.params.categoryId + " not found",
            status: 404,
          });
        } else {
          removeRelationship(cat.categoryId, post.postId);
          res
            .status(204)
            .json({ message: "Category Removed from Post", status: 201 });
        }
      }
    } else {
      res
        .status(404)
        .json({ message: "Category or Post not found", status: 404 });
    }
  }
});

app.get("/Comments/:postId", (req, res, next) => {
  if (verifyId(req.params.postId)) {
    let post = getPostId(parseInt(req.params.postId), true);
    if (!post) {
      res.status(404).json({
        message: "Post " + req.params.postId + " not found",
        status: 404,
      });
    } else {
      let tempCommentArr: Comment[] = [];
      for (let i = 0; i < commentArr.length; i++) {
        if (commentArr[i].postId === post.postId) {
          tempCommentArr.unshift(commentArr[i]);
        }
      }
      res.status(200).json(tempCommentArr);
    }
  } else {
    res.status(404).json({
      message: "Post " + req.params.postId + " not found!",
      status: 404,
    });
  }
});

app.post("/Comments/:postId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.postId)) {
      let post = getPostId(parseInt(req.params.postId), true);
      if (!post) {
        res.status(404).json({
          message: "Post " + req.params.postId + " not found",
          status: 404,
        });
      } else {
        let comment = new Comment();
        comment.commentId = commentcounter++;
        comment.userId = isAuth["user"]["userId"];
        comment.postId = post.postId;
        comment.comment = req.body.comment;
        comment.commentDate = dateSetter();
        commentArr.unshift(comment);
        res.status(201).json(comment);
      }
    } else {
      res.status(404).json({
        message: "Post " + req.params.postId + " not found!",
        status: 404,
      });
    }
  }
});

app.patch("/Comments/:postId/:commentId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
      let post = getPostId(parseInt(req.params.postId), true);
      if (!post) {
        res.status(404).json({
          message: "Post " + req.params.postId + " not found",
          status: 404,
        });
      } else {
        let comment = getCommentid(parseInt(req.params.commentId), false);
        if (!comment) {
          res.status(404).json({
            message: "Comment " + req.params.commentId + " not found",
            status: 404,
          });
        } else {
          comment.comment = req.body.comment;
          comment.commentDate = dateSetter();
          commentArr.unshift(comment);
          res.status(201).json(comment);
        }
      }
    } else {
      res
        .status(404)
        .json({ message: "Comment or Post not found", status: 404 });
    }
  }
});

app.delete("/Comments/:postId/:commentId", (req, res, next) => {
  let isAuth = verifyToken(req.headers.authorization);
  if (!isAuth) {
    res.status(401).json({ message: "Unauthorized", status: 401 });
  } else {
    if (verifyId(req.params.postId) && verifyId(req.params.categoryId)) {
      let post = getPostId(parseInt(req.params.postId), true);
      if (!post) {
        res.status(404).json({
          message: "Post " + req.params.postId + " not found",
          status: 404,
        });
      } else {
        let comment = getCommentid(parseInt(req.params.commentId), false);
        if (!comment) {
          res.status(404).json({
            message: "Comment " + req.params.commentId + " not found",
            status: 404,
          });
        } else {
          res
            .status(204)
            .json({ message: "Comment removed from post", status: 204 });
        }
      }
    } else {
      res
        .status(404)
        .json({ message: "Comment or Post not found", status: 404 });
    }
  }
});

app.get("*", (req, res) => res.redirect("/"));

function getUserId(userId: string, get: boolean) {
  let length = userArr.length;
  if (get) {
    for (let i = 0; i < length; i++) {
      if (userArr[i].userId == userId) {
        return userArr[i];
      }
    }
  } else if (!get) {
    for (let i = 0; i < length; i++) {
      if (userArr[i].userId == userId) {
        let temp = userArr[i];
        userArr.splice(i, 1);
        return temp;
      }
    }
  }
}

function getPostId(postId: number, get: boolean) {
  let length = postArr.length;
  if (get) {
    for (let i = 0; i < length; i++) {
      if (postArr[i].postId == postId) {
        return postArr[i];
      }
    }
  } else if (!get) {
    for (let i = 0; i < length; i++) {
      if (postArr[i].postId == postId) {
        let temp = postArr[i];
        postArr.splice(i, 1);
        return temp;
      }
    }
  }
}

function getCommentid(commentId: number, get: boolean) {
  let length = commentArr.length;
  if (get) {
    for (let i = 0; i < length; i++) {
      if (commentArr[i].commentId == commentId) {
        return commentArr[i];
      }
    }
  } else if (!get) {
    for (let i = 0; i < length; i++) {
      if (commentArr[i].commentId == commentId) {
        let temp = commentArr[i];
        commentArr.splice(i, 1);
        return temp;
      }
    }
  }
}

function getCatId(catId: number, get: boolean) {
  let length = catArr.length;
  if (get) {
    for (let i = 0; i < length; i++) {
      if (catArr[i].categoryId == catId) {
        return catArr[i];
      }
    }
  } else if (!get) {
    for (let i = 0; i < length; i++) {
      if (catArr[i].categoryId == catId) {
        let temp = catArr[i];
        catArr.splice(i, 1);
        return temp;
      }
    }
  }
}

function checkCatNameDupe(name: string) {
  let length = catArr.length;
  for (let i = 0; i < length; i++) {
    if (catArr[i].categoryName == name) {
      return catArr[i];
    }
  }
  return undefined;
}

function getPostCat(catId: number, get: boolean) {
  if (get) {
    for (let i = 0; i < postCatArr.length; i++) {
      if (postCatArr[i].categoryId === catId) {
        return postCatArr[i];
      }
    }
  } else {
    for (let i = 0; i < postCatArr.length; i++) {
      if (postCatArr[i].categoryId === catId) {
        postCatArr.splice(i, 1);
        i -= 1;
      }
    }
  }
}

function getCatPost(postId: number, get: boolean) {
  if (get) {
    for (let i = 0; i < catPostArr.length; i++) {
      if (catPostArr[i].postId === postId) {
        return catPostArr[i];
      }
    }
  } else {
    for (let i = 0; i < catPostArr.length; i++) {
      if (catPostArr[i].postId === postId) {
        catPostArr.splice(i, 1);
        i -= 1;
      }
    }
  }
}

function emailValidator(email: string) {
  if (validator.validate(email)) {
    return true;
  }
  return false;
}

function emptyString(...args: string[]) {
  for (let arg = 0; arg < arguments.length; arg++) {
    if (arguments[arg].replace(/\s/g, "") === "") {
      return true;
    }
  }
  return false;
}

function dateSetter() {
  let date = new Date();
  let month = date.getMonth() + 1;
  return date.getFullYear() + "-" + month + "-" + date.getDate();
}

function verifyHash(pass: string, hashed: string) {
  if (pass === undefined || hashed === undefined) {
    return false;
  }
  return bcrypt.compareSync(pass, hashed);
}

function generateToken(user: User) {
  let token = jwt.sign({ user }, key, {
    algorithm: "HS256",
    expiresIn: 900,
  });
  console.log(token);
  return token;
}

function verifyToken(token: any) {
  if (token) {
    token = token.split(" ")[1];
  }
  let payload;
  try {
    payload = jwt.verify(token, key) as any;
  } catch (e) {
    return false;
  }
  return payload;
}

function verifyId(id: string) {
  let tempid = String(parseInt(id));
  if (tempid === id) {
    return true;
  }
  return false;
}

function removeRelationship(catId: number, postId: number) {
  let catpost = getCatPost(postId, true);
  let postcat = getPostCat(catId, true);

  for (let i = 0; i < postCatArr.length; i++) {
    if (postCatArr[i].categoryId === postcat?.categoryId) {
      for (let j = 0; j < postCatArr[i].posts.length; j++) {
        if (postCatArr[i].posts[j].postId === postId) {
          postCatArr[i].posts.splice(j, 1);
          j -= 1;
        }
      }
    }
  }

  for (let i = 0; i < catPostArr.length; i++) {
    if (catPostArr[i].postId === catpost?.postId) {
      for (let j = 0; j < catPostArr[i].categories.length; j++) {
        if (catPostArr[i].categories[j].categoryId === catId) {
          catPostArr[i].categories.splice(j, 1);
          j -= 1;
        }
      }
    }
  }
}
