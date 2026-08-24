// ============================================
// Cards API Service (Service Object Model Pattern)
// Encapsulates all /api/v1/cards operations
// ============================================

const { BaseService } = require('./BaseService');

class CardService extends BaseService {
    /**
     * @param {import('@playwright/test').APIRequestContext} request
     * @param {string|null} [token=null]
     */
    constructor(request, token = null) {
        super(request, token);
        this.basePath = '/api/v1/cards';
    }

    /**
     * Create a new payment card
     */
    async createCard(payload, testInfo, options = {}) {
        return this.post(this.basePath, payload, {
            testInfo,
            title: 'Add new payment card',
            ...options,
        });
    }

    /**
     * List all cards for the authenticated user
     */
    async listCards(testInfo, options = {}) {
        return this.get(this.basePath, {
            testInfo,
            title: 'List user payment cards',
            ...options,
        });
    }

    /**
     * Get single card by ID
     */
    async getCardById(cardId, testInfo, options = {}) {
        return this.get(`${this.basePath}/${cardId}`, {
            testInfo,
            title: `Get card ID ${cardId}`,
            ...options,
        });
    }

    /**
     * Update card details by ID
     */
    async updateCard(cardId, payload, testInfo, options = {}) {
        return this.put(`${this.basePath}/${cardId}`, payload, {
            testInfo,
            title: `Update card ID ${cardId}`,
            ...options,
        });
    }

    /**
     * Delete card by ID (soft delete)
     */
    async deleteCard(cardId, testInfo, options = {}) {
        return this.delete(`${this.basePath}/${cardId}`, {
            testInfo,
            title: `Delete card ID ${cardId}`,
            ...options,
        });
    }

    /**
     * Restore a deleted card
     */
    async restoreCard(cardId, testInfo, options = {}) {
        return this.post(`${this.basePath}/${cardId}/restore`, {}, {
            testInfo,
            title: `Restore card ID ${cardId}`,
            ...options,
        });
    }

    /**
     * Set a card as default
     */
    async setDefaultCard(cardId, testInfo, options = {}) {
        return this.get(`${this.basePath}/${cardId}/set-default`, {
            testInfo,
            title: `Set card ID ${cardId} as default`,
            ...options,
        });
    }
}

module.exports = { CardService };
