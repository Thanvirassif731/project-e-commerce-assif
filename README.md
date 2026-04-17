# MERN E-Commerce Website

A full working MERN model e-commerce application with:

- Node.js + Express API
- MongoDB + Mongoose models
- React + Vite frontend
- JWT authentication
- Improved signup/login validation and profile endpoint
- Product listing, product details, cart, checkout, and my orders
- Admin dashboard for create/update/delete product management
- Admin image upload (URL input still supported)
- Admin products table pagination and sorting
- AWS S3 product image upload
- Profile page with personal details and purchase history
- Product discount coupons with checkout validation

## Project Structure

- `server`: Express API, MongoDB models, and seed script
- `client`: React storefront app
- root scripts to run both apps together

## Deployment Guides

- Kubernetes: [KUBERNETES-README.md](KUBERNETES-README.md)

## Requirements

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

## Setup

1. Install root dependencies:

```bash
npm install
```

2. Configure backend env:

```bash
cd server
copy .env.example .env
```

3. Configure frontend env (optional if using default API URL):

```bash
cd ../client
copy .env.example .env
```

4. Start both server and client from project root:

```bash
cd ..
npm run dev
```

## Scripts

From root:

- `npm run dev`: run backend + frontend concurrently
- `npm run dev:server`: run only Express backend
- `npm run dev:client`: run only React frontend
- `npm run build`: build frontend for production
- `npm run seed`: reseed product data in MongoDB

From server:

- `npm run dev`: run API with nodemon
- `npm run start`: run API in normal mode
- `npm run seed`: clear + seed product catalog

## API Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)
- `GET /api/auth/profile-summary` (protected)
- `GET /api/products`
- `GET /api/products?paginate=true&page=1&limit=6&sortBy=createdAt&sortOrder=desc`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `POST /api/upload/product-image` (admin, multipart form-data)
- `POST /api/coupons/validate` (protected)
- `GET /api/coupons` (admin)
- `POST /api/coupons` (admin)
- `DELETE /api/coupons/:id` (admin)
- `POST /api/orders` (protected)
- `GET /api/orders/my-orders` (protected)

## Notes

- On first server startup, sample products are seeded automatically if no products exist.
- Checkout requires authentication.
- Optionally set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in [server/.env.example](server/.env.example) to auto-create or promote an admin user at startup.
- For S3 uploads, configure these variables in server `.env`: `AWS_S3_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optional `AWS_S3_PUBLIC_BASE_URL`.
