# MyCoifeur API Automation Test Suite

## 🚀 Test Run করার নিয়ম

> ✅ **সবসময় `d:\SQA\My Coifeur` folder থেকে run করুন**

### সব Tests একসাথে:
```bash
npx playwright test
```

### Category অনুযায়ী:
```bash
npm run test:auth      # Authentication tests
npm run test:user      # User API tests
npm run test:guest     # Public/Guest API tests
npm run test:salon     # Salon Provider tests
npm run test:admin     # Admin panel tests
npm run test:exhaustive # Project-Wide Exhaustive Tests (1140 cases)
npm run test:advanced  # Controlled Architectural/Infrastructure Tests (6 cases)
npm run test:web       # Frontend Web UI Tests (Admin Login, etc.)
```

### নির্দিষ্ট একটি file:
```bash
npx playwright test tests/login.spec.js
npx playwright test tests/cart.spec.js
```

### HTML Report সহ:
```bash
npx playwright test --reporter=html
```

### Report browser-এ দেখতে:
```bash
npx playwright show-report
```
