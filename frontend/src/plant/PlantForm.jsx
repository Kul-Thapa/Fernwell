import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CATEGORIES, DIFFICULTIES, LIGHTS, LIGHT_LABEL } from "../config"

const emptyPlant = {
  name: "",
  scientificName: "",
  price: "",
  quantity: "",
  category: "Indoor plants",
  light: "medium",
  difficulty: "easy",
  wateringDays: 7,
  petSafe: false,
  image: "",
  description: "",
}

// used by both CreatePlant and UpdatePlant
const PlantForm = ({ initial = emptyPlant, onSave, submitLabel }) => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...emptyPlant, ...initial })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === "checkbox" ? checked : value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name: form.name,
      scientificName: form.scientificName,
      price: form.price,
      quantity: form.quantity,
      category: form.category,
      light: form.light,
      difficulty: form.difficulty,
      wateringDays: form.wateringDays,
      petSafe: form.petSafe,
      image: form.image,
      description: form.description,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="field-row">
        <div className="field">
          <label htmlFor="name">Common name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="field">
          <label htmlFor="scientificName">Scientific name</label>
          <input id="scientificName" name="scientificName" value={form.scientificName} onChange={handleChange} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="price">Price (Rs.)</label>
          <input id="price" name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
        </div>
        <div className="field">
          <label htmlFor="quantity">Quantity in stock</label>
          <input id="quantity" name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} required />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="category">Type</label>
          <select id="category" name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="light">Light</label>
          <select id="light" name="light" value={form.light} onChange={handleChange}>
            {LIGHTS.map((l) => <option key={l} value={l}>{LIGHT_LABEL[l]}</option>)}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="difficulty">Care level</label>
          <select id="difficulty" name="difficulty" value={form.difficulty} onChange={handleChange}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="wateringDays">Water every (days)</label>
          <input id="wateringDays" name="wateringDays" type="number" min="1" value={form.wateringDays} onChange={handleChange} />
        </div>
      </div>
      <label className="check">
        <input name="petSafe" type="checkbox" checked={form.petSafe} onChange={handleChange} />
        Safe for cats and dogs
      </label>
      <div className="field">
        <label htmlFor="image">Image link</label>
        <input id="image" name="image" type="url" value={form.image} onChange={handleChange} placeholder="https://" />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows="5" value={form.description} onChange={handleChange} />
      </div>
      <div className="row">
        <button className="btn">{submitLabel}</button>
        <button type="button" className="btn secondary" onClick={() => navigate("/admin/plant")}>Cancel</button>
      </div>
    </form>
  )
}

export default PlantForm
