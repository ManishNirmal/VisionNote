# Vision Note

A web application for annotating vision data with authentication powered by Clerk.

## Features

- User authentication (Sign up / Sign in) with Clerk
- Protected dashboard route
- Data collection interface with:
  - Image display area (ready for API integration)
  - Quill rich text editor with full formatting capabilities
  - Navigation controls (Previous/Next)
  - Action buttons (Save/Publish)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Clerk account (sign up at https://clerk.com)

### Setup Instructions

1. **Get your Clerk API keys:**
   - Go to https://clerk.com and sign in
   - Create a new application
   - Go to "API Keys" in the dashboard
   - Copy your Publishable Key and Secret Key

2. **Configure environment variables:**
   - Open `.env.local` in the project root
   - Replace the placeholder values with your actual Clerk keys:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     ```

3. **Install dependencies (if not already done):**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to http://localhost:3000
   - You should see the landing page with Sign In and Sign Up buttons

## Project Structure

```
data-collector/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Protected dashboard page
│   ├── sign-in/
│   │   └── page.tsx          # Sign in page
│   ├── sign-up/
│   │   └── page.tsx          # Sign up page
│   ├── layout.tsx            # Root layout with ClerkProvider
│   └── page.tsx              # Landing page with auth redirect
├── middleware.ts             # Clerk middleware for route protection
├── .env.local               # Environment variables (Clerk keys)
└── README.md                # This file
```

## Authentication Flow

1. Users land on the home page (`/`)
2. If not authenticated, they see Sign In and Sign Up buttons
3. If already authenticated, they're automatically redirected to `/dashboard`
4. After signing in/up, users are redirected to `/dashboard`
5. The dashboard is protected - unauthenticated users can't access it

## Next Steps

### Implement Image Fetching
The dashboard currently shows a placeholder for images. To integrate your image API:

1. Create an API route or use an external API
2. Fetch images in the dashboard component
3. Display images in the left section
4. Implement pagination with Previous/Next buttons

### Implement Save and Publish
The Save and Publish buttons are ready for your implementation:

1. Create API endpoints to save and publish data
2. Connect the buttons to your backend
3. Handle success/error states
4. Add loading indicators

### Database Integration
To persist user data:

1. Set up a database (PostgreSQL, MongoDB, etc.)
2. Create tables/collections for your data model
3. Implement API routes for CRUD operations
4. Connect the dashboard to your database

## Technologies Used

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Quill Rich Text Editor
- React
- Lucide React (Icons)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Quill Documentation](https://quilljs.com/docs/quickstart/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
