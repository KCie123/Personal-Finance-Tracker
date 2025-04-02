# Personal Finance Tracker

This project is a **React and Node.js-based Personal Finance Tracker** application designed to help users manage their income, expenses, budgets, and overall financial picture. It provides a clear dashboard overview, allows manual transaction entry, supports category-based and ratio-based budgeting, and visualizes spending patterns. The project focuses on a clean user interface, real-time feedback (via WebSockets), and actionable financial insights.

## Project Description

The **Personal Finance Tracker** application aims to make personal finance management intuitive and insightful. It combines a clean UI with essential tracking and budgeting tools to empower users to understand and control their financial health.

### Key Features:
- **Dashboard Overview:** Displays key financial snapshots like Net Worth, Account Balances, and Recent Transactions.
- **Manual Transaction Entry:** Allows users to manually add income and expense transactions with details like date, description, amount, category, and account.
- **Account Tracking:** Users can monitor balances across different accounts (e.g., Checking, Savings).
- **Category Budgeting:** Set monthly spending targets for different categories (e.g., Food, Shopping) and track progress with visual bars.
- **Ratio Budgeting (Needs/Wants/Savings):** Classify expenses into Needs, Wants, or Savings and visualize spending against target ratios (e.g., 50/30/20).
- **Spending Visualization:** Includes a donut chart showing spending breakdown by category for the current month.
- **Real-time Updates (via WebSockets):** Core data displays can update in near real-time as changes occur (though full implementation might be pending).
- **Responsive Design:** Aims for adaptability across different screen sizes.

## Technologies Used:
- **Frontend:**
    - **React:** JavaScript library for building the user interface.
    - **TypeScript:** For type safety and improved developer experience.
    - **Tailwind CSS:** Utility-first CSS framework for styling.
    - **Recharts:** Charting library for visualizations (Spending Breakdown chart).
    - **socket.io-client:** For real-time communication with the backend.
- **Backend:**
    - **Node.js:** JavaScript runtime environment.
    - **Express:** Web framework for building the REST API and handling requests.
    - **PostgreSQL:** Relational database for storing user data (accounts, transactions, budgets).
    - **pg (node-postgres):** PostgreSQL client library for Node.js.
    - **Socket.IO:** Enables real-time, bidirectional communication between client and server.
    - **dotenv:** Loads environment variables from a `.env` file.
    - **cors:** Middleware for enabling Cross-Origin Resource Sharing.
- **Development:**
    - **nodemon:** Utility to automatically restart the backend server during development.
    - **Create React App:** Toolchain for bootstrapping the React frontend.

## How to Install and Run the Project

### Prerequisites
- **Node.js** (version 16.x or higher recommended)
- **npm** (usually comes with Node.js)
- **PostgreSQL** server installed and running
- A PostgreSQL database created (e.g., `finance_tracker`) and a user with access privileges.

### Steps

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd personal-finance-tracker/backend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and configure your database connection details:
   ```dotenv
   # backend/.env Example
   PORT=4000 # Or another port for the backend server
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=finance_tracker
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   ```
4. Set up the database tables: Connect to your PostgreSQL database (`finance_tracker`) using `psql` or a GUI tool and run the SQL commands provided earlier in the chat/documentation to create the `accounts`, `transactions`, and `budgets` tables.
5. Run the backend development server:
   ```bash
   npm run dev # (if nodemon is configured in package.json scripts)
   # OR
   npx nodemon server.js
   # OR just node server.js for a single run
   ```
   The backend server should start (e.g., on port 4000) and connect to the database.

#### Frontend Setup
1. Open a **new terminal** and navigate to the frontend directory:
   ```bash
   cd personal-finance-tracker/frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Run the frontend development server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000` (or the port specified by Create React App).

## Project Structure
```
personal-finance-tracker/
│
├── backend/ # Node.js/Express Backend
│ ├── node_modules/
│ ├── routes/ # API route handlers (accounts, transactions, budgets)
│ │ ├── accounts.js
│ │ ├── transactions.js
│ │ └── budgets.js
│ ├── .env # Environment variables (DB connection, port) - Not committed
│ ├── package.json
│ ├── package-lock.json
│ └── server.js # Main Express server setup
│
├── frontend/ # React Frontend
│ ├── node_modules/
│ ├── public/ # Static assets (index.html, icons)
│ ├── src/ # React source code
│ │ ├── components/ # UI components
│ │ │ ├── Dashboard/
│ │ │ │ ├── Dashboard.tsx
│ │ │ │ └── SpendingChart.tsx
│ │ │ ├── Budgeting/
│ │ │ │ ├── BudgetList.tsx
│ │ │ │ └── RatioBudgetDisplay.tsx
│ │ │ └── AddTransactionModal.tsx
│ │ ├── App.css # Minimal global styles
│ │ ├── App.tsx # Main application component/layout
│ │ ├── index.css # Tailwind directives, base styles
│ │ ├── index.tsx # React entry point
│ │ └── types.ts # TypeScript interfaces (Account, Transaction, etc.)
│ ├── .env.development # API URL for local dev
│ ├── .env.production # API URL for deployed build
│ ├── package.json
│ ├── package-lock.json
│ ├── tailwind.config.js # Tailwind configuration
│ └── tsconfig.json # TypeScript configuration
│
└── .gitignore # Specifies intentionally untracked files
└── README.md # This file
```

