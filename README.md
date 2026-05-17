# MyCoifeur API & UI Automation Test Suite

## 🚀 How to Run the Tests

> ✅ **Always execute commands from the project root folder: `d:\SQA\My Coifeur`**

### Run All Tests Together:
```bash
npx playwright test
```

### Run by Categories / Specific Modules:
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

### Run a Specific File:
```bash
npx playwright test tests/login.spec.js
npx playwright test tests/ui/admin-login-ui.spec.js
```

### Run Tests and Generate HTML Report:
```bash
npx playwright test --reporter=html
```

### Show Interactive HTML Report in Browser:
```bash
npx playwright show-report
```
