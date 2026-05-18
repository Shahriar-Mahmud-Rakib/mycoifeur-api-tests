# 🚀 Universal Playwright API & UI Automation Boilerplate

A production-grade, highly scalable, and database-integrated automation testing framework built with **Playwright**, **JavaScript**, and **PostgreSQL**.

---

## 🌟 Why This Framework?

This repository is designed to be a **Universal Boilerplate** for testing **any** REST API or Web Application. Instead of hardcoding URLs and credentials, everything is fully decoupled via environment variables (`.env`).

### 🔥 Key Features:
- 🌐 **Dynamic Base URLs**: Switch effortlessly between Dev, Staging, and Production APIs.
- 🔌 **PostgreSQL Integration**: Bypass third-party SMS/Email gateways by fetching OTP codes and verification states directly from PostgreSQL in real-time.
- 🛡️ **Comprehensive Security Suite**: Automated SQL Injection (SQLi), Cross-Site Scripting (XSS), and Brute-Force attack validation built-in.
- 👥 **Role-Based Access Control (RBAC)**: Ensure User tokens cannot access Admin endpoints and vice versa.
- 🧹 **Self-Cleaning Database**: Includes a `global.teardown.js` hook to automatically remove test data after execution so your database stays pristine.
- 🤖 **CI/CD Ready**: Includes GitHub Actions configuration (`.github/workflows/playwright.yml`) for instant automated cloud testing on Push and PR.

---

## 🛠️ Quick Start Guide

### 1. Clone & Install
```bash
git clone https://github.com/Shahriar-Mahmud-Rakib/mycoifeur-api-tests.git your-api-project
cd your-api-project
npm install
```

### 2. Configure Environment (`.env`)
Copy the boilerplate example configuration:
```bash
cp .env.example .env
```
Open `.env` and fill in your target project credentials:
```env
BASE_URL=https://api.yourdomain.com

# PostgreSQL Connection (For DB Hooks)
DB_HOST=127.0.0.1
DB_PORT=1234
DB_NAME=your_db_name
DB_USER=your_user
DB_PASSWORD=your_password

# Test Cleanup Behavior
CLEAN_TEST_DATA=true
CI=false
```

---

## 🚦 How to Run the Tests

> ✅ **Always execute commands from the project root folder.**

### Run All Tests (960+ Cases):
```bash
npx playwright test
```

### Run by Specific Domain / Module:
```bash
npm run test:auth       # Authentication API tests
npm run test:user       # User API tests
npm run test:guest      # Public/Guest API tests
npm run test:salon      # Salon Provider tests
npm run test:admin      # Admin panel tests
npm run test:exhaustive # Project-Wide Exhaustive Swagger Tests (1140 cases)
npm run test:advanced   # Controlled Architectural & Infrastructure Tests (6 cases)
npm run test:web        # Frontend Web UI Tests (Admin Dashboard Login, etc.)
npm run test:stress     # API Stress & Load Performance Tests
```

### Run a Specific Spec File:
```bash
npx playwright test tests/login.spec.js
```

### Generate & View HTML Report:
```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## 🏗️ Framework Structure

```text
├── .github/workflows/
│   └── playwright.yml         # GitHub Actions CI/CD Pipeline
├── tests/
│   ├── helpers/
│   │   ├── auth.helper.js     # Shared Auth tokens & Axios/Playwright headers
│   │   └── test-data.helper.js# Dynamic payload generators
│   ├── e2e-*.spec.js          # Full Database-Integrated Circle Tests
│   ├── security.spec.js       # SQLi and XSS Test Suite
│   └── global.teardown.js     # DB Cleanup after execution
├── .env.example               # Environment template
├── playwright.config.js       # Playwright runner configuration
└── README.md                  # This documentation
```

---

## 💡 Pro-Tips for QA Engineers
- **Preserving Test Data**: By default, local test data is preserved for manual inspection in DBeaver/Postman. If you want local tests to delete test data automatically after running, run:
  ```powershell
  $env:CLEAN_TEST_DATA="true"; npx playwright test
  ```
- **Adding New Endpoints**: Use the dynamic payload generators in `test-data.helper.js` (which append timestamps) to ensure your test inputs never collide with existing records!
