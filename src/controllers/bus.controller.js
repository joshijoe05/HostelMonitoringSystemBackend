const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const BusTravelForm = require("../models/busTravelForm.model");
const BusTravelFormResponse = require("../models/busTravelFormResponses.model");
const Joi = require("joi");
const BusRoute = require("../models/busRoute.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const Booking = require("../models/booking.model");
const { notificationToTopic } = require("../services/notification.service");


const createBusForm = asyncHandler(async (req, res) => {
    const { hostelId, expiresAt, cities } = req.body;
    const createdBy = req.user._id;

    const busValidation = Joi.object({
        hostelId: Joi.array()
            .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
            .min(1)
            .required()
            .messages({
                "array.base": "Hostel ID must be an array.",
                "array.min": "At least one hostel ID is required.",
                "string.pattern.base": "Invalid Hostel ID format."
            }),

        expiresAt: Joi.date().iso().required().messages({
            "date.base": "Invalid date format.",
            "date.iso": "Date must be in ISO 8601 format."
        }),

        cities: Joi.array()
            .items(Joi.string().trim().min(2).max(50))
            .min(1)
            .required()
            .messages({
                "array.base": "Cities must be an array.",
                "array.min": "At least one city is required.",
                "string.min": "City name must be at least 2 characters long.",
                "string.max": "City name must not exceed 50 characters."
            })
    });

    const { error } = busValidation.validate({ hostelId, expiresAt, cities });
    if (error) {
        throw new ApiError(400, error.details[0].message);
    }
    const formattedExpiresAt = new Date(expiresAt);

    const busForm = await BusTravelForm.create({ hostelId, expiresAt: formattedExpiresAt, cities, createdBy });
    if (!busForm) {
        throw new ApiError(500, "Bus Travel Form could not be created");
    }
    const expiresAtFormatted = new Date(busForm.expiresAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    for (var topic of hostelId) {
        await notificationToTopic(topic, "New Bus Travel Form Available", `A new bus travel form has been created for your hostel. Check it now!, Expires on ${expiresAtFormatted}`);
    }
    const students = await User.find({ hostelId: { $in: hostelId }, role: "student" }).select("_id");

    if (students.length > 0) {
        const recipientIds = students.map(student => student._id);

        const notification = new Notification({
            recipients: recipientIds,
            title: "New Bus Travel Form Available",
            body: `A new bus travel form has been created for your hostel. Check it now!, Expires on ${expiresAtFormatted}`,
            type: "busform",
            data: { busFormId: busForm._id },
        });

        await notification.save();
    }

    return res.status(200).json(new ApiResponse(200, "Bus Travel Form created Successfully", busForm));
});

const getFormDetailsForStudent = asyncHandler(async (req, res) => {
    const formId = req.params.formId;
    const studentId = req.user._id;
    const busForm = await BusTravelForm.findById(formId);
    if (!busForm) {
        throw new ApiError(404, "Bus Travel Form not found");
    }
    const existingResponse = await BusTravelFormResponse.findOne({ formId, studentId });

    return res.status(200).json(new ApiResponse(200, "Form Details Fetched Successfully", {
        cities: busForm.cities,
        expiresAt: busForm.expiresAt,
        hasResponded: !!existingResponse,  // true if response exists, false otherwise
    }));
});


const respondToForm = asyncHandler(async (req, res) => {
    const formId = req.params.formId;
    const { willTravelByBus, destinationCity, relation } = req.body;
    const studentId = req.user._id;

    const busForm = await BusTravelForm.findById(formId);
    if (!busForm) {
        throw new ApiError(404, "Bus Travel Form not found");
    }

    if (new Date(busForm.expiresAt) < new Date()) {
        throw new ApiError(400, "This form has expired, responses are no longer accepted.");
    }

    if (!busForm.isActive) {
        throw new ApiError(400, "This form is no longer active.");
    }

    if (!busForm.hostelId.some(id => id.toString() === req.user.hostelId.toString())) {
        throw new ApiError(403, "You are not allowed to respond to this form as your hostel is not listed.");
    }

    const existingResponse = await BusTravelFormResponse.findOne({ formId, studentId });
    if (existingResponse) {
        throw new ApiError(400, "You have already responded to this form.");
    }

    const responseValidation = Joi.object({
        willTravelByBus: Joi.boolean().required().messages({
            "boolean.base": "willTravelByBus must be true or false.",
            "any.required": "willTravelByBus is required."
        }),

        destinationCity: Joi.alternatives([
            Joi.string().trim().min(2).max(50),
            Joi.allow(null)
        ])
            .when("willTravelByBus", {
                is: true,
                then: Joi.required().messages({
                    "any.required": "Destination city is required when traveling by bus."
                }),
                otherwise: Joi.forbidden()
            }),

        relation: Joi.alternatives([
            Joi.string().trim().min(2).max(50),
            Joi.allow(null)
        ])
            .when("willTravelByBus", {
                is: false,
                then: Joi.required().messages({
                    "any.required": "Relation is required when not traveling by bus."
                }),
                otherwise: Joi.forbidden()
            })
    });


    const { error } = responseValidation.validate({ willTravelByBus, destinationCity, relation });
    if (error) {
        throw new ApiError(400, error.details[0].message);
    }

    const busFormResponse = await BusTravelFormResponse.create({ formId, studentId, willTravelByBus, destinationCity, relation });
    if (!busFormResponse) {
        throw new ApiError(500, "Bus Travel Form Response could not be created");
    }
    return res.status(200).json(new ApiResponse(200, "Bus Travel Form Response created Successfully", busFormResponse));
});


const getStatsOfForm = asyncHandler(async (req, res) => {
    const formId = req.params.formId;
    const busForm = await BusTravelForm.findById(formId);
    if (!busForm) {
        throw new ApiError(404, "Bus Travel Form not found");
    }

    const busFormResponses = await BusTravelFormResponse.find({ formId });
    return res.status(200).json(new ApiResponse(200, "Bus Travel Form Responses fetched Successfully", { busForm, busFormResponses }));
});


const createBusRoute = asyncHandler(async (req, res) => {
    const { name, from, to, busFare, seatsAvailable, busType, departureTime, hostels, date } = req.body;
    const createdBy = req.user._id;

    const routeValidationSchema = Joi.object({
        name: Joi.string().trim().min(3).max(100).required(),
        from: Joi.string().trim().min(3).max(100).required(),
        to: Joi.string().trim().min(3).max(100).required(),
        busFare: Joi.number().positive().required(),
        seatsAvailable: Joi.number().integer().min(1).required(),
        busType: Joi.string().valid("Express", "Super Luxury", "Ultra Deluxe", "Palle Velugu").required(),
        departureTime: Joi.date().iso().required(),
        hostels: Joi.array().items(Joi.string().trim().required()).min(1).required(),
        date: Joi.date().iso().required()
    });

    const { error } = routeValidationSchema.validate({ name, from, to, busFare, seatsAvailable, busType, departureTime, hostels, date });
    if (error) {
        throw new ApiError(400, error.details[0].message);
    }

    const busRoute = await BusRoute.create({
        createdBy,
        name,
        from,
        to,
        busFare,
        seatsAvailable,
        busType,
        departureTime,
        hostels,
        date
    });

    if (!busRoute) {
        throw new ApiError(500, "Bus route could not be created.");
    }

    // set bus seats in cache

    return res.status(201).json(new ApiResponse(201, "Bus route created successfully", busRoute));
});


const getAllBusRoutes = asyncHandler(async (req, res) => {
    const { busType, to, sortBy = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;

    const filters = {};

    if (busType) filters.busType = busType;
    if (to) filters.to = new RegExp(to, "i");
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const sortOption = { [sortBy]: order === "desc" ? -1 : 1 };

    const totalRoutes = await BusRoute.countDocuments(filters);
    const busRoutes = await BusRoute.find(filters)
        .populate("createdBy", "fullName")
        .populate("hostels", "name")
        .sort(sortOption)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    return res.status(200).json(new ApiResponse(200, "Bus routes fetched successfully", {
        busRoutes,
        meta: {
            total: totalRoutes,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(totalRoutes / limitNumber),
        },
    }));
});


const getBusRoutesForStudents = asyncHandler(async (req, res) => {
    const { to } = req.query;
    const studentHostelId = req.user.hostelId;

    const filters = {
        hostels: { $in: studentHostelId },
        seatsAvailable: { $gt: 0 }
    };

    if (to) {
        filters.to = new RegExp(to, "i");
    }

    const busRoutes = await BusRoute.find(filters)
        .populate("createdBy", "fullName email")
        .populate("hostels", "name");

    return res.status(200).json(new ApiResponse(200, "Bus routes fetched successfully", busRoutes));
});


const getAllCities = asyncHandler(async (req, res) => {
    const cities = await BusRoute.distinct("to");
    return res.status(200).json(new ApiResponse(200, "Bus routes fetched successfully", { cities }));
});

const getPastBookingsOfStudent = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const bookings = await Booking.find({ userId: studentId }).populate("busId", "name from to busType date").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, "Past bookings fetched successfully", { bookings }));
});


module.exports = {
    createBusForm,
    respondToForm,
    getStatsOfForm,
    createBusRoute,
    getAllBusRoutes,
    getBusRoutesForStudents,
    getAllCities,
    getFormDetailsForStudent,
    getPastBookingsOfStudent,
}