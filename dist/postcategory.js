"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostCategory = void 0;
var PostCategory = /** @class */ (function () {
    function PostCategory(categoryId) {
        this.categoryId = 0;
        this.posts = [];
        this.categoryId = categoryId;
    }
    PostCategory.prototype.addPost = function (post) {
        this.posts.push(post);
    };
    return PostCategory;
}());
exports.PostCategory = PostCategory;
