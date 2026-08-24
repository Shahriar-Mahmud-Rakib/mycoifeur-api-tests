// =======================================================
// Clean & Rich Allure Report Generator
// =======================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT_DIR, 'allure-results');
const REPORT_DIR = path.join(ROOT_DIR, 'allure-report');

// 1. Ensure allure-results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

console.log('🚀 [1/3] Adding Environment & Defect Categories to allure-results...');

// 2. Write environment.properties
const envProperties = `
Application.Name=MyCoifeur API Platform
Target.Environment=AWS Cloud (ap-southeast-5)
Base.URL=https://zk2a6jfr01.execute-api.ap-southeast-5.amazonaws.com
Payment.Gateway=Tap Payments (SAR - KSA/GCC)
Test.Framework=Playwright v1.60.0 (Node.js)
Default.Platform=Android / iOS / Web API
App.Version=1.1.9
Generated.At=${new Date().toISOString()}
`.trim();

fs.writeFileSync(path.join(RESULTS_DIR, 'environment.properties'), envProperties);

// 3. Write categories.json (Clear and readable defect categorization)
const categories = [
    {
        name: "🔥 Server Exceptions & 500 Errors",
        matchedStatuses: ["failed", "broken"],
        messageRegex: ".*500.*"
    },
    {
        name: "🔒 Authentication & Authorization Failures (401 / 403)",
        matchedStatuses: ["failed", "broken"],
        messageRegex: ".*(401|403|unauthorized|forbidden|jwt|token).*"
    },
    {
        name: "⚠️ Data & Validation Errors (400 / 422)",
        matchedStatuses: ["failed"],
        messageRegex: ".*(400|422|validation|invalid|missing).*"
    },
    {
        name: "🔍 Endpoint / Record Not Found (404)",
        matchedStatuses: ["failed"],
        messageRegex: ".*404.*"
    },
    {
        name: "⏱️ Timeouts & Performance SLA Issues",
        matchedStatuses: ["failed", "broken"],
        messageRegex: ".*(timeout|slow|elapsed|timed out|exceeded).*"
    }
];

fs.writeFileSync(path.join(RESULTS_DIR, 'categories.json'), JSON.stringify(categories, null, 2));

// 4. Write executor.json
const executor = {
    name: "MyCoifeur API Automation Engine",
    type: "Playwright",
    reportName: "MyCoifeur API Automation Detailed Report",
    url: "https://zk2a6jfr01.execute-api.ap-southeast-5.amazonaws.com",
    buildName: "MyCoifeur-v1.1.9",
    buildOrder: Date.now()
};

fs.writeFileSync(path.join(RESULTS_DIR, 'executor.json'), JSON.stringify(executor, null, 2));

// 5. Generate Allure Report (Native Clean Official Theme)
console.log('📊 [2/3] Generating Clean Official Allure Report...');
try {
    execSync('npx allure generate ./allure-results --clean -o ./allure-report', {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });
    // 6. Add .nojekyll for GitHub Pages to disable Jekyll and serve SPA HTML directly
    fs.writeFileSync(path.join(REPORT_DIR, '.nojekyll'), '');
} catch (e) {
    console.error('❌ Error executing allure generate:', e.message);
    process.exit(1);
}

console.log('✨ [3/3] Allure Report generated successfully with full details & clean theme!');
console.log('🌐 Run "npm run allure:open" to open the report.');


