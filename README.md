<<<<<<< HEAD
# Fastdrop - E-commerce Platform

A complete e-commerce platform built with Next.js, Prisma, and PostgreSQL that allows suppliers to create products, vendors to create stores and import products, and customers to purchase items.

## Features

### 🔐 Authentication System
- Role-based authentication (Admin, Supplier, Vendor)
- Secure login/register with bcrypt password hashing
- Session management with cookies

### 👨‍💼 Supplier Features
- Create and manage products
- Generate hosted checkout links
- Track sales and orders
- View analytics dashboard

### 🏪 Vendor Features
- Create multiple stores with templates
- Import products from suppliers
- Set markup percentages
- Manage store settings
- Track store performance

### 🛒 Customer Features
- Browse vendor stores
- Purchase products through hosted links
- Secure checkout process

### 📊 Admin Features
- View platform analytics
- Monitor all activities
- Manage users and stores

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Charts**: Recharts
- **Authentication**: Custom session management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fastdrop"

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   ├── supplier/
│   │   └── vendor/
│   ├── api/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── stores/
│   │   └── orders/
│   ├── checkout/
│   ├── store/
│   ├── login/
│   └── register/
├── components/
│   ├── charts/
│   └── ui/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── session.ts
└── types/
    └── index.ts
```

## User Roles

### Admin
- Access: `/admin`
- Can view platform-wide analytics
- Can manage all users and stores

### Supplier
- Access: `/supplier`
- Can create and manage products
- Can generate hosted checkout links
- Can view sales analytics

### Vendor
- Access: `/vendor`
- Can create multiple stores
- Can import products from suppliers
- Can set markup percentages
- Can manage store settings

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get supplier's products
- `POST /api/products` - Create new product
- `GET /api/products/available` - Get available products for import
- `POST /api/products/import` - Import product to store
- `POST /api/products/[id]/hosted-link` - Generate hosted link

### Stores
- `GET /api/stores` - Get vendor's stores
- `POST /api/stores` - Create new store
- `GET /api/stores/[slug]` - Get store by slug
- `PATCH /api/stores/[id]` - Update store

### Orders
- `POST /api/orders` - Create new order

## Revenue Model

1. **Supplier** sets base price for products
2. **Vendor** imports products and sets markup percentage
3. **Customer** pays final price (base price + markup)
4. **Revenue split**:
   - Supplier receives: Base price
   - Vendor receives: Markup amount
   - Platform receives: Commission (configurable)

## Payment Integration

The platform is ready for payment gateway integration. Currently, it creates orders in "PENDING" status. To integrate payments:

1. Add your payment gateway keys to environment variables
2. Update the order creation flow in `/api/orders/route.ts`
3. Add webhook handlers for payment confirmations
4. Update order status after successful payment

## Development

### Database Schema

The database schema includes:
- Users (with roles)
- Stores (vendor-owned)
- Products (supplier-created, vendor-imported)
- Orders (customer purchases)

### Adding New Features

1. Update Prisma schema if needed
2. Run `npx prisma db push`
3. Create API routes
4. Create frontend components
5. Update navigation and routing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
=======
# dropfast
>>>>>>> b0c908fb5db51d46ee881af50bd016631aaa9fa9
