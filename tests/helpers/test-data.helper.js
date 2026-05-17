// ============================================
// Shared Test Data Helper - MyCoifeur API Tests
// ============================================
// Security payloads, boundary values, invalid types
// for comprehensive negative, security & boundary testing.
// ============================================

// ---------- SQL Injection Payloads ----------
const SQL_INJECTION_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1--",
    "'; DROP TABLE users;--",
    "' UNION SELECT username,password FROM users--",
    "1' AND SLEEP(3)--",
    "admin'--",
    "' OR 'x'='x",
    "\" OR \"\"=\"",
    "1; SELECT * FROM information_schema.tables",
];

// ---------- XSS Payloads ----------
const XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '"><script>alert(1)</script>',
    "javascript:alert('XSS')",
    '<img src=x onerror=alert(1)>',
    '<svg/onload=alert(1)>',
    '{{constructor.constructor("alert(1)")()}}',
    '"><img src=x onerror=alert(document.cookie)>',
];

// ---------- Boundary Values ----------
const BOUNDARY = {
    EMPTY_STRING: '',
    SINGLE_CHAR: 'a',
    TWO_CHARS: 'ab',
    MAX_STRING_255: 'a'.repeat(255),
    MAX_STRING_1000: 'a'.repeat(1000),
    LONG_EMAIL: `${'a'.repeat(240)}@example.com`,   // > 254 char RFC limit
    SHORT_PASSWORD: '12345',                          // under typical min 6
    MIN_PASSWORD: '123456',                           // exactly 6 chars
    LONG_PASSWORD: 'Password1!'.repeat(100),          // 1000 chars
    NEGATIVE_NUMBER: -1,
    ZERO: 0,
    LARGE_NUMBER: 999999999,
    FLOAT_NUMBER: 1.5,
    UNICODE_STRING: '日本語テスト 아랍어 العربية',
    SPECIAL_CHARS: "!@#$%^&*()_+{}[]|:;\"'<>?,./`~",
    WHITESPACE_ONLY: '   ',
    NEWLINE_STRING: 'test\ninjection',
    NULL_BYTE: 'test\x00null',
};

// ---------- Invalid Data Types ----------
const INVALID_TYPES = {
    NUMBER_AS_EMAIL: 12345,
    ARRAY_AS_STRING: ['test', 'array'],
    OBJECT_AS_STRING: { key: 'value' },
    BOOLEAN_AS_STRING: true,
    NULL_VALUE: null,
};

// ---------- Fake / Invalid Tokens ----------
const INVALID_TOKENS = {
    COMPLETELY_INVALID: 'invalid-token-xyz',
    MALFORMED_JWT: 'eyJhbGciOiJIUzI1NiJ9.invalid.payload',
    EMPTY: '',
    // A structurally valid but expired/fake JWT
    FAKE_JWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
              '.eyJzdWIiOiI5OTk5OTkiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0' +
              '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    SQL_INJECT: "' OR 1=1--",
    XSS: '<script>alert(1)</script>',
    NUMERIC: 123456,
    TOO_SHORT: 'abc',
    BEARER_MISSING: 'eyTokenWithoutBearer',
};

// ---------- Fake / Non-existent IDs ----------
const FAKE_IDS = {
    NON_EXISTENT: 999999999,
    NEGATIVE: -1,
    ZERO: 0,
    STRING_ID: 'abc',
    SQL: "1; DROP TABLE services",
    XSS: '<script>alert(1)</script>',
    FLOAT: 1.9,
};

// ---------- Pagination Edge Cases ----------
const PAGINATION_EDGE = {
    PAGE_ZERO: 0,
    PAGE_NEGATIVE: -1,
    PAGE_LARGE: 9999,
    PAGE_STRING: 'abc',
    LIMIT_ZERO: 0,
    LIMIT_NEGATIVE: -1,
    LIMIT_LARGE: 10000,
    LIMIT_FLOAT: 1.5,
    LIMIT_STRING: 'all',
};

// ---------- File Upload Edge Cases ----------
const FILE_UPLOAD = {
    INVALID_MIME: 'text/plain',
    VALID_MIME: 'image/jpeg',
    MAX_SIZE_MB: 10,
    INVALID_EXT: '.exe',
    VALID_EXT: '.jpg',
};

module.exports = {
    SQL_INJECTION_PAYLOADS,
    XSS_PAYLOADS,
    BOUNDARY,
    INVALID_TYPES,
    INVALID_TOKENS,
    FAKE_IDS,
    PAGINATION_EDGE,
    FILE_UPLOAD,
};
