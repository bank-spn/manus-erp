# Manus ERP - Enterprise Resource Planning System

Modern ERP system for restaurant management built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Dashboard**: Real-time overview of sales, orders, and inventory
- **Products Management**: CRUD operations for products and categories
- **Inventory Management**: Track stock levels, adjust inventory, low stock alerts
- **Order Management**: View and update order status in real-time
- **Reports**: Sales analytics and business insights (coming soon)
- **Multi-language**: Thai/English support via JSONB fields
- **Realtime**: Live updates for orders and inventory via Supabase Realtime

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Backend**: Supabase Edge Functions (Deno)

## Prerequisites

- Node.js 18+ 
- pnpm
- Supabase account

## Environment Variables

Create a `.env` file (or use the secrets management system):

```env
VITE_SUPABASE_URL=https://beqxldxtumyqvzjkmnpo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
client/
  src/
    pages/
      Dashboard.tsx      - Overview with stats and charts
      Products.tsx       - Product CRUD
      Inventory.tsx      - Stock management
      OrderList.tsx      - Order list and status updates
      Reports.tsx        - Analytics (placeholder)
    components/
      Layout.tsx         - Sidebar layout
    lib/
      supabase.ts        - Supabase client setup
      store.ts           - Zustand stores
      types.ts           - TypeScript types
```

## Key Features

### Dashboard
- Today's sales and order count
- Total products and low stock alerts
- Recent orders with real-time updates

### Products Management
- Add/edit/delete products
- Multi-language name and description
- Category assignment
- Image URL support
- Active/inactive status

### Inventory Management
- View all inventory items with current stock
- Adjust stock (IN/OUT/ADJUST)
- Low stock warnings
- Real-time stock updates
- Integration with Edge Function for atomic operations

### Order Management
- View all orders with filtering by status
- Update order status (pending → confirmed → preparing → ready → completed)
- View order details and items
- Real-time order updates

## Edge Functions

This app calls the following Edge Functions:

### POST /erp_inventory_adjust

Adjusts inventory stock levels atomically.

**Request:**
```json
{
  "inventory_item_id": 1,
  "qty_change": 50,
  "movement_type": "IN",
  "notes": "Restock from supplier"
}
```

## Database Schema

Uses shared Supabase database with schemas:
- `pos.*` - Orders, order items, payments, tables
- `erp.*` - Products, categories, inventory, stock movements, suppliers
- `cms.*` - Menu overrides
- `system.*` - Audit logs

## Realtime Subscriptions

The app subscribes to:
- `pos.orders` - Order updates
- `erp.inventory_items` - Inventory updates
- `erp.products` - Product updates

## Build for Production

```bash
pnpm build
```

Output will be in `client/dist/`

## Deployment

This app can be deployed to:
- Vercel (recommended)
- Netlify
- Any static hosting service

Make sure to set environment variables in your deployment platform.

## License

MIT

