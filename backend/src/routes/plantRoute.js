import { Router } from "express"
import Plant, { CATEGORIES, LIGHTS, DIFFICULTIES } from "../schema/plantSchema.js"
import { protect, adminOnly } from "../middleware/auth.js"

let plantRoute = Router()

const fail = (message, status = 400) => Object.assign(new Error(message), { status })
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// only these fields can be written from a request, so nobody can slip in extra data
const FIELDS = ["name", "scientificName", "price", "quantity", "category", "light", "difficulty", "wateringDays", "petSafe", "description", "image"]
const pickFields = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]))

// GET /plant?q=monstera&category=Succulents&light=low&difficulty=easy&petSafe=true&sort=price-asc&page=1&limit=12
plantRoute
    .route("/")
    .get(async (req, res) => {
        const { q, category, light, difficulty, petSafe, sort } = req.query
        const page = Math.max(1, Number(req.query.page) || 1)
        const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12))

        const filter = {}
        if (q) {
            const search = { $regex: escapeRegex(String(q)), $options: "i" }
            filter.$or = [{ name: search }, { scientificName: search }]
        }
        if (category) filter.category = String(category)
        if (light) filter.light = String(light)
        if (difficulty) filter.difficulty = String(difficulty)
        if (petSafe === "true") filter.petSafe = true

        const sorts = {
            newest: { _id: -1 },
            "price-asc": { price: 1 },
            "price-desc": { price: -1 },
            "name-asc": { name: 1 },
        }

        const total = await Plant.countDocuments(filter)
        const result = await Plant.find(filter)
            .sort(sorts[sort] || sorts.newest)
            .skip((page - 1) * limit)
            .limit(limit)

        res.status(200).json({
            success: true,
            message: "Plants read successfully",
            result: result,
            total: total,
            page: page,
            pages: Math.max(1, Math.ceil(total / limit)),
        })
    })
    .post(protect, adminOnly, async (req, res) => {
        let result = await Plant.create(pickFields(req.body))
        res.status(201).json({
            success: true,
            message: "Plant created successfully.",
            result: result,
        })
    })

// the lists the frontend uses for its dropdowns. must stay above "/:id" or "options" would be read as an id
plantRoute
    .route("/options")
    .get((req, res) => {
        res.status(200).json({
            success: true,
            message: "Options read successfully",
            result: { categories: CATEGORIES, lights: LIGHTS, difficulties: DIFFICULTIES },
        })
    })

plantRoute
    .route("/:id")//localhost:8000/plant/id
    .get(async (req, res) => {
        let result = await Plant.findById(req.params.id)
        if (!result) throw fail("Plant not found.", 404)
        res.status(200).json({
            success: true,
            message: "Plant read successfully",
            result: result,
        })
    })
    .patch(protect, adminOnly, async (req, res) => {
        let result = await Plant.findByIdAndUpdate(req.params.id, pickFields(req.body), { new: true, runValidators: true })
        if (!result) throw fail("Plant not found.", 404)
        res.status(200).json({
            success: true,
            message: "Plant updated successfully",
            result: result,
        })
    })
    .delete(protect, adminOnly, async (req, res) => {
        let result = await Plant.findByIdAndDelete(req.params.id)
        if (!result) throw fail("Plant not found.", 404)
        res.status(200).json({
            success: true,
            message: "Plant deleted successfully",
            result: result,
        })
    })

export default plantRoute
