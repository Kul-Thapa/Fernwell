import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import api, { errMsg } from "../api"
import { money } from "../config"

const AdminPlant = () => {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    api.get("/plant", { params: { limit: 48 } })
      .then((res) => setPlants(res.data.result))
      .catch((error) => toast.error(errMsg(error)))
      .finally(() => setLoading(false))
  }, [refresh])

  const handleDelete = async (plant) => {
    if (!window.confirm(`Delete "${plant.name}"? This can't be undone.`)) return
    try {
      await api.delete(`/plant/${plant._id}`)
      toast.success("Plant deleted")
      setRefresh((n) => n + 1)
    } catch (error) {
      toast.error(errMsg(error))
    }
  }

  return (
    <div className="container page">
      <div className="between">
        <h1>Plants</h1>
        <button className="btn" onClick={() => navigate("/admin/plant/create")}>Add plant</button>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : plants.length === 0 ? (
        <p>No plants yet. Add your first plant to open the nursery.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Type</th><th>Price</th><th>Stock</th><th></th></tr>
            </thead>
            <tbody>
              {plants.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link to={`/plant/${p._id}`}>{p.name}</Link>
                    {p.scientificName && <div className="latin small">{p.scientificName}</div>}
                  </td>
                  <td>{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.quantity <= 3 ? <span className="low-stock">{p.quantity}</span> : p.quantity}</td>
                  <td className="actions">
                    <Link to={`/admin/plant/update/${p._id}`}>Edit</Link>
                    <button className="link-button danger" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPlant
