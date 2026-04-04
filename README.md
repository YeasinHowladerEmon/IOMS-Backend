# 📦 Inventory Order Management System (IOMS) Backend

Welcome to the backend service of the **Inventory Order Management System (IOMS)**. This is a robust, enterprise-grade RESTful API built to handle inventory tracking, order processing, and administrative dashboard analytics seamlessly. 

The application is built using **Node.js, Express.js, TypeScript**, and **Prisma ORM** with a **PostgreSQL** database, ensuring data integrity, scalability, and type safety across the entire stack.

---

## 🌟 Key Features

- **🔐 Robust Authentication & Authorization**
  - Secure login system utilizing `bcrypt` for password hashing and `jsonwebtoken` (JWT) for stateless sessions.
  - Role-Based Access Control (RBAC) with predefined roles (`ADMIN`, `MANAGER`, `DEMO_USER`) for secure endpoint protection.
- **📦 Advanced Inventory Management**
  - Real-time stock tracking with automated status adjustments (e.g., automatically updating to `OUT_OF_STOCK` when quantity hits 0).
  - Low-stock threshold alerts with intelligent restock queue management.
- **🛒 Order Fulfillment Engine**
  - Transaction-safe order processing ensuring atomic database operations to prevent overselling.
  - Automatic stock deduction during order placement and restoration upon order cancellation/status change.
- **📊 Real-Time Dashboard & Analytics**
  - Aggregated metrics endpoints supplying insights like total revenue, order statuses, and low-stock indicators to power frontend dashboards.
- **🛠 Code Quality & Security**
  - Fully typed request validations using **Zod**.
  - Secure HTTP headers configured via **Helmet** and Cross-Origin Resource Sharing handled by **CORS**.
  - Structured error handling with custom `ApiError` utility and consistent API response formatting using a `sendResponse` helper.

---

## 🚀 Tech Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+)
- **Web Framework:** [Express.js](https://expressjs.com/) v5
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database Engine:** [PostgreSQL](https://www.postgresql.org/)
- **Schema Validation:** [Zod](https://zod.dev/)
- **Security:** Helmet, CORS, bcrypt, jsonwebtoken
- **Logging:** Morgan
- **Other Utils:** date-fns, http-status

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18.x or later)
- **npm** (or yarn/pnpm)
- **PostgreSQL Database** (Local instance or cloud provider like Neon/Supabase)

---

## 🛠️ Local Development Setup

Follow these steps to get the project up and running locally.

### 1. Clone the Repository
```bash
git clone https://github.com/YeasinHowladerEmon/IOMS-Backend.git
cd IOMS-Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Configuration
Duplicate the example environment file or create a `.env` file in the root directory. Configure the variables according to your local setup:

```env
# Application Port
PORT=5000

# Node Environment (development | production)
NODE_ENV=development

# Database Connection String
# Example: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="your_postgresql_connection_string"

# Authentication Secrets
JWT_SECRET="your_super_secret_jwt_key"
JWT_EXPIRES_IN="1d"
```

### 4. Database Setup & Prisma
Initialize the database and generate the Prisma Client.

```bash
# Generate Prisma Client types
npm run generate

# Apply migrations to your database
npm run migrate

# (Optional) Seed the database with initial dummy data
npm run seed
```

### 5. Running the Application

**Development Mode:**
Starts the server with hot-reloading using `ts-node/register` and native node watch.
```bash
npm run dev
```

**Production Mode:**
Builds the TypeScript code to plain JavaScript and runs the compiled bundle.
```bash
# Build the application
npm run build

# Start the Node process
npm start
```

---

## 🗃️ Essential Scripts

Here is a quick overview of the essential NPM scripts available in `package.json`:

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the development server with auto-reloading. |
| `npm run build` | Compiles TypeScript files into the `dist/` folder. |
| `npm start` | Runs the compiled server from `dist/server.js`. |
| `npm run generate`| Generates the Prisma Client based on `schema.prisma`. |
| `npm run migrate` | Pushes schema migrations directly to the database. |
| `npm run studio` | Opens Prisma Studio to visually interact with your database. |
| `npm run vercel-build`| Optimized build script for deployment (e.g. on Vercel). |

---

## 🏗️ Project Architecture

The application follows a modular, feature-based architecture (Controller-Service-Route structure) to ensure maximum maintainability and independent scalability.

```text
src/
├── app/
│   ├── modules/          # Core feature modules (Auth, Orders, Products, etc.)
│   │   └── [moduleName]/
│   │       ├── *.route.ts       # Express route definitions
│   │       ├── *.controller.ts  # Request/Response handling
│   │       ├── *.service.ts     # Business logic & db operations
│   │       └── *.validation.ts  # Zod validation schemas
│   ├── errors/           # Custom error utilities (e.g., ApiError)
│   ├── middlewares/      # Global Express middlewares (Auth guard, error handler)
│   └── routes/           # Centralized API router mapping
├── shared/               # Shared utilities (sendResponse, prisma instance, catchAsync)
├── app.ts                # Express application configuration
└── server.ts             # Application entry point & server bootstrap
```

---

## 📝 API Endpoints Overview

*Note: All endpoints are prefixed with `/api/v1`.*

### Authentication
- `POST /auth/login` - User login & token generation

### Products & Inventory
- `GET /products` - Retrieve a paginated list of catalog products
- `GET /products/:id` - Retrieve specific product details
- `POST /products` - *(Admin)* Add new products
- `PATCH /products/:id` - *(Admin)* Update product data
- `DELETE /products/:id` - *(Admin)* Delete a product

### Orders
- `POST /orders` - Place a new order (automatically decrements stock)
- `GET /orders` - Retrieve list of orders
- `PATCH /orders/:id/status` - *(Admin/Manager)* Update order fulfillment status

### Dashboard Operations
- `GET /dashboard` - Retrieve aggregated metrics for the frontend interface
- `PATCH /restock-queue/:id/restock` - Approve low-stock item restock

---

## 🛡️ Best Practices Implemented
- **Standardized API Responses**: Utilizing a custom `sendResponse` utility wrapper ensures the frontend receives precisely identical JSON payloads for all successful requests.
- **Centralized Error Handling**: Implementing global error middlewares catching all standard exceptions, Zod validation errors, and Prisma unique-constraint exceptions.
- **Asynchronous Wrappers**: A `catchAsync` utility eliminates repetitive root-level `try/catch` boilerplate blocks inside controllers.
- **Stateless Authentication**: Avoiding session scaling issues by heavily relying on validated cross-request JWT Tokens via Authorization headers (`Bearer <token>`).

---

## 📄 License

This application is distributed under the MIT License.
