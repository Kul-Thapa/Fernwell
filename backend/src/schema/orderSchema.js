import { model, Schema } from "mongoose"

export const STATUSES = ["placed", "packed", "on-the-way", "delivered", "cancelled"]

let orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // name and price are copied at order time so old orders don't change when a plant is edited
    items: [{
        plant: { type: Schema.Types.ObjectId, ref: "Plant" },
        name: String,
        price: Number,
        qty: Number,
    }],
    total: {
        type: Number,
        required: true,
    },
    shipping: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
    },
    note: { type: String, trim: true }, // e.g. "call before delivery"
    status: {
        type: String,
        enum: STATUSES,
        default: "placed",
    },
    paymentMethod: {
        type: String,
        default: "cash on delivery",
    },
}, { timestamps: true })

let Order = model("Order", orderSchema)
export default Order
