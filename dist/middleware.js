"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication failed! Token not provided." });
    }
    try {
        const secret = process.env.JWT_SECRET || 'sup3rS3cr3t';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: "Authentication failed! Invalid token." });
        }
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ message: "Authentication failed! Invalid token." });
    }
});
exports.authMiddleware = authMiddleware;
