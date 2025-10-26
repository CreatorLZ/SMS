"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCSRFToken = exports.generateCSRFToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateCSRFToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
exports.generateCSRFToken = generateCSRFToken;
const validateCSRFToken = (tokenFromRequest, tokenFromCookie) => {
    if (!tokenFromRequest || !tokenFromCookie) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(Buffer.from(tokenFromRequest, "hex"), Buffer.from(tokenFromCookie, "hex"));
};
exports.validateCSRFToken = validateCSRFToken;
