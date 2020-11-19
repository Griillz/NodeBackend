"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
var Post = /** @class */ (function () {
    function Post(postId, createDate, title, content, userId, headerImage, lastUpdated) {
        this.postId = 0;
        this.createdDate = "";
        this.title = "";
        this.content = "";
        this.userId = "";
        this.headerImage = "";
        this.lastUpdated = "";
        this.postId = postId;
        this.createdDate = createDate;
        this.title = title;
        this.content = content;
        this.userId = userId;
        this.headerImage = headerImage;
        this.lastUpdated = lastUpdated;
    }
    return Post;
}());
exports.Post = Post;
