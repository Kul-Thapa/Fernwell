import { CATEGORY_ICON } from "../config"

// shows the photo if there is one, otherwise an icon for the plant's category
const PlantImage = ({ plant }) => {
  if (plant.image) return <img src={plant.image} alt={plant.name} />
  return <span aria-hidden="true">{CATEGORY_ICON[plant.category] || "🌱"}</span>
}

export default PlantImage
