# SuiviVente - Sales Tracking Application

A modern sales and inventory management application built with React, TypeScript, and Supabase.

## 🚀 Features

- **Dashboard**: Real-time sales analytics and metrics
- **Sales Management**: Track and manage sales transactions
- **Inventory Control**: Monitor stock levels and product information
- **Data Import/Export**: Excel and CSV file handling
- **User Authentication**: Role-based access control
- **Admin Panel**: System administration and user management

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Netlify

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Netlify account (for deployment)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd suiviventev1
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the SQL migrations in the Supabase SQL editor:
   - Execute `supabase/migrations/20250606214606_pink_darkness.sql`
   - Execute `supabase/migrations/20250606214619_bright_summit.sql`
   - Execute `supabase/migrations/20250606220658_round_snowflake.sql`

### 3. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Netlify Deployment

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 🔐 Authentication

The application uses Supabase Auth with the following default users:

- **Admin**: Use Supabase dashboard to create admin users
- **Regular Users**: Sign up through the application

## 📊 Database Schema

### Tables

- **sales**: Sales transactions with product details
- **products**: Product inventory and pricing information  
- **logs**: System activity and audit trail

### Security

- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Admin-only operations for sensitive data

## 🚀 Deployment

The application is configured for automatic deployment on Netlify:

- Push to main branch triggers new build
- Environment variables configured in Netlify dashboard
- Redirects configured for SPA routing

## 📝 Migration from Dexie

This application was migrated from Dexie (IndexedDB) to Supabase. The database schema maintains compatibility while adding cloud synchronization and multi-user support.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.