# Fernwell: online plant nursery (MERN)

React + Vite frontend, Express 5 + MongoDB backend, JWT login, cash-on-delivery orders and an admin panel.

```
fernwell/
  backend/    Express API   -> http://localhost:8000
  frontend/   React website -> http://localhost:5173
```

## Deploy to EC2 with GitHub Actions

A second workflow builds the site and deploys the whole MERN app (React + Express) to one AWS EC2 instance. Only the three AWS credentials go in GitHub Secrets; the instance ID, MongoDB URL, JWT secret and admin settings are filled in `.github/deploy-config.env`. Then push to `main` or run **Deploy MERN app to EC2** manually. See [docs/EC2-DEPLOYMENT.md](docs/EC2-DEPLOYMENT.md) for the one-time instance setup and full details. The existing CI checks and local development are unchanged.

## 1. Install the tools (one time)

1. **Node.js LTS** (v20 or newer): https://nodejs.org  
   Check: `node -v` and `npm -v`
2. **MongoDB**, pick ONE:
   - **A. On your computer:** install *MongoDB Community Server* from https://www.mongodb.com/try/download/community  
     On Windows, tick "Install as a Service" so it starts by itself.
   - **B. In the cloud (no install):** make a free cluster at https://www.mongodb.com/atlas, create a database user, allow your IP, and copy the connection string.
3. **VS Code** (optional but recommended): https://code.visualstudio.com

## 2. Start the backend

Open a terminal in the `backend` folder:

```bash
cd backend
npm install
```

Create the settings file:

- Windows: `copy .env.example .env`
- Mac / Linux: `cp .env.example .env`

Open `.env`:

- Using MongoDB on your computer: leave `DB_URL` as it is.
- Using Atlas: paste your connection string into `DB_URL` (add `/fernwell` before the `?`).
- Change `JWT_SECRET` to any long random text.

Add the sample plants and the admin account, then start the server:

```bash
npm run seed
npm run dev
```

You should see `connected to database` and `Fernwell api is listening at port 8000`.  
Visit http://localhost:8000 in the browser. You should see `{"success":true,"message":"Fernwell api is running"}`.

## 3. Start the frontend

Open a **second** terminal (leave the first one running):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## 4. Try it

| What | How |
| --- | --- |
| Admin login | `admin@fernwell.com` / `admin123` (change it in `backend/.env` before you run `npm run seed`) |
| Customer | Click **Join** and make an account |
| Order | Add plants to the basket, go to checkout, place the order |
| Manage | Log in as admin: **Plants**, **Orders** (change status), **Customers** |

## Common problems

| Problem | Fix |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running. Start the MongoDB service (Windows: Services -> MongoDB Server -> Start) or use Atlas. |
| Website shows "Something went wrong" / network error | The backend isn't running, or isn't on port 8000. Check terminal 1. |
| Login works in Postman but fails in the browser (CORS) | `CLIENT_URL` in `backend/.env` must match the address in the browser bar exactly (e.g. `http://localhost:5173`). Restart the backend after changing it. |
| `Port 8000 is already in use` | Change `PORT` in `backend/.env` and put the same address in `frontend/.env` as `VITE_API_URL` (copy `.env.example`). Restart both. |
| `npm run seed` says "admin already exists" | That is fine, the data is already there. |
| Plants have no photos | Expected. Add an image link when you add or edit a plant, otherwise a category icon is shown. |

## Where things live

Backend (`backend/src`): `constant.js` (settings), `connectToDb.js`, `middleware/auth.js` (login + admin checks), `schema/` (User, Plant, Order), `routes/` (auth, plant, user, order).  
Frontend (`frontend/src`): `config.js` (store name, lists, money format), `AppRoutes.jsx` (all pages), `NavBar.jsx`, `context/` (login + basket), `plant/`, `cart/`, `order/`, `user/`, `index.css` (all styling and colours).

## API cheat sheet

| Method | URL | Who |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | anyone |
| GET / PATCH | `/auth/me` | logged in |
| GET | `/plant?q=&category=&light=&difficulty=&petSafe=true&sort=&page=` | anyone |
| GET | `/plant/options`, `/plant/:id` | anyone |
| POST / PATCH / DELETE | `/plant`, `/plant/:id` | admin |
| POST | `/order` | logged in |
| GET | `/order/mine` | logged in |
| GET | `/order`, PATCH `/order/:id/status` | admin |
| GET / PATCH / DELETE | `/user`, `/user/:id` | admin |
