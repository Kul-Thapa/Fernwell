import { model, Schema } from "mongoose"

export const CATEGORIES = ["Indoor plants", "Succulents", "Herbs", "Flowering", "Pots & care"]
export const LIGHTS = ["low", "medium", "bright"]
export const DIFFICULTIES = ["easy", "moderate", "expert"]

let plantSchema = new Schema({
    name: {
        type: String,
        required: [true, "name is required."],
        trim: true,
    },
    scientificName: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "price is required."],
        min: [0, "price can't be negative."],
    },
    quantity: {
        type: Number,
        required: [true, "quantity is required."],
        min: [0, "quantity can't be negative."],
    },
    category: {
        type: String,
        enum: { values: CATEGORIES, message: "category must be one of: " + CATEGORIES.join(", ") },
        default: "Indoor plants",
    },
    light: {
        type: String,
        enum: { values: LIGHTS, message: "light must be low, medium or bright." },
        default: "medium",
    },
    difficulty: {
        type: String,
        enum: { values: DIFFICULTIES, message: "difficulty must be easy, moderate or expert." },
        default: "easy",
    },
    wateringDays: {
        type: Number, // water about every N days
        min: [1, "watering days must be at least 1."],
        default: 7,
    },
    petSafe: {
        type: Boolean,
        default: false,
    },
    description: { type: String, trim: true },
    image: { type: String, trim: true }, // image url
}, { timestamps: true })

let Plant = model("Plant", plantSchema)
export default Plant
