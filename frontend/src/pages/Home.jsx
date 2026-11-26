import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import api, { errMsg } from "../api"
import PlantCard from "../components/PlantCard"
import { CATEGORY_ICON, STORE_NAME } from "../config"

const finders = [
  { label: "Dark corner", text: "Low light, hard to kill", to: "/plant?light=low&difficulty=easy" },
  { label: "Sunny window", text: "Bright light lovers", to: "/plant?light=bright" },
  { label: "Safe for pets", text: "Non-toxic to cats and dogs", to: "/plant?petSafe=true" },
  { label: "First plant", text: "Beginner friendly", to: "/plant?difficulty=easy" },
]

const Home = () => {
  const [plants, setPlants] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get("/plant", { params: { limit: 8 } }), api.get("/plant/options")])
      .then(([p, o]) => {
        setPlants(p.data.result)
        setCategories(o.data.result.categories)
      })
      .catch((error) => toast.error(errMsg(error)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Bring something green home.</h1>
          <p>{STORE_NAME} grows houseplants, succulents and kitchen herbs. Tell us how much light you have and we'll show you what will actually survive.</p>
          <Link to="/plant" className="btn light">Browse all plants</Link>
        </div>
      </section>

      <div className="container page">
        <section>
          <h2>Find the right plant</h2>
          <div className="finder">
            {finders.map((f) => (
              <Link key={f.label} to={f.to} className="finder-card">
                <strong>{f.label}</strong>
                <span className="small muted">{f.text}</span>
              </Link>
            ))}
          </div>
        </section>

        {categories.length > 0 && (
          <section>
            <h2>Shop by type</h2>
            <div className="row">
              {categories.map((c) => (
                <Link key={c} className="btn secondary" to={`/plant?category=${encodeURIComponent(c)}`}>
                  {CATEGORY_ICON[c]} {c}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2>Fresh arrivals</h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : plants.length === 0 ? (
            <p className="muted">No plants yet.</p>
          ) : (
            <div className="grid">
              {plants.map((p) => <PlantCard key={p._id} plant={p} />)}
            </div>
          )}
          <p><Link to="/plant">See all plants</Link></p>
        </section>
      </div>
    </div>
  )
}

export default Home
