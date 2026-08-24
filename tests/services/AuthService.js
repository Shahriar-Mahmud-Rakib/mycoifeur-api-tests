// ============================================
// Auth API Service (Service Object Model Pattern)
// Encapsulates Authentication endpoints (User, Salon & Admin)
// ============================================

const { BaseService } = require('./BaseService');

class AuthService extends BaseService {
    /**
     * @param {import('@playwright/test').APIRequestContext} request
     * @param {string|null} [token=null]
     */
    constructor(request, token = null) {
        super(request, token);
    }

    /**
     * Send OTP for User or Salon
     */
    async sendOtp(phone, countryCode = '966', typeUser = 'user', testInfo, options = {}) {
        return this.post('/api/v1/auth/send-otp', { phone, countryCode, typeUser }, {
            testInfo,
            title: `Send OTP to ${countryCode}${phone} (${typeUser})`,
            ...options,
        });
    }

    /**
     * Verify OTP code and obtain bearer token
     */
    async verifyCode(phone, countryCode = '966', typeUser = 'user', code = '1234', testInfo, options = {}) {
        return this.post('/api/v1/auth/verify-code', { phone, countryCode, typeUser, code }, {
            testInfo,
            title: `Verify Code for ${countryCode}${phone}`,
            ...options,
        });
    }

    /**
     * Admin login with email & password
     */
    async adminLogin(user, password, testInfo, options = {}) {
        return this.post('/api/v1/auth/admin/login', { user, password }, {
            testInfo,
            title: `Admin Login (${user})`,
            ...options,
        });
    }

    /**
     * User password login (if enabled)
     */
    async userLogin(credentials, testInfo, options = {}) {
        return this.post('/api/v1/auth/login', credentials, {
            testInfo,
            title: `User Login (${credentials.phone || credentials.email})`,
            ...options,
        });
    }
}

module.exports = { AuthService };
