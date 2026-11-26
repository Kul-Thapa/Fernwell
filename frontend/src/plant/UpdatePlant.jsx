import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import api, { errMsg } from "../api"
import PlantForm from "./PlantForm"

const UpdatePlant = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plant, setPlant] = useState(null)

  useEffect(() => {
    api.get(`/plant/${id}`)
      .then((res) => setPlant(res.data.result))
      .catch((error) => {
        toast.error(errMsg(error))
        navigate("/admin/plant")
      })
  }, [id, navigate])

  const handleSave = async (data) => {
    try {
      await api.patch(`/plant/${id}`, data)
      toast.success("Plant updated")
      navigate("/admin/plant")
    } catch (error) {
      toast.error(errMsg(error))
    }
  }

  if (!plant) return <div className="container page muted">Loading...</div>

  return (
    <div className="container page narrow">
      <h1>Edit plant</h1>
      <PlantForm initial={plant} onSave={handleSave} submitLabel="Save changes" />
    </div>
  )
}

export default UpdatePlant
