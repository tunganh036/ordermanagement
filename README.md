# Order Entry Interface

A modern, responsive order entry system built with Next.js 16 for managing customer orders with a comprehensive two-panel layout.

## Features

- **Order Header Management**: Capture complete customer and billing information including:
  - Auto-generated order numbers
  - Customer details (name, address, phone, email)
  - Shipping address
  - Billing information with tax registration number

- **Product Master List**: Browse and search through available products with real-time filtering

- **Order Detail Panel**: Add products with quantity controls displayed in a clean table format

- **Review Order Screen**: Separate page for order review before final submission

- **Vietnamese Localization**: Confirmation dialogs in Vietnamese with VND currency formatting

- **Number Formatting**: Proper comma separators for VND amounts (e.g., 122,222,222.99)

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Language**: TypeScript

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Configure environment variables:
   - Copy `.env.local` and fill in your values
   - See "Environment Variables" section below for details

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# Database Connection
DATABASE_URL=your_database_connection_string

# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Slack Webhook for Order Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
\`\`\`

### Setting up Slack Webhook

1. Go to your Slack workspace
2. Navigate to **Apps** → **Incoming Webhooks**
3. Click "Add to Slack"
4. Choose a channel for order notifications
5. Copy the Webhook URL
6. Add it to your `.env.local` file as `SLACK_WEBHOOK_URL`

## Database Integration Guide

**IMPORTANT**: The API routes are already created but have database operations commented out. Follow these steps to enable full functionality:

### Step 1: Set Up Database Tables

Create these tables in your database (Supabase, Neon, or other PostgreSQL database):

**Products Table**:
\`\`\`sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Orders Table**:
\`\`\`sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  ship_to_address TEXT,
  billing_name VARCHAR(255),
  billing_address TEXT,
  billing_tax_number VARCHAR(100),
  subtotal DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Order Items Table**:
\`\`\`sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### Step 2: Configure Environment Variables

Add your database credentials to `.env.local`:

\`\`\`env
# For Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For Neon or other PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
\`\`\`

### Step 3: Uncomment API Route Code

**WHEN TO UNCOMMENT**: After you have completed Step 1 (database tables created) and Step 2 (environment variables configured), uncomment the following code sections:

#### File: `app/api/products/route.ts`

**Lines to uncomment**: Lines 4-43 (the entire database query section)

**What to do**:
1. Remove the `//` comment marks from the Supabase/database code
2. Delete or comment out the mock data section (lines 45-56)
3. Adjust the database query to match your database structure

#### File: `app/api/orders/route.ts`

**Lines to uncomment**: Lines 6-51 (the database insert operations)

**What to do**:
1. Remove the `//` comment marks from the database save operations
2. Update line 56 to return `order.id` instead of `orderData.orderNumber`
3. Ensure your database table names match the code (adjust if needed)

### Step 4: Update Frontend to Use API

**File**: `app/page.tsx`

**Products Loading - Around line 18-35**:

Replace the static `useState` with API fetching:

