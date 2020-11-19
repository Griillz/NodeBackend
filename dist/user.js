"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var bcrypt_1 = __importDefault(require("bcrypt"));
var User = /** @class */ (function () {
    function User() {
        this.userId = "";
        this.firstName = "";
        this.lastName = "";
        this.emailAddress = "";
        this.password = "";
        this.hashedPassword = "";
    }
    User.prototype.generateHash = function () {
        this.hashedPassword = bcrypt_1.default.hashSync(this.password, 10);
    };
    return User;
}());
exports.User = User;
