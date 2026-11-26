import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import api, { errMsg } from "../api"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import PlantImage from "../components/PlantImage"
import { LIGHT_LABEL, money } from "../config"

const ReadSinglePlant = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { add } = useCart()
  const [plant, setPlant] = useState(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    api.get(`/plant/${id}`)
      .then((res) => setPlant(res.data.result))
      .catch((error) => {
        toast.error(errMsg(error))
        navigate("/plant")
      })
  }, [id, navigate])

  if (!plant) return <div className="container page muted">Loading...</div>

  const inStock = plant.quantity > 0
  const isCare = plant.category === "Pots & care"

  const handleAdd = () => {
    add(plant, qty)
    toast.success(`${plant.name} added to your basket`)
  }

  return (
    <div className="container page">
      <p><Link to="/plant">Back to plants</Link></p>
      <div className="detail">
        <div className="detail-image">
          <PlantImage plant={plant} />
        </div>
        <div>
          <div className="small muted">{plant.category}</div>
          <h1>{plant.name}</h1>
          {plant.scientificName && <p className="latin">{plant.scientificName}</p>}
          <p className="price">{money(plant.price)}</p>
          <p>{plant.description}</p>

          {!isCare && (
            <dl className="care">
              <div><dt>Light</dt><dd>{LIGHT_LABEL[plant.light]}</dd></div>
              <div><dt>Water</dt><dd>About every {plant.wateringDays} {plant.wateringDays === 1 ? "day" : "days"}</dd></div>
              <div><dt>Care level</dt><dd>{plant.difficulty}</dd></div>
              <div><dt>Pets</dt><dd>{plant.petSafe ? "Safe for cats and dogs" : "Keep away from pets"}</dd></div>
            </dl>
          )}

          <p className="muted">{inStock ? `${plant.quantity} available` : "Sold out"}</p>

          {inStock && (
            <div className="row">
              <input
                type="number"
                min="1"
                max={plant.quantity}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value) || 1, plant.quantity)))}
                className="qty"
                aria-label="Quantity"
              />
              <button className="btn" onClick={handleAdd}>Add to basket</button>
            </div>
          )}

          {user?.role === "admin" && (
            <p><Link to={`/admin/plant/update/${plant._id}`}>Edit this plant</Link></p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReadSinglePlant
