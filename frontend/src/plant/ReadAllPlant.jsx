import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import api, { errMsg } from "../api"
import PlantCard from "../components/PlantCard"
import { CATEGORIES, DIFFICULTIES, LIGHTS, LIGHT_LABEL } from "../config"

// the shop page. every filter lives in the url so links and the back button work
const ReadAllPlant = () => {
  const [params, setParams] = useSearchParams()
  const q = params.get("q") || ""
  const category = params.get("category") || ""
  const light = params.get("light") || ""
  const difficulty = params.get("difficulty") || ""
  const petSafe = params.get("petSafe") === "true"
  const sort = params.get("sort") || "newest"
  const page = Number(params.get("page")) || 1

  const [data, setData] = useState({ result: [], total: 0, pages: 1, key: null })
  const [search, setSearch] = useState(q)

  // data remembers which query it belongs to, so we know when a new one is still loading
  const key = `${q}|${category}|${light}|${difficulty}|${petSafe}|${sort}|${page}`
  const loading = data.key !== key

  useEffect(() => {
    api.get("/plant", {
      params: { q, category, light, difficulty, petSafe: petSafe || "", sort, page, limit: 12 },
    })
      .then((res) => setData({ ...res.data, key }))
      .catch((error) => {
        toast.error(errMsg(error))
        setData({ result: [], total: 0, pages: 1, key })
      })
  }, [q, category, light, difficulty, petSafe, sort, page, key])

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, value]) => (value ? next.set(k, value) : next.delete(k)))
    if (!("page" in changes)) next.delete("page") // a new filter starts from page 1
    setParams(next)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    update({ q: search.trim() })
  }

  return (
    <div className="container page">
      <h1>Plants</h1>

      <div className="filters">
        <form onSubmit={handleSearch} className="row">
          <input
            type="search"
            placeholder="Search by name, e.g. monstera"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search plants"
          />
          <button className="btn">Search</button>
        </form>
        <div className="row">
          <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by">
            <option value="newest">Newest</option>
            <option value="name-asc">Name, A to Z</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </div>
      </div>

      <div className="filters">
        <div className="row">
          <select value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Type">
            <option value="">All types</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={light} onChange={(e) => update({ light: e.target.value })} aria-label="Light">
            <option value="">Any light</option>
            {LIGHTS.map((l) => <option key={l} value={l}>{LIGHT_LABEL[l]}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => update({ difficulty: e.target.value })} aria-label="Care level">
            <option value="">Any care level</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={petSafe}
            onChange={(e) => update({ petSafe: e.target.checked ? "true" : "" })}
          />
          Pet safe only
        </label>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : data.result.length === 0 ? (
        <p>No plants match that. <button className="link-button" onClick={() => setParams({})}>Clear filters</button></p>
      ) : (
        <>
          <p className="muted small">{data.total} {data.total === 1 ? "plant" : "plants"}</p>
          <div className="grid">
            {data.result.map((p) => <PlantCard key={p._id} plant={p} />)}
          </div>
          {data.pages > 1 && (
            <div className="row pager">
              <button className="btn secondary" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Previous</button>
              <span>Page {page} of {data.pages}</span>
              <button className="btn secondary" disabled={page >= data.pages} onClick={() => update({ page: page + 1 })}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ReadAllPlant