\`\`\`tsx
// Replace this:
const [products] = useState<Product[]>([...])

// With this:
const [products, setProducts] = useState<Product[]>([])
const [loadingProducts, setLoadingProducts] = useState(true)

useEffect(() => {
  async function fetchProducts() {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }
  fetchProducts()
}, [])
\`\`\`

**Order Submission - Around line 435-445 (confirmOrder function)**:

Replace the simple alert with API call:

\`\`\`tsx
// Replace this:
const confirmOrder = () => {
  alert("Order submitted successfully!")
  setShowConfirmModal(false)
  onSubmitSuccess()
}

// With this:
const confirmOrder = async () => {
  try {
    const orderData = {
      orderNumber: orderHeader.orderNumber,
      orderDate: orderHeader.orderDate,
      customerName: orderHeader.customerName,
      customerAddress: orderHeader.customerAddress,
      customerPhone: orderHeader.customerPhone,
      customerEmail: orderHeader.customerEmail,
      shipToAddress: orderHeader.shipToAddress,
      billingName: orderHeader.billingName,
      billingAddress: orderHeader.billingAddress,
      billingTaxNumber: orderHeader.billingTaxNumber,
      items: orderItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity
      })),
      subtotal: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) throw new Error('Failed to submit order')

    const result = await response.json()
    alert('Order submitted successfully!')
    setShowConfirmModal(false)
    onSubmitSuccess()
  } catch (error) {
    console.error('Order submission failed:', error)
    alert('Failed to submit order. Please try again.')
  }
}
\`\`\`

## Deployment Options

This application supports two deployment scenarios: **On-Premise** (VPS/Local) and **Cloud** (Vercel + Supabase). Choose the option that best fits your infrastructure needs.

---

## Option 1: On-Premise Deployment (VPS/Local + PostgreSQL)

Deploy to your own server infrastructure with a local PostgreSQL database.

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- PM2 (for process management) or Docker
- Nginx (optional, for reverse proxy)

### Step 1: Server Setup

#### Install Node.js and PostgreSQL

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

### Step 2: Database Setup

#### Create Database and User

\`\`\`bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE order_entry_db;
CREATE USER order_app_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE order_entry_db TO order_app_user;

# Exit PostgreSQL
\q
\`\`\`

#### Create Tables

Connect to your database and run the SQL scripts:

\`\`\`bash
psql -U order_app_user -d order_entry_db -h localhost
\`\`\`

Then execute:

\`\`\`sql
-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  ship_to_address TEXT,
  billing_name VARCHAR(255),
  billing_address TEXT,
  billing_tax_number VARCHAR(100),
  subtotal DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, description, price) VALUES
('Laptop Dell XPS 13', 'High-performance ultrabook with 11th Gen Intel Core i7', 25000000.00),
('iPhone 14 Pro', 'Latest iPhone with A16 Bionic chip and 48MP camera', 28000000.00),
('Samsung Galaxy S23', 'Flagship Android phone with Snapdragon 8 Gen 2', 22000000.00);
\`\`\`

### Step 3: Application Setup

#### Clone and Configure

\`\`\`bash
# Navigate to your web directory
cd /var/www

# Clone your repository (or upload files)
git clone <your-repo-url> order-entry-app
cd order-entry-app

# Install dependencies
npm install

# Build the application
npm run build
\`\`\`

#### Configure Environment Variables

Create `.env.local` file:

\`\`\`bash
nano .env.local
\`\`\`

Add the following:

\`\`\`env
# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://order_app_user:your_secure_password@localhost:5432/order_entry_db

# Slack Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Custom Port
PORT=3000
\`\`\`

### Step 4: Update API Routes for PostgreSQL

#### Modify `app/api/products/route.ts`

Replace the commented Supabase code with raw PostgreSQL queries:

\`\`\`typescript
import { Client } from 'pg'

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    const result = await client.query(
      'SELECT id, name, description, price FROM products WHERE is_active = true ORDER BY name'
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error('Database error:', error)
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 })
  } finally {
    await client.end()
  }
}
\`\`\`

#### Modify `app/api/orders/route.ts`

\`\`\`typescript
import { Client } from 'pg'

export async function POST(request: Request) {
  const orderData = await request.json()
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    await client.query('BEGIN')

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, order_date, customer_name, customer_address, 
        customer_phone, customer_email, ship_to_address, billing_name, 
        billing_address, billing_tax_number, subtotal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        orderData.orderNumber, orderData.orderDate, orderData.customerName,
        orderData.customerAddress, orderData.customerPhone, orderData.customerEmail,
        orderData.shipToAddress, orderData.billingName, orderData.billingAddress,
        orderData.billingTaxNumber, orderData.subtotal
      ]
    )

    const orderId = orderResult.rows[0].id

    // Insert order items
    for (const item of orderData.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.productId, item.productName, item.quantity, item.unitPrice, item.total]
      )
    }

    await client.query('COMMIT')

    // Send Slack notification (keep existing code)
    if (process.env.SLACK_WEBHOOK_URL) {
      // ... existing Slack code ...
    }

    return Response.json({ success: true, orderId })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Order creation failed:', error)
    return Response.json({ error: 'Failed to create order' }, { status: 500 })
  } finally {
    await client.end()
  }
}
\`\`\`

### Step 5: Process Management with PM2

\`\`\`bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start npm --name "order-entry-app" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
\`\`\`

### Step 6: Configure Nginx (Optional)

Create Nginx configuration:

\`\`\`bash
sudo nano /etc/nginx/sites-available/order-entry
\`\`\`

Add configuration:

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

Enable and restart Nginx:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/order-entry /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### Step 7: Firewall Configuration

\`\`\`bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
\`\`\`

### On-Premise Deployment Checklist

- [ ] Install Node.js 18+ and PostgreSQL 14+
- [ ] Create database and user with proper permissions
- [ ] Run SQL scripts to create tables
- [ ] Clone/upload application files to server
- [ ] Install dependencies with `npm install`
- [ ] Configure `.env.local` with DATABASE_URL and SLACK_WEBHOOK_URL
- [ ] Update API routes to use PostgreSQL (`pg` library)
- [ ] Build application with `npm run build`
- [ ] Start with PM2: `pm2 start npm --name "order-entry-app" -- start`
- [ ] Configure Nginx as reverse proxy (optional)
- [ ] Set up SSL certificate with Let's Encrypt (optional)
- [ ] Configure firewall rules

---

## Option 2: Cloud Deployment (Vercel + Supabase)

Deploy to Vercel's serverless platform with Supabase as your managed PostgreSQL database.

### Prerequisites

- GitHub account
- Vercel account (free tier available)
- Supabase account (free tier available)

### Step 1: Set Up Supabase Database

#### Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - Project name: `order-entry-db`
   - Database Password: (save this securely)
   - Region: Choose closest to your users

#### Create Tables in Supabase

1. Once your project is ready, go to the **SQL Editor**
2. Click "New query"
3. Paste and run:

\`\`\`sql
-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  ship_to_address TEXT,
  billing_name VARCHAR(255),
  billing_address TEXT,
  billing_tax_number VARCHAR(100),
  subtotal DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, description, price) VALUES
('Laptop Dell XPS 13', 'High-performance ultrabook with 11th Gen Intel Core i7', 25000000.00),
('iPhone 14 Pro', 'Latest iPhone with A16 Bionic chip and 48MP camera', 28000000.00),
('Samsung Galaxy S23', 'Flagship Android phone with Snapdragon 8 Gen 2', 22000000.00),
('MacBook Pro M2', '14-inch with M2 Pro chip and Liquid Retina XDR display', 52000000.00),
('Sony WH-1000XM5', 'Industry-leading noise canceling wireless headphones', 8500000.00);
\`\`\`

4. Click "Run" to execute

#### Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` `public` key

