import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import api, { errMsg } from "../api"
import PlantForm from "./PlantForm"

const CreatePlant = () => {
  const navigate = useNavigate()

  const handleSave = async (data) => {
    try {
      await api.post("/plant", data)
      toast.success("Plant added")
      navigate("/admin/plant")
    } catch (error) {
      toast.error(errMsg(error))
    }
  }

  return (
    <div className="container page narrow">
      <h1>Add a plant</h1>
      <PlantForm onSave={handleSave} submitLabel="Add plant" />
    </div>
  )
}

export default CreatePlant
