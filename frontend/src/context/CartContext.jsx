/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem("fernwell-basket")) || []
  } catch {
    return []
  }
}

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem("fernwell-basket", JSON.stringify(items))
  }, [items])

  // only the bits needed to show the basket are stored. the server checks price and stock again at checkout
  const add = (plant, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i._id === plant._id)
      if (found) {
        return prev.map((i) =>
          i._id === plant._id ? { ...i, stock: plant.quantity, qty: Math.min(i.qty + qty, plant.quantity) } : i
        )
      }
      return [
        ...prev,
        {
          _id: plant._id,
          name: plant.name,
          price: plant.price,
          image: plant.image,
          stock: plant.quantity,
          qty: Math.min(qty, plant.quantity),
        },
      ]
    })
  }

  const setQty = (id, qty) => {
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, qty: Math.max(1, Math.min(qty || 1, i.stock)) } : i))
    )
  }

  const remove = (id) => setItems((prev) => prev.filter((i) => i._id !== id))
  const clear = () => setItems([])

  const count = items.reduce((sum, i) => sum + i.qty, 0)
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0)

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, total }}>
      {children}
    </CartContext.Provider>
  )
}
