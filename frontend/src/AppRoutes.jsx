import { Route, Routes } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import Login from "./user/Login"
import Register from "./user/Register"
import ReadAllUser from "./user/ReadAllUser"
import ReadAllPlant from "./plant/ReadAllPlant"
import ReadSinglePlant from "./plant/ReadSinglePlant"
import CreatePlant from "./plant/CreatePlant"
import UpdatePlant from "./plant/UpdatePlant"
import AdminPlant from "./plant/AdminPlant"
import Cart from "./cart/Cart"
import Checkout from "./cart/Checkout"
import MyOrders from "./order/MyOrders"
import AdminOrder from "./order/AdminOrder"

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />

      <Route path="/plant" element={<ReadAllPlant />} />
      <Route path="/plant/:id" element={<ReadSinglePlant />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />

      <Route path="/admin/plant" element={<ProtectedRoute admin><AdminPlant /></ProtectedRoute>} />
      <Route path="/admin/plant/create" element={<ProtectedRoute admin><CreatePlant /></ProtectedRoute>} />
      <Route path="/admin/plant/update/:id" element={<ProtectedRoute admin><UpdatePlant /></ProtectedRoute>} />
      <Route path="/admin/order" element={<ProtectedRoute admin><AdminOrder /></ProtectedRoute>} />
      <Route path="/admin/user" element={<ProtectedRoute admin><ReadAllUser /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
