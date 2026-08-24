// ============================================
// Common API JSON Schemas
// Defines standard response structures across the API
// ============================================

/** Standard API success wrapper schema */
const standardSuccessSchema = {
    type: 'object',
    required: ['success', 'message'],
    properties: {
        success: { type: 'boolean', const: true },
        message: { type: 'string' },
        data: { type: ['object', 'array', 'null'] },
    },
    additionalProperties: true,
};

/** Standard API error wrapper schema (400, 422, 401, 404, 500) */
const standardErrorSchema = {
    type: 'object',
    required: ['message'],
    properties: {
        success: { type: 'boolean', const: false },
        message: { type: 'string' },
        errors: { type: ['object', 'array', 'null'] },
        statusCode: { type: 'integer' },
    },
    additionalProperties: true,
};

/** Standard Paginated Response Schema */
const standardPaginationSchema = {
    type: 'object',
    required: ['success', 'data'],
    properties: {
        success: { type: 'boolean', const: true },
        message: { type: 'string' },
        data: {
            type: 'array',
            items: { type: 'object' },
        },
        pagination: {
            type: 'object',
            properties: {
                currentPage: { type: 'integer' },
                totalPages: { type: 'integer' },
                totalCount: { type: 'integer' },
                hasMore: { type: 'boolean' },
            },
        },
    },
};

module.exports = {
    standardSuccessSchema,
    standardErrorSchema,
    standardPaginationSchema,
};
