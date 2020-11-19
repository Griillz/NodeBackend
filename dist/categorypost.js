"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryPost = void 0;
var CategoryPost = /** @class */ (function () {
    function CategoryPost(postId) {
        this.postId = 0;
        this.categories = [];
        this.postId = postId;
    }
    CategoryPost.prototype.addCategory = function (category) {
        this.categories.push(category);
    };
    return CategoryPost;
}());
exports.CategoryPost = CategoryPost;