## Component/Module Descriptions

### Frontend (`src/`)

#### `App.tsx`
- Serves as the root component, setting up the main layout (header, main content area).
- Initializes the WebSocket connection to the backend.
- Renders the `Dashboard` component.

#### `components/Dashboard/Dashboard.tsx`
- The main view of the application.
- Fetches accounts and transactions data from the backend API.
- Manages loading and error states for data fetching.
- Renders various dashboard sections (Net Worth, Balances, Quick Actions, etc.).
- Renders child components like `SpendingChart`, `BudgetList`, `RatioBudgetDisplay`, and `AddTransactionModal`.
- Calculates overall metrics like Net Worth.
- Handles opening/closing the transaction modal and refreshing data.

#### `components/Dashboard/SpendingChart.tsx`
- **Props:** `data` (processed spending data by category).
- Uses `Recharts` to display a Donut chart visualizing spending breakdown for the current month.
- Includes custom labels and tooltips.

#### `components/AddTransactionModal.tsx`
- **Props:** `isOpen`, `onClose`, `onTransactionAdded`, `accounts`, `transactionToEdit`.
- Provides a form within a modal for adding new transactions or editing existing ones.
- Handles user input for description, amount, date, category, account, and ratio category.
- Submits data to the backend API (`POST` or `PUT /api/transactions`).
- Performs basic validation and displays errors.

#### `components/Budgeting/BudgetList.tsx`
- Fetches budget data (categories, budgeted amounts, actual spending) from the backend API (`GET /api/budgets`).
- Displays each budget category with its progress towards the budgeted amount using a `ProgressBar` sub-component.
- Shows spent vs budgeted amounts and remaining/overspent value.
- Includes an `AddBudgetForm` sub-component to create new budget categories.
- Handles editing budget amounts and deleting budget categories.

#### `components/Budgeting/RatioBudgetDisplay.tsx`
- **Props:** `transactions`, `isLoading`, `error`.
- Calculates the spending breakdown for Needs, Wants, and Savings based on the `ratio_category` assigned to transactions for the current month.
- Calculates total income for the month to establish percentages.
- Displays the actual spending vs target ratios (50/30/20) using `RatioProgressBar` sub-components.

#### `types.ts`
- Defines shared TypeScript interfaces for data structures like `Account`, `Transaction`, `BudgetData`.

### Backend (`backend/`)

#### `server.js`
- Initializes the Express application and HTTP server.
- Sets up middleware (CORS, JSON parsing).
- Establishes the PostgreSQL database connection pool.
- Configures and initializes Socket.IO for real-time communication.
- Mounts the API route handlers from the `routes/` directory.
- Starts the server listening on the configured port.

#### `routes/accounts.js`
- Defines API endpoints related to accounts (e.g., `GET /api/accounts` to fetch all accounts).
- Interacts with the `accounts` table in the database.
- (Currently missing POST/PUT/DELETE implementations).

#### `routes/transactions.js`
- Defines API endpoints for transactions:
  - `GET /api/transactions`: Fetch recent transactions (joined with account names).
  - `POST /api/transactions`: Add a new transaction, updating the relevant account balance within a database transaction.
  - `PUT /api/transactions/:id`: Update an existing transaction, correctly adjusting old and new account balances within a database transaction.
  - `DELETE /api/transactions/:id`: Delete a transaction, reverting its impact on the account balance within a database transaction.
- Interacts with `transactions` and `accounts` tables.

#### `routes/budgets.js`
- Defines API endpoints for budgets:
  - `GET /api/budgets`: Fetch all budget categories along with calculated actual spending for the current month.
  - `POST /api/budgets`: Create a new budget category.
  - `PUT /api/budgets/:id`: Update the amount for an existing budget category.
  - `DELETE /api/budgets/:id`: Delete a budget category.
- Interacts with `budgets` and `transactions` tables.

## Features in Detail

### Dashboard & Visualization
- **Net Worth Calculation:** Sums balances across accounts (treating credit accounts appropriately).
- **Account Balances:** Lists current balances for configured accounts.
- **Recent Transactions:** Shows a filterable/paginated list of recent income/expenses with details.
- **Spending Chart:** Provides an immediate visual breakdown of expense categories for the current month using a Donut chart.

### Transaction Management
- **Manual Entry:** A clear modal form allows adding detailed transaction information.
- **Editing:** Existing transactions can be modified via the same modal.
- **Deletion:** Transactions can be removed with confirmation.
- **Balance Adjustments:** Backend logic ensures account balances are correctly updated when transactions are added, edited, or deleted.

### Budgeting System
- **Category Budgets:** Users define monthly spending limits for custom categories. Progress bars visually track spending against these limits, changing color (green/yellow/red) based on status.
- **Ratio Budgeting (50/30/20):** Expenses can be optionally classified as Needs, Wants, or Savings. A dedicated display shows the percentage of monthly income/spending allocated to each ratio category compared to common targets.
