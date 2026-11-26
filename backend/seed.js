// npm run seed
// creates an admin account and some sample plants (only if there are none yet)

import "dotenv/config"
import bcrypt from "bcrypt"
import mongoose from "mongoose"
import connectToDb from "./src/connectToDb.js"
import User from "./src/schema/userSchema.js"
import Plant from "./src/schema/plantSchema.js"

const plants = [
    { name: "Snake plant", scientificName: "Dracaena trifasciata", price: 850, quantity: 30, category: "Indoor plants", light: "low", difficulty: "easy", wateringDays: 14, petSafe: false, description: "Upright, sword-shaped leaves that put up with dark corners and missed waterings. Good for bedrooms and offices." },
    { name: "Money plant (golden pothos)", scientificName: "Epipremnum aureum", price: 450, quantity: 50, category: "Indoor plants", light: "low", difficulty: "easy", wateringDays: 7, petSafe: false, description: "Trailing vines that grow in soil or in a jar of water. Hang it, train it up a wall, or leave it on a shelf." },
    { name: "Monstera", scientificName: "Monstera deliciosa", price: 2200, quantity: 12, category: "Indoor plants", light: "medium", difficulty: "moderate", wateringDays: 7, petSafe: false, description: "Large split leaves that get bigger as the plant matures. Likes bright, indirect light and a moss pole to climb." },
    { name: "Peace lily", scientificName: "Spathiphyllum", price: 950, quantity: 20, category: "Flowering", light: "low", difficulty: "easy", wateringDays: 5, petSafe: false, description: "White flowers on dark green leaves. It droops when thirsty and perks up again within hours of watering." },
    { name: "Spider plant", scientificName: "Chlorophytum comosum", price: 400, quantity: 40, category: "Indoor plants", light: "medium", difficulty: "easy", wateringDays: 7, petSafe: true, description: "Arching striped leaves and baby plantlets you can pot up. Safe around cats and dogs." },
    { name: "Areca palm", scientificName: "Dypsis lutescens", price: 1800, quantity: 10, category: "Indoor plants", light: "bright", difficulty: "moderate", wateringDays: 6, petSafe: true, description: "Feathery fronds that make a room feel like a tropical lobby. Needs bright light and steady moisture." },
    { name: "Aloe vera", scientificName: "Aloe barbadensis miller", price: 350, quantity: 45, category: "Succulents", light: "bright", difficulty: "easy", wateringDays: 14, petSafe: false, description: "Thick, gel-filled leaves. Give it your sunniest windowsill and water only when the soil is fully dry." },
    { name: "Jade plant", scientificName: "Crassula ovata", price: 600, quantity: 25, category: "Succulents", light: "bright", difficulty: "easy", wateringDays: 14, petSafe: false, description: "A small tree-like succulent with glossy round leaves. Can live for decades." },
    { name: "Echeveria rosette", scientificName: "Echeveria elegans", price: 300, quantity: 60, category: "Succulents", light: "bright", difficulty: "moderate", wateringDays: 12, petSafe: true, description: "A tight rosette of pale blue-green leaves. Needs gritty soil and a pot with a drainage hole." },
    { name: "Holy basil (tulsi)", scientificName: "Ocimum tenuiflorum", price: 150, quantity: 70, category: "Herbs", light: "bright", difficulty: "easy", wateringDays: 3, petSafe: true, description: "Fragrant leaves for tea and offerings. Pinch the tips often to keep it bushy." },
    { name: "Mint", scientificName: "Mentha spicata", price: 180, quantity: 55, category: "Herbs", light: "medium", difficulty: "easy", wateringDays: 3, petSafe: false, description: "Fast-growing and thirsty. Keep it in its own pot or it will take over its neighbours." },
    { name: "Rose, miniature", scientificName: "Rosa chinensis minima", price: 700, quantity: 18, category: "Flowering", light: "bright", difficulty: "moderate", wateringDays: 4, petSafe: true, description: "Compact bush with small, long-lasting blooms. Needs at least five hours of sun." },
    { name: "Fiddle leaf fig", scientificName: "Ficus lyrata", price: 3500, quantity: 0, category: "Indoor plants", light: "bright", difficulty: "expert", wateringDays: 8, petSafe: false, description: "Big violin-shaped leaves and a reputation for being fussy. Dislikes being moved." },
    { name: "Terracotta pot, 6 inch", scientificName: "", price: 280, quantity: 80, category: "Pots & care", light: "medium", difficulty: "easy", wateringDays: 1, petSafe: true, description: "Unglazed clay with a drainage hole and saucer. Clay lets roots breathe and helps prevent overwatering." },
    { name: "Potting mix, 5 kg", scientificName: "", price: 520, quantity: 35, category: "Pots & care", light: "medium", difficulty: "easy", wateringDays: 1, petSafe: true, description: "Light mix of cocopeat, compost and perlite for most indoor plants." },
]

await connectToDb()

const email = (process.env.ADMIN_EMAIL || "admin@fernwell.com").toLowerCase()
const password = process.env.ADMIN_PASSWORD || "admin123"
if (!(await User.findOne({ email }))) {
    await User.create({ name: "Admin", email, password: await bcrypt.hash(password, 10), role: "admin" })
    console.log(`admin created: ${email} / ${password}`)
} else {
    console.log("admin already exists")
}

if ((await Plant.countDocuments()) === 0) {
    await Plant.insertMany(plants)
    console.log(`added ${plants.length} plants`)
} else {
    console.log("plants already exist, skipped")
}

await mongoose.disconnect()
