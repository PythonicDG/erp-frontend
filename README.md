# Project Workflow Management System - Frontend

This is the Next.js frontend for the Project Workflow Management System.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API Communication**: Fetch API (Service wrapper in `src/services/api.ts`)

## Folder Structure
- `src/app`: Routes and Pages
- `src/components`: Reusable UI components
- `src/hooks`: Custom React hooks
- `src/services`: API services
- `src/lib`: Utility functions and third-party library configs
- `src/types`: TypeScript interfaces/types

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in the details.
   ```bash
   cp .env.example .env.local
   ```
4. **Run Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Key Features
- **Modern UI**: Built with Tailwind CSS for a premium look.
- **Type Safety**: Full TypeScript support.
- **Fast Routing**: Next.js 15 App Router.
