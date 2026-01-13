class InputValidator {
    constructor() {
        // XSS prevention: patterns that indicate potential malicious content
        this.xssPatterns = {
            htmlTags: /<[^>]*>/g,
            scriptTags: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            eventHandlers: /on\w+\s*=/gi,
            jsProtocol: /javascript:/gi,
            dataUri: /data:text\/html/gi,
            vbscriptProtocol: /vbscript:/gi,
            suspiciousEntities: /&lt;script|&gt;|&quot;|&#x/gi
        };

        // Email validation regex (RFC 5322 simplified)
        this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Phone validation (basic international format)
        this.phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;

        // Name validation (letters, spaces, hyphens, apostrophes)
        this.nameRegex = /^[a-zA-Z\s\-']{1,100}$/;

        // College/Institution name validation
        this.collegeRegex = /^[a-zA-Z0-9\s\-\.,&()]{1,150}$/;

        // URL validation for safe redirects
        this.urlRegex = /^https?:\/\/(localhost|127\.0\.0\.1|turinger\..*|\.edu|\.com|\.org)/;

        // NoSQL injection patterns
        this.noSqlPatterns = {
            operatorObjects: /\$where|\$regex|\$ne|\$gt|\$gte|\$lt|\$lte|\$in|\$nin|\$and|\$or|\$nor|\$not|\$exists|\$type|\$mod|\$text|\$where/gi,
            jsonKeywords: /["']?\$[a-z]+["']?/gi
        };
    }

    sanitizeString(input, type = 'text') {
        if (typeof input !== 'string') {
            return '';
        }

        let sanitized = input.trim();

        sanitized = sanitized.replace(this.xssPatterns.htmlTags, '');
        sanitized = sanitized.replace(this.xssPatterns.scriptTags, '');
        sanitized = sanitized.replace(this.xssPatterns.eventHandlers, '');
        sanitized = sanitized.replace(this.xssPatterns.jsProtocol, '');
        sanitized = sanitized.replace(this.xssPatterns.dataUri, '');
        sanitized = sanitized.replace(this.xssPatterns.vbscriptProtocol, '');
        sanitized = sanitized.replace(this.xssPatterns.suspiciousEntities, '');
        sanitized = sanitized.replace(this.noSqlPatterns.operatorObjects, '');

        // Limit length based on field type
        const maxLengths = {
            name: 100,
            email: 254,
            phone: 20,
            college: 150,
            message: 1000,
            textarea: 5000,
            text: 500
        };

        const maxLength = maxLengths[type] || maxLengths.text;
        sanitized = sanitized.substring(0, maxLength);

        return sanitized;
    }

    validateEmail(email, options = {}) {
        const sanitized = this.sanitizeString(email, 'email');
        
        if (!sanitized || sanitized.length === 0) {
            return { valid: false, error: 'Email is required' };
        }

        if (!this.emailRegex.test(sanitized)) {
            return { valid: false, error: 'Invalid email format' };
        }

        if ((sanitized.match(/@/g) || []).length > 1) {
            return { valid: false, error: 'Invalid email format' };
        }
        if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
            return { valid: false, error: 'Invalid email format' };
        }
        if (options.isMAHE === true) {
            if (!sanitized.toLowerCase().endsWith('@learner.manipal.edu')) {
                return { valid: false, error: 'MAHE students must use @learner.manipal.edu email address' };
            }
        }

        return { valid: true, value: sanitized };
    }

    validateName(name) {
        const sanitized = this.sanitizeString(name, 'name');

        if (!sanitized || sanitized.length === 0) {
            return { valid: false, error: 'Name is required' };
        }

        if (sanitized.length < 2) {
            return { valid: false, error: 'Name must be at least 2 characters' };
        }

        if (!this.nameRegex.test(sanitized)) {
            return { valid: false, error: 'Name contains invalid characters. Use letters, spaces, hyphens, or apostrophes only' };
        }
        if (sanitized.replace(/\s+/g, ' ').split(' ').some(word => word.length === 0)) {
            return { valid: false, error: 'Invalid name format' };
        }

        return { valid: true, value: sanitized };
    }

    validatePhone(phone) {
        const sanitized = this.sanitizeString(phone, 'phone')
            .replace(/\s/g, '')
            .replace(/[\-\(\)]/g, '');

        if (!sanitized || sanitized.length === 0) {
            return { valid: false, error: 'Phone number is required' };
        }

        if (!/^\d{7,15}$/.test(sanitized)) {
            return { valid: false, error: 'Phone number must be 7-15 digits' };
        }

        return { valid: true, value: sanitized };
    }

    validateCollege(college) {
        const sanitized = this.sanitizeString(college, 'college');

        if (!sanitized || sanitized.length === 0) {
            return { valid: false, error: 'College is required' };
        }

        if (sanitized.length < 2) {
            return { valid: false, error: 'College name must be at least 2 characters' };
        }

        if (!this.collegeRegex.test(sanitized)) {
            return { valid: false, error: 'College name contains invalid characters' };
        }

        return { valid: true, value: sanitized };
    }

    validateMessage(message) {
        const sanitized = this.sanitizeString(message, 'textarea');

        if (sanitized.length === 0) {
            return { valid: true, value: '' };
        }

        if (sanitized.length > 5000) {
            return { valid: false, error: 'Message must be less than 5000 characters' };
        }

        return { valid: true, value: sanitized };
    }

    validateEvents(events) {
        if (!Array.isArray(events)) {
            return { valid: false, error: 'Events must be an array' };
        }

        // Whitelist of valid event values
        const validEvents = [
            'esp-talk',
            'blind-coding',
            'fabric-workshop',
            'ml-marathon',
            'token-trivia',
            'squid-game',
            'murder-mystery',
            'lovelace-hackathon',
            'symposium'
        ];

        // Filter and validate events
        const filtered = events.filter(e => {
            const sanitized = this.sanitizeString(String(e), 'text');
            return validEvents.includes(sanitized);
        });

        return { valid: true, value: filtered };
    }

    validateTier(tier) {
        const sanitized = this.sanitizeString(String(tier), 'text');
        const validTiers = ['platinum', 'gold', 'silver', 'bronze'];

        if (!validTiers.includes(sanitized.toLowerCase())) {
            return { valid: false, error: 'Invalid tier selection' };
        }

        return { valid: true, value: sanitized.toLowerCase() };
    }

    validateRedirectUrl(url) {
        if (typeof url !== 'string') {
            return { valid: false, error: 'Invalid URL' };
        }

        try {
            const urlObj = new URL(url);
            
            // Only allow https protocol or relative paths
            if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
                return { valid: false, error: 'Invalid URL protocol' };
            }

            return { valid: true, value: url };
        } catch (e) {
            return { valid: false, error: 'Invalid URL format' };
        }
    }

    validateCSRFToken(token) {
        if (typeof token !== 'string' || token.length === 0) {
            return { valid: false, error: 'CSRF token required' };
        }

        // Token should be alphanumeric and at least 32 characters
        if (!/^[a-zA-Z0-9\-_]{32,}$/.test(token)) {
            return { valid: false, error: 'Invalid CSRF token format' };
        }

        return { valid: true, value: token };
    }

    checkRateLimit(key, maxAttempts = 5, windowSeconds = 60) {
        const now = Date.now();
        const storageKey = `rateLimit_${key}`;
        const stored = localStorage.getItem(storageKey);

        let attempts = [];
        if (stored) {
            attempts = JSON.parse(stored).filter(timestamp => now - timestamp < windowSeconds * 1000);
        }

        if (attempts.length >= maxAttempts) {
            return { allowed: false, message: `Too many attempts. Please try again in ${Math.ceil((attempts[0] + windowSeconds * 1000 - now) / 1000)} seconds` };
        }

        attempts.push(now);
        localStorage.setItem(storageKey, JSON.stringify(attempts));

        return { allowed: true };
    }

    validateRegistrationForm(formData) {
        const errors = [];
        const isMAHE = formData.college === 'mahe';

        // Validate name
        const nameValidation = this.validateName(formData.fullName);
        if (!nameValidation.valid) {
            errors.push(nameValidation.error);
        }

        // Validate email with MAHE-specific check
        const emailValidation = this.validateEmail(formData.email, { isMAHE });
        if (!emailValidation.valid) {
            errors.push(emailValidation.error);
        }

        // Validate phone
        const phoneValidation = this.validatePhone(formData.phone);
        if (!phoneValidation.valid) {
            errors.push(phoneValidation.error);
        }

        // Validate college
        const collegeValidation = this.validateCollege(formData.college);
        if (!collegeValidation.valid) {
            errors.push(collegeValidation.error);
        }

        // Validate events if provided
        if (formData.events && Array.isArray(formData.events)) {
            const eventsValidation = this.validateEvents(formData.events);
            if (!eventsValidation.valid) {
                errors.push(eventsValidation.error);
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        return {
            valid: true,
            sanitizedData: {
                fullName: nameValidation.value,
                email: emailValidation.value,
                phone: phoneValidation.value,
                college: collegeValidation.value,
                events: formData.events ? this.validateEvents(formData.events).value : []
            }
        };
    }

    validateEnquiryForm(formData) {
        const errors = [];

        // Validate email
        const emailValidation = this.validateEmail(formData.email);
        if (!emailValidation.valid) {
            errors.push(emailValidation.error);
        }

        // Validate message (optional)
        const messageValidation = this.validateMessage(formData.message || '');
        if (!messageValidation.valid) {
            errors.push(messageValidation.error);
        }

        // Validate tier if provided
        if (formData.tier) {
            const tierValidation = this.validateTier(formData.tier);
            if (!tierValidation.valid) {
                errors.push(tierValidation.error);
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        return {
            valid: true,
            sanitizedData: {
                email: emailValidation.value,
                message: messageValidation.value,
                tier: formData.tier ? this.validateTier(formData.tier).value : null
            }
        };
    }
}

const validator = new InputValidator();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = validator;
}
