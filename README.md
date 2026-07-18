# FinanceIQ

## Overview

FinanceIQ is a dynamic, client-side personal finance management web application built using Vanilla JavaScript, HTML5, and CSS3. Integrated with Firebase for secure user authentication and cloud data management, the platform enables real-time expense tracking, interactive monthly budgeting, savings goal management, and data visualization.

---

## Features

- **Authentication:** Secure sign-up and login functionality using Firebase Authentication.
- **Dashboard Summary:** A centralized overview displaying total expenses, active budget, total savings, and recent transactions.
- **Expense Management:** Add, edit, and delete transactions with assigned categories, amounts, and dates.
- **Smart Search & Filters:** Instantly filter transaction history by text search, specific category, or month.
- **Dynamic Categories:** Add new custom expense categories or delete existing ones, managed globally across the application.
- **Budget Planning:** Set a monthly budget and track spending with a dynamic progress bar that changes color (green, yellow, red) as the budget limit is approached or exceeded.
- **Savings Goals:** Create and track financial goals with target amounts, current saved amounts, and deadlines.
- **Interactive Reports:** Visualize spending patterns using Chart.js, featuring a category-based pie chart and a monthly spending bar chart.
- **Dark Mode:** A built-in dark theme toggle that persists the user's preference across sessions via local storage.
- **Responsive Design:** A mobile-friendly layout utilizing Bootstrap, featuring a collapsible sidebar menu for smaller screens.

---

## Tech Stack & Libraries

**Core Languages**

- HTML5
- CSS3
- Vanilla JavaScript (ES6 Modules)

**Backend & Database**

- **Firebase (v10.7.1):** Utilizes Firebase Authentication for user management and Firestore for flattened, scalable CRUD data storage.

**Frameworks & Libraries**

- **Bootstrap 5.3:** Used for the responsive grid system, cards, inputs, and progress bars.
- **Chart.js:** Powers the interactive pie and bar charts in the reports section.
- **SweetAlert2:** Handles elegant, interactive popups for managing categories.
- **Font Awesome 6.5:** Provides the vector icons used throughout the UI and sidebar navigation.

---

## Setup & Configuration (Prerequisite)

Before running the application, you must provide your own Firebase configuration keys.

1. Open your terminal in the root folder of the project.
2. Create your local config file by copying the example template:
   ```bash
   cp js/config.example.js js/config.js
   ```

## How to Use / Run Locally

Because this project uses ES6 JavaScript modules (`<script type="module">`) to import Firebase SDKs, it **cannot** be run by simply double-clicking the `index.html` file in your file explorer. It must be served over a local HTTP server.

Follow either of the methods below to run the project locally.

### Method 1: Using VS Code "Live Server" Extension (Recommended)

This is the easiest method if you are using Visual Studio Code as your code editor.

1. Install the **[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)** by Ritwick Dey in VS Code.
2. Open the extracted `FinanceIQ` project folder in VS Code.
3. Open the root `index.html` file in the editor.
4. Click the **"Go Live"** button located at the bottom right corner of your VS Code status bar.
5. The application will automatically open in your default browser (usually at `http://127.0.0.1:5500`).

### Method 2: Using Python 3 HTTP Server

If you have Python installed on your machine, you can run a local server directly from your terminal.

1. Open your terminal or command prompt.
2. Navigate into the root folder of the project using the `cd` command:
   ```bash
   cd path/to/FinanceIQ
   ```
3. Run the following built-in Python 3 command to start a local server:
   ```bash
   python3 -m http.server 8000
   ```
   _(Note: If you are on Windows, you might need to use `python -m http.server 8000`)_
4. Open your web browser and navigate to `http://localhost:8000`.
