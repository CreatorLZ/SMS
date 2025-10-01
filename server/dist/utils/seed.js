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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSuperAdmin = void 0;
const User_1 = require("../models/User");
const seedSuperAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if any superadmin exists
        const superAdminExists = yield User_1.User.findOne({ role: "superadmin" });
        if (!superAdminExists) {
            // Create super admin if none exists
            yield User_1.User.create({
                name: "Super Admin",
                email: process.env.SUPER_ADMIN_EMAIL || "admin@treasureland.com",
                password: process.env.SUPER_ADMIN_PASSWORD || "Admin@123",
                role: "superadmin",
                verified: true,
            });
            console.log("🔐 Super Admin created successfully");
        }
    }
    catch (error) {
        console.error("Error seeding super admin:", error.message);
    }
});
exports.seedSuperAdmin = seedSuperAdmin;
