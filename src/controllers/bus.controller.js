const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const BusTravelForm = require("../models/busTravelForm.model");
const BusTravelFormResponse = require("../models/busTravelFormResponses.model");
const Joi = require("joi");


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

    // send notification

    return res.status(200).json(new ApiResponse(200, "Bus Travel Form created Successfully", busForm));
});


const respondToForm = asyncHandler(async (req, res) => {
    const formId = req.params.formId;
    const { willTravelByBus, destinationCity, relation } = req.body;
    const studentId = req.user._id;

    const responseValidation = Joi.object({
        willTravelByBus: Joi.boolean().required().messages({
            "boolean.base": "willTravelByBus must be true or false.",
            "any.required": "willTravelByBus is required."
        }),

        destinationCity: Joi.alternatives().conditional("willTravelByBus", {
            is: true,
            then: Joi.string().trim().min(2).max(50).required().messages({
                "string.base": "Destination city must be a string.",
                "string.min": "Destination city must be at least 2 characters long.",
                "string.max": "Destination city must not exceed 50 characters.",
                "any.required": "Destination city is required when traveling by bus."
            }),
            otherwise: Joi.forbidden()
        }),

        relation: Joi.alternatives().conditional("willTravelByBus", {
            is: false,
            then: Joi.string().trim().min(2).max(50).required().messages({
                "string.base": "Relation must be a string.",
                "string.min": "Relation must be at least 2 characters long.",
                "string.max": "Relation must not exceed 50 characters.",
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

module.exports = {
    createBusForm,
    respondToForm,
    getStatsOfForm,
}