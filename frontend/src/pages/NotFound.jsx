import { Link } from "react-router-dom"

const NotFound = () => {
  return (
    <div className="container page">
      <h1>Nothing growing here</h1>
      <p>The page you asked for doesn't exist. <Link to="/plant">Browse the plants</Link>.</p>
    </div>
  )
}

export default NotFound
