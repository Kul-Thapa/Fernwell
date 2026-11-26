import { Link } from "react-router-dom"
import { LIGHT_LABEL, money } from "../config"
import PlantImage from "./PlantImage"

const PlantCard = ({ plant }) => {
  const isCare = plant.category === "Pots & care"

  return (
    <Link to={`/plant/${plant._id}`} className="plant">
      <div className="plant-image">
        <PlantImage plant={plant} />
      </div>
      <div className="small muted">{plant.category}</div>
      <div className="plant-name">{plant.name}</div>
      {plant.scientificName && <div className="latin small">{plant.scientificName}</div>}
      {!isCare && (
        <div className="tags">
          <span className="tag">{LIGHT_LABEL[plant.light]}</span>
          {plant.petSafe && <span className="tag good">Pet safe</span>}
        </div>
      )}
      <div className="plant-price">
        {money(plant.price)}
        {plant.quantity <= 0 && <span className="muted"> (sold out)</span>}
      </div>
    </Link>
  )
}

export default PlantCard
