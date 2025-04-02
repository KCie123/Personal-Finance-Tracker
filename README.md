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
