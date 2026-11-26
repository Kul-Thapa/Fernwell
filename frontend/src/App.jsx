import NavBar from "./NavBar"
import AppRoutes from "./AppRoutes"
import { STORE_NAME } from "./config"

const App = () => {
  return (
    <div className="app">
      <NavBar />
      <main>
        <AppRoutes />
      </main>
      <footer className="footer">
        <div className="container">
          &copy; {new Date().getFullYear()} {STORE_NAME}. Grown with care. Payment is cash on delivery.
        </div>
      </footer>
    </div>
  )
}

export default App
