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
        // hostelId: {
        //     type: mongoose.Schema.ObjectId,
        //     ref: "Hostel",
        // },
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
        refreshToken: {
            type: String
        },
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
            fullName: this.fullName
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

/*
Unconfirmed fields
"contactNumber": "1234567890",
"address": {
    "city": "CityName",
    "state": "StateName",
    "zipCode": "123456"
},
"emergencyContact": {
    "name": "Jane Doe",     
    "phone": "0987654321",  
    "relation": "Parent"     
},                         
*/