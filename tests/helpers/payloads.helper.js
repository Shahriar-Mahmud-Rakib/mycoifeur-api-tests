/**
 * Payload Dictionary for Exhaustive API Testing
 * Includes boundary values, data type mutations, and security injection payloads.
 */

// 1. Validation & Boundary Value Payloads
const validationPayloads = {
    emptyStrings: { val: '', desc: 'Empty String' },
    nullValue: { val: null, desc: 'Null Value' },
    undefinedValue: { val: undefined, desc: 'Undefined Value' },
    massiveString: { val: 'A'.repeat(5000), desc: '5000 Char String' },
    negativeNumber: { val: -100, desc: 'Negative Number' },
    zeroValue: { val: 0, desc: 'Zero' },
    massiveNumber: { val: 999999999999999, desc: 'Massive Number' },
    booleanTrue: { val: true, desc: 'Boolean True (wrong type)' },
    booleanFalse: { val: false, desc: 'Boolean False (wrong type)' },
    invalidEmail: { val: 'invalid-email-format', desc: 'Invalid Email Format' },
    invalidPhone: { val: '+123', desc: 'Invalid Short Phone' },
};

// 2. Security Injection Vectors
const securityPayloads = {
    sqlInjection1: { val: "' OR '1'='1", desc: 'SQLi Boolean Base' },
    sqlInjection2: { val: "admin' --", desc: 'SQLi Comment' },
    sqlInjection3: { val: "1; DROP TABLE users", desc: 'SQLi Dropper' },
    xssBasic: { val: "<script>alert('XSS')</script>", desc: 'XSS Basic Script' },
    xssImg: { val: "<img src=x onerror=alert(1)>", desc: 'XSS Image Error' },
    htmlInjection: { val: "<h1>Inject</h1>", desc: 'HTML Injection' },
    noSqlInjection1: { val: { "$ne": null }, desc: 'NoSQLi Not Equal' },
    noSqlInjection2: { val: { "$gt": "" }, desc: 'NoSQLi Greater Than' }
};

// 3. Unauthorized Tokens (for RBAC Testing)
const invalidAuthHeaders = [
    { name: 'Missing Header', headers: { 'x-app-version': '1.1.9' } },
    { name: 'Invalid Token', headers: { 'Authorization': 'Bearer invalid_token_123', 'x-app-version': '1.1.9' } },
    { name: 'Expired Token Format', headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', 'x-app-version': '1.1.9' } }
];

module.exports = {
    validationPayloads,
    securityPayloads,
    invalidAuthHeaders
};
