"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Term = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const termSchema = new mongoose_1.Schema({
    name: {
        type: String,
        enum: ["1st", "2nd", "3rd"],
        required: [true, "Term name is required"],
    },
    year: {
        type: Number,
        required: [true, "Year is required"],
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"],
    },
    endDate: {
        type: Date,
        required: [true, "End date is required"],
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    holidays: [
        {
            name: {
                type: String,
                required: [true, "Holiday name is required"],
            },
            startDate: {
                type: Date,
                required: [true, "Holiday start date is required"],
            },
            endDate: {
                type: Date,
                required: [true, "Holiday end date is required"],
            },
        },
    ],
}, {
    timestamps: true,
});
// Create compound unique index for term and year
termSchema.index({ name: 1, year: 1 }, { unique: true });
// Add validation to ensure endDate is after startDate
termSchema.pre("save", function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error("End date must be after start date"));
    }
    next();
});
// Add validation for holiday dates
termSchema.pre("save", function (next) {
    const invalidHoliday = this.holidays.find((holiday) => holiday.endDate <= holiday.startDate ||
        holiday.startDate < this.startDate ||
        holiday.endDate > this.endDate);
    if (invalidHoliday) {
        next(new Error("Holiday dates must be within term dates and end date must be after start date"));
    }
    next();
});
exports.Term = mongoose_1.default.model("Term", termSchema);
