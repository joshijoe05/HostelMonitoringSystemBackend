const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: [true, "full name is required"],
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "password is required"],
            trim: true
        },
        role: {
            type: String,
            enum: ["student", "caretaker", "admin"],
            default: "student"
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        hostelId: {
            type: mongoose.Schema.ObjectId,
            required: [true, "hostel id is required"],
            ref: "Hostel",
        },
        contactNumber: {
            type: String,
            required: [true, "contact number is required"],
            trim: true
        },
        address: {
            city: {
                type: String,
                trim: true
            },
            state: {
                type: String,
                trim: true
            },
            zipCode: {
                type: String,
                trim: true
            }
        },
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
        refreshToken: {
            type: String
        },
        verificationToken: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);


userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


module.exports = mongoose.model("User", userSchema);                         
