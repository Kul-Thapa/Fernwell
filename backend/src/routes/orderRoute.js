import { Router } from "express"
import Order, { STATUSES } from "../schema/orderSchema.js"
import Plant from "../schema/plantSchema.js"
import { protect, adminOnly } from "../middleware/auth.js"

let orderRoute = Router()

const fail = (message, status = 400) => Object.assign(new Error(message), { status })

orderRoute
    .route("/")
    // place an order. prices come from the database, never from the browser
    .post(protect, async (req, res) => {
        const { items, shipping, note } = req.body
        if (!Array.isArray(items) || items.length === 0) throw fail("Your cart is empty.")

        const details = {
            name: String(shipping?.name || "").trim(),
            phone: String(shipping?.phone || "").trim(),
            address: String(shipping?.address || "").trim(),
        }
        if (!details.name || !details.phone || !details.address) {
            throw fail("Name, phone and address are required.")
        }

        // merge repeated plants and check quantities
        const wanted = new Map()
        for (const item of items) {
            const qty = Number(item.qty)
            if (!Number.isInteger(qty) || qty < 1) throw fail("Invalid quantity.")
            const id = String(item.plant)
            wanted.set(id, (wanted.get(id) || 0) + qty)
        }

        const plants = await Plant.find({ _id: { $in: [...wanted.keys()] } })
        if (plants.length !== wanted.size) throw fail("One or more plants no longer exist.")

        const lines = plants.map((p) => ({
            plant: p._id,
            name: p.name,
            price: p.price,
            qty: wanted.get(String(p._id)),
        }))

        // take stock one plant at a time. the filter makes sure it never goes below zero,
        // and if any line fails, the ones already taken are put back
        const reserved = []
        try {
            for (const line of lines) {
                const taken = await Plant.updateOne(
                    { _id: line.plant, quantity: { $gte: line.qty } },
                    { $inc: { quantity: -line.qty } }
                )
                if (taken.modifiedCount === 0) throw fail(`Not enough stock for ${line.name}.`)
                reserved.push(line)
            }

            const result = await Order.create({
                user: req.user._id,
                items: lines,
                total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
                shipping: details,
                note: String(note || "").trim(),
            })

            res.status(201).json({ success: true, message: "Order placed successfully.", result: result })
        } catch (error) {
            for (const line of reserved) {
                await Plant.updateOne({ _id: line.plant }, { $inc: { quantity: line.qty } })
            }
            throw error
        }
    })
    // admin: all orders
    .get(protect, adminOnly, async (req, res) => {
        let result = await Order.find().populate("user", "name email").sort({ _id: -1 })
        res.status(200).json({ success: true, message: "Orders read successfully", result: result })
    })

// must stay above "/:id"
orderRoute
    .route("/mine")
    .get(protect, async (req, res) => {
        let result = await Order.find({ user: req.user._id }).sort({ _id: -1 })
        res.status(200).json({ success: true, message: "Orders read successfully", result: result })
    })

orderRoute
    .route("/:id")
    .get(protect, async (req, res) => {
        let result = await Order.findById(req.params.id).populate("user", "name email")
        const isOwner = result && String(result.user._id) === String(req.user._id)
        if (!result || (!isOwner && req.user.role !== "admin")) throw fail("Order not found.", 404)
        res.status(200).json({ success: true, message: "Order read successfully", result: result })
    })

orderRoute
    .route("/:id/status")
    .patch(protect, adminOnly, async (req, res) => {
        const { status } = req.body
        if (!STATUSES.includes(status)) throw fail("Invalid status.")

        const order = await Order.findById(req.params.id)
        if (!order) throw fail("Order not found.", 404)
        if (order.status === "cancelled" && status !== "cancelled") {
            throw fail("A cancelled order can't be reopened.")
        }

        // cancelling puts the stock back
        if (status === "cancelled" && order.status !== "cancelled") {
            for (const line of order.items) {
                await Plant.updateOne({ _id: line.plant }, { $inc: { quantity: line.qty } })
            }
        }

        order.status = status
        await order.save()
        res.status(200).json({ success: true, message: "Order status updated", result: order })
    })

export default orderRoute
