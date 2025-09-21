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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateStudentNames = void 0;
var mongoose_1 = require("mongoose");
var Student_1 = require("../models/Student");
/**
 * Migration script to split existing fullName into firstName and lastName
 * Run this script once after updating the Student model with name fields
 */
var migrateStudentNames = function () { return __awaiter(void 0, void 0, void 0, function () {
    var studentsToMigrate, _i, studentsToMigrate_1, student, nameParts, firstName, lastName, studentsWithoutNames, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                console.log("Starting student name migration...");
                return [4 /*yield*/, Student_1.Student.find({
                        $or: [
                            { firstName: { $exists: false } },
                            { lastName: { $exists: false } },
                            { firstName: "" },
                            { lastName: "" },
                        ],
                    })];
            case 1:
                studentsToMigrate = _a.sent();
                console.log("Found ".concat(studentsToMigrate.length, " students to migrate"));
                _i = 0, studentsToMigrate_1 = studentsToMigrate;
                _a.label = 2;
            case 2:
                if (!(_i < studentsToMigrate_1.length)) return [3 /*break*/, 5];
                student = studentsToMigrate_1[_i];
                if (!student.fullName) return [3 /*break*/, 4];
                nameParts = student.fullName.trim().split(/\s+/);
                firstName = nameParts[0] || "";
                lastName = nameParts.slice(1).join(" ") || "";
                // Update the student with split names
                return [4 /*yield*/, Student_1.Student.findByIdAndUpdate(student._id, {
                        firstName: firstName.charAt(0).toUpperCase() +
                            firstName.slice(1).toLowerCase(),
                        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase(),
                    })];
            case 3:
                // Update the student with split names
                _a.sent();
                console.log("Migrated: ".concat(student.fullName, " -> ").concat(firstName, " ").concat(lastName));
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [4 /*yield*/, Student_1.Student.find({
                    $or: [
                        { firstName: { $exists: false } },
                        { lastName: { $exists: false } },
                        { firstName: "" },
                        { lastName: "" },
                    ],
                })];
            case 6:
                studentsWithoutNames = _a.sent();
                console.log("Migration complete. ".concat(studentsWithoutNames.length, " students still missing names."));
                return [2 /*return*/, studentsWithoutNames.length === 0];
            case 7:
                error_1 = _a.sent();
                console.error("Migration failed:", error_1);
                return [2 /*return*/, false];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.migrateStudentNames = migrateStudentNames;
// If running this script directly
if (require.main === module) {
    (function () { return __awaiter(void 0, void 0, void 0, function () {
        var success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mongoose_1.default.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/schoolms")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, exports.migrateStudentNames)()];
                case 2:
                    success = _a.sent();
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 3:
                    _a.sent();
                    process.exit(success ? 0 : 1);
                    return [2 /*return*/];
            }
        });
    }); })();
}