### Step 2: Push to GitHub

\`\`\`bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Order Entry Interface"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/order-entry-app.git
git branch -M main
git push -u origin main
\`\`\`

### Step 3: Deploy to Vercel

#### Connect Repository

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

#### Add Environment Variables

In the Vercel project settings, add these environment variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
\`\`\`

Click "Deploy"

### Step 4: Update API Routes for Supabase

Your API routes already have Supabase code commented out. Simply uncomment them:

#### File: `app/api/products/route.ts`

**Uncomment lines 4-43** and remove/comment the mock data section.

The code should use the `@supabase/supabase-js` client:

\`\`\`typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
\`\`\`

#### File: `app/api/orders/route.ts`

**Uncomment lines 6-51** - the code is already written for Supabase!

### Step 5: Update Frontend (Required for Both Deployments)

**File**: `app/page.tsx`

**Products Loading - Around line 18-35**:

Replace the static `useState` with API fetching:

\`\`\`tsx
const [products, setProducts] = useState<Product[]>([])
const [loadingProducts, setLoadingProducts] = useState(true)

useEffect(() => {
  async function fetchProducts() {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }
  fetchProducts()
}, [])
\`\`\`

**Order Submission - Around line 435-445 (confirmOrder function)**:

Replace the simple alert with API call:

\`\`\`tsx
const confirmOrder = async () => {
  try {
    const orderData = {
      orderNumber: orderHeader.orderNumber,
      orderDate: orderHeader.orderDate,
      customerName: orderHeader.customerName,
      customerAddress: orderHeader.customerAddress,
      customerPhone: orderHeader.customerPhone,
      customerEmail: orderHeader.customerEmail,
      shipToAddress: orderHeader.shipToAddress,
      billingName: orderHeader.billingName,
      billingAddress: orderHeader.billingAddress,
      billingTaxNumber: orderHeader.billingTaxNumber,
      items: orderItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity
      })),
      subtotal: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) throw new Error('Failed to submit order')

    alert('Order submitted successfully!')
    setShowConfirmModal(false)
    onSubmitSuccess()
  } catch (error) {
    console.error('Order submission failed:', error)
    alert('Failed to submit order. Please try again.')
  }
}
\`\`\`

### Step 6: Redeploy (Vercel)

After updating the code:

\`\`\`bash
git add .
git commit -m "Enable API integration with Supabase"
git push origin main
\`\`\`

Vercel will automatically redeploy your application.

### Cloud Deployment Checklist

- [ ] Create Supabase project and save credentials
- [ ] Run SQL scripts in Supabase SQL Editor
- [ ] Push code to GitHub repository
- [ ] Create new Vercel project from GitHub repo
- [ ] Add environment variables in Vercel dashboard
- [ ] Uncomment Supabase code in `app/api/products/route.ts`
- [ ] Uncomment Supabase code in `app/api/orders/route.ts`
- [ ] Update frontend in `app/page.tsx` to use API calls
- [ ] Commit and push changes to trigger redeployment
- [ ] Test order submission and verify Slack notifications
- [ ] Configure custom domain in Vercel (optional)

---

## Comparison: On-Premise vs Cloud

| Feature | On-Premise (VPS + PostgreSQL) | Cloud (Vercel + Supabase) |
|---------|------------------------------|---------------------------|
| **Setup Time** | 2-3 hours | 30 minutes |
| **Cost** | $5-50/month (VPS) | Free tier available, ~$10-25/month at scale |
| **Maintenance** | Manual updates, backups | Fully managed, auto-scaling |
| **Database** | Self-hosted PostgreSQL | Managed PostgreSQL with backups |
| **Scalability** | Manual scaling required | Auto-scales with traffic |
| **Security** | You manage everything | Managed security and SSL |
| **Performance** | Depends on server specs | Global CDN, edge functions |
| **Best For** | Full control, compliance requirements | Fast deployment, minimal maintenance |

---

## Post-Deployment Testing

### Test Checklist

1. **Product Loading**
   - [ ] Products display correctly from database
   - [ ] Search functionality works
   - [ ] Prices show in VND format with commas

2. **Order Creation**
   - [ ] All order header fields accept input
   - [ ] Products can be added to order
   - [ ] Quantity controls work (+/- buttons)
   - [ ] Totals calculate correctly

3. **Review and Submission**
   - [ ] Review Order page displays all information
   - [ ] Confirmation modal appears in Vietnamese
   - [ ] Order saves to database
   - [ ] Slack notification received

4. **Database Verification**
   - [ ] Check orders table for new record
   - [ ] Verify order_items table has line items
   - [ ] Confirm data integrity

### Troubleshooting

**Database Connection Errors**
- Verify `DATABASE_URL` or Supabase credentials in environment variables
- Check database server is running (on-premise)
- Verify firewall allows database connections

**Slack Notifications Not Working**
- Verify `SLACK_WEBHOOK_URL` is correct
- Test webhook URL directly with curl
- Check Slack app permissions

**Products Not Loading**
- Check API route `/api/products` returns data
- Verify database has product records
- Check browser console for errors

---

## Monitoring and Logs

### On-Premise

\`\`\`bash
# View PM2 logs
pm2 logs order-entry-app

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
\`\`\`

### Cloud (Vercel)

- Go to your project in Vercel Dashboard
- Click "Deployments" → Select latest deployment
- Click "Functions" to view serverless function logs
- Check Supabase logs in Supabase Dashboard → Logs

---

## Backup Strategy

### On-Premise

\`\`\`bash
# Automated daily backup script
pg_dump -U order_app_user order_entry_db > backup_$(date +%Y%m%d).sql

# Add to crontab for daily backups
0 2 * * * /path/to/backup_script.sh
\`\`\`

### Cloud (Supabase)

- Supabase automatically backs up your database daily (free tier: 7 days retention)
- Upgrade to Pro for point-in-time recovery

---

## Security Best Practices

1. **Always use HTTPS** (Let's Encrypt for on-premise, automatic on Vercel)
2. **Never commit `.env.local`** to version control
3. **Use strong database passwords** (minimum 16 characters)
4. **Regularly update dependencies**: `npm audit fix`
5. **Enable Row Level Security (RLS)** in Supabase for additional protection
6. **Rotate Slack webhook URLs** if compromised
7. **Monitor access logs** regularly

---

## Support

For deployment issues:
- **On-Premise**: Check server logs and PostgreSQL logs
- **Cloud**: Check Vercel function logs and Supabase dashboard
- **General**: Refer to Next.js 16 documentation at nextjs.org
