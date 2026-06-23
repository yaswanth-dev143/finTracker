# FinTracker Frontend

React SPA for the Financial Tracker MVP. Built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## Setup

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` (proxy `/api` → `http://localhost:3001`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard with budget summary, groups, categories, and budget health |
| `/months` | Month management (create, copy, delete) |
| `/months/:monthId` | Dashboard scoped to a specific month |
| `/groups/:groupId` | Group detail with category breakdown |
| `/categories/:categoryId` | Category detail with weekly trend and transactions |

## Key Dependencies

- **react-router-dom** — Client-side routing
- **lucide-react** — Icons
- **recharts** — Charts (importable for pie/bar charts)
- **clsx** — Conditional CSS classes
- **tailwindcss** — Utility-first CSS

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx           # App shell with nav + dark mode toggle
│   └── TransactionModal.tsx # Shared modal for create/edit transactions
├── pages/
│   ├── Dashboard.tsx        # Main dashboard view
│   ├── Months.tsx           # Month CRUD management
│   ├── GroupDetail.tsx      # Single group breakdown
│   └── CategoryDetail.tsx   # Single category with transaction log
├── types/index.ts           # Shared TypeScript interfaces
└── utils/api.ts             # Typed fetch wrapper for all endpoints
```

## Features

- **Dark mode** — Toggle in header, persisted to `localStorage`
- **Responsive** — Mobile hamburger nav, card grid adapts to screen size
- **Empty states** — Prompts when no months, groups, categories, or transactions exist
- **Budget health** — Groups color-coded as Within Budget / Near Limit (80%+) / Over Budget
