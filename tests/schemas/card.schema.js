// ============================================
// Cards API JSON Schemas
// Defines contracts for Single Card, List Cards, and Actions
// ============================================

/** Schema for a Single Card Object */
const cardItemSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer' },
        cardNumber: { type: 'string' },
        cardholderName: { type: 'string' },
        expiryDate: { type: 'string' },
        cardType: { type: ['string', 'null'] },
        isDefault: { type: ['boolean', 'integer'] },
        userId: { type: ['integer', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
    },
    additionalProperties: true,
};

/** Schema for Create / Get Single Card Response */
const singleCardResponseSchema = {
    type: 'object',
    required: ['success'],
    properties: {
        success: { type: 'boolean', const: true },
        message: { type: 'string' },
        data: {
            type: ['object', 'null'],
            ...cardItemSchema,
        },
    },
    additionalProperties: true,
};

/** Schema for List Cards Response */
const listCardsResponseSchema = {
    type: 'object',
    required: ['success', 'data'],
    properties: {
        success: { type: 'boolean', const: true },
        message: { type: ['string', 'null'] },
        data: {
            type: 'array',
            items: cardItemSchema,
        },
    },
    additionalProperties: true,
};

module.exports = {
    cardItemSchema,
    singleCardResponseSchema,
    listCardsResponseSchema,
};
