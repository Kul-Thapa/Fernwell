// change the store name here and it updates everywhere
export const STORE_NAME = "Fernwell"

// these lists must match the ones in backend/src/schema
export const CATEGORIES = ["Indoor plants", "Succulents", "Herbs", "Flowering", "Pots & care"]
export const LIGHTS = ["low", "medium", "bright"]
export const DIFFICULTIES = ["easy", "moderate", "expert"]
export const STATUSES = ["placed", "packed", "on-the-way", "delivered", "cancelled"]

export const LIGHT_LABEL = { low: "Low light", medium: "Indirect light", bright: "Bright light" }

// little pictures used when a plant has no photo
export const CATEGORY_ICON = {
  "Indoor plants": "🪴",
  Succulents: "🌵",
  Herbs: "🌿",
  Flowering: "🌸",
  "Pots & care": "🧺",
}

export const money = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
