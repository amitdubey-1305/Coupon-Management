import { Router } from 'express';
import { couponStore, usageStore } from '../str.js';
import { findBestCoupon } from '../services/CpnService.js';

const router = Router();

const validateCoupon = (coupon) => {
    if (!coupon.code || !coupon.discountType || typeof coupon.discountValue === 'undefined') {
        return 'Coupon must have code, discountType, and discountValue.';
    }

    if (!['FLAT', 'PERCENT'].includes(coupon.discountType)) {
        return 'discountType must be "FLAT" or "PERCENT".';
    }
        if (typeof coupon.discountValue !== 'number' || coupon.discountValue <= 0) {
        return 'discountValue must be a positive number.';
    }

    if (coupon.discountType === 'PERCENT' && coupon.discountValue > 100) {
        return 'PERCENT discountValue cannot exceed 100.';
    }

    if (coupon.maxDiscountAmount && (typeof coupon.maxDiscountAmount !== 'number' || coupon.maxDiscountAmount <= 0)) {
        return 'maxDiscountAmount must be a positive number.';
    }

    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);

    if (!coupon.startDate || !coupon.endDate || isNaN(start) || isNaN(end) || start >= end) {
        return 'Invalid or missing start/end dates. Start date must be before end date.';
    }

    if (coupon.usageLimitPerUser && (typeof coupon.usageLimitPerUser !== 'number' || coupon.usageLimitPerUser <= 0)) {
        return 'usageLimitPerUser must be a positive integer.';
    }

    if (coupon.eligibility && typeof coupon.eligibility !== 'object') {
        return 'eligibility, if provided, must be an object.';
    }
    
    return null;
};

router.post("/create", (req, res) => {
    const coupon = req.body;

    const error = validateCoupon(coupon);
    if (error) return res.status(400).json({ error });

    
    if (couponStore.has(coupon.code)) {
        
        return res.status(409).json({ error: "Coupon code already exists" });
    }

    couponStore.set(coupon.code, coupon); 

    return res.status(201).json({ 
        message: "Coupon created successfully",
        coupon
    });
});

router.get("/", (req, res) => {
    
    res.json(Array.from(couponStore.values()));
});

router.post("/best", (req, res) => {
    const { user, cart } = req.body;

    if (!user || !cart || !user.userId) { 
        return res.status(400).json({ error: "User context (including userId) and cart are required" });
    }

    try {
        const result = findBestCoupon(user, cart);
        
        if (!result) {
            return res.json({ bestCoupon: null, discount: 0, message: "No eligible coupon found." });
        }
        
        return res.json({
            bestCoupon: result.coupon,
            discount: result.discountAmount
        });
    } catch (error) {
        console.error("Error evaluating best coupon:", error);
        return res.status(500).json({ error: 'Internal server error during coupon evaluation.' });
    }
});

export default router;