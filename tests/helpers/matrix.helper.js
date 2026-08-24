// ============================================
// Matrix & Corner-Case Data Generator Helper
// Automates generation of test cases for Required Fields, Boundary Values & Type Mismatches
// ============================================

const { BOUNDARY, INVALID_TYPES } = require('./test-data.helper');

/**
 * Generate test payloads missing one required field at a time
 * @param {Object} validBasePayload - A valid full payload
 * @param {string[]} requiredFields - List of required field keys
 * @returns {Array<{ field: string, payload: Object, description: string }>}
 */
function generateMissingFieldCases(validBasePayload, requiredFields = []) {
    return requiredFields.map(field => {
        const payload = { ...validBasePayload };
        delete payload[field];
        return {
            field,
            payload,
            description: `Missing required field: "${field}"`,
        };
    });
}

/**
 * Generate test payloads with empty / null / whitespace values
 * @param {Object} validBasePayload
 * @param {string[]} fieldsToTest
 * @returns {Array<{ field: string, type: string, payload: Object, description: string }>}
 */
function generateEmptyAndWhitespaceCases(validBasePayload, fieldsToTest = []) {
    const cases = [];
    for (const field of fieldsToTest) {
        // 1. Empty string
        cases.push({
            field,
            type: 'EMPTY_STRING',
            payload: { ...validBasePayload, [field]: BOUNDARY.EMPTY_STRING },
            description: `Empty string on field: "${field}"`,
        });

        // 2. Whitespace only
        cases.push({
            field,
            type: 'WHITESPACE_ONLY',
            payload: { ...validBasePayload, [field]: BOUNDARY.WHITESPACE_ONLY },
            description: `Whitespace-only on field: "${field}"`,
        });

        // 3. Null value
        cases.push({
            field,
            type: 'NULL_VALUE',
            payload: { ...validBasePayload, [field]: null },
            description: `Null value on field: "${field}"`,
        });
    }
    return cases;
}

/**
 * Generate test payloads with invalid data types for specified fields
 * @param {Object} validBasePayload
 * @param {Object<string, 'string'|'number'|'boolean'|'array'|'object'>} fieldTypeMap
 */
function generateInvalidTypeCases(validBasePayload, fieldTypeMap = {}) {
    const cases = [];
    for (const [field, expectedType] of Object.entries(fieldTypeMap)) {
        if (expectedType === 'string') {
            cases.push({
                field,
                value: INVALID_TYPES.NUMBER_AS_EMAIL,
                payload: { ...validBasePayload, [field]: INVALID_TYPES.NUMBER_AS_EMAIL },
                description: `Number instead of String on "${field}"`,
            });
            cases.push({
                field,
                value: INVALID_TYPES.ARRAY_AS_STRING,
                payload: { ...validBasePayload, [field]: INVALID_TYPES.ARRAY_AS_STRING },
                description: `Array instead of String on "${field}"`,
            });
            cases.push({
                field,
                value: INVALID_TYPES.OBJECT_AS_STRING,
                payload: { ...validBasePayload, [field]: INVALID_TYPES.OBJECT_AS_STRING },
                description: `Object instead of String on "${field}"`,
            });
        } else if (expectedType === 'number') {
            cases.push({
                field,
                value: 'non-numeric-string',
                payload: { ...validBasePayload, [field]: 'non-numeric-string' },
                description: `String instead of Number on "${field}"`,
            });
        }
    }
    return cases;
}

/**
 * Generate boundary string length cases (max length exceeded, unicode, etc.)
 */
function generateBoundaryCases(validBasePayload, stringFields = []) {
    const cases = [];
    for (const field of stringFields) {
        cases.push({
            field,
            type: 'MAX_STRING_1000',
            payload: { ...validBasePayload, [field]: BOUNDARY.MAX_STRING_1000 },
            description: `Exceeded length (1000 chars) on "${field}"`,
        });
        cases.push({
            field,
            type: 'SPECIAL_CHARS',
            payload: { ...validBasePayload, [field]: BOUNDARY.SPECIAL_CHARS },
            description: `Special characters on "${field}"`,
        });
        cases.push({
            field,
            type: 'UNICODE_STRING',
            payload: { ...validBasePayload, [field]: BOUNDARY.UNICODE_STRING },
            description: `Unicode/Non-ASCII characters on "${field}"`,
        });
    }
    return cases;
}

module.exports = {
    generateMissingFieldCases,
    generateEmptyAndWhitespaceCases,
    generateInvalidTypeCases,
    generateBoundaryCases,
};
