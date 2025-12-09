const calculateCartMetrics = (cart) => {
    let cartValue = 0;
    let totalItemsCount = 0;
    const cartCategories = new Set();

    for (const item of cart.items) {
        // Compute the item price (unitPrice * quantity) and add to total value
        cartValue += item.unitPrice * item.quantity;
        // Compute the total number of items
        totalItemsCount += item.quantity;
        // Collect all unique categories in the cart
        if (item.category) {
            cartCategories.add(item.category);
        }
    }

    return {
        cartValue,
        totalItemsCount,
        cartCategories: Array.from(cartCategories) // Return as array for easy checks
    };
};
// src/services/CouponService.js (continued)
import { couponStore, usageStore } from '../str.js';

/**
 Checks if a single coupon is eligible for the given user and cart.
 */
const isCouponEligible = (coupon, user, cartMetrics, now) => {
    const { eligibility, startDate, endDate, usageLimitPerUser, code } = coupon;
    const { cartValue, totalItemsCount, cartCategories } = cartMetrics;

    // 1. Date validity 
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start || now > end) {
        return false;
    }

    // 2. Usage Limit Per User Check [cite: 82]
    if (usageLimitPerUser) {
        const userUsage = usageStore.get(user.userId) || {};
        const currentUses = userUsage[code] || 0;
        if (currentUses >= usageLimitPerUser) {
            return false;
        }
    }

    // User-based Eligibility Checks (eligibility object is optional) 
    if (eligibility) {
        // 2.1 User Tier Check [cite: 22]
        if (eligibility.allowedUserTiers && eligibility.allowedUserTiers.length > 0) {
            if (!eligibility.allowedUserTiers.includes(user.userTier)) {
                return false;
            }
        }

        // 2.2 Minimum Lifetime Spend [cite: 24]
        if (eligibility.minLifetimeSpend && user.lifetimeSpend < eligibility.minLifetimeSpend) {
            return false;
        }

        // 2.3 Minimum Orders Placed [cite: 25]
        if (eligibility.minOrdersPlaced && user.ordersPlaced < eligibility.minOrdersPlaced) {
            return false;
        }

        // 2.4 First Order Only [cite: 26]
        // This is only valid if the user has 0 previous orders
        if (eligibility.firstOrderOnly === true && user.ordersPlaced > 0) {
            return false;
        }

        // 2.5 Allowed Countries [cite: 27]
        if (eligibility.allowedCountries && eligibility.allowedCountries.length > 0) {
            if (!eligibility.allowedCountries.includes(user.country)) {
                return false;
            }
        }

        // --- Cart-based Eligibility Checks ---

        // 2.6 Minimum Cart Value [cite: 30]
        if (eligibility.minCartValue && cartValue < eligibility.minCartValue) {
            return false;
        }

        // 2.7 Minimum Items Count [cite: 34]
        if (eligibility.minItemsCount && totalItemsCount < eligibility.minItemsCount) {
            return false;
        }

        // 2.8 Applicable Categories [cite: 31, 32]
        // Coupon applies if AT LEAST ONE item in the cart is from these categories
        if (eligibility.applicableCategories && eligibility.applicableCategories.length > 0) {
            const hasApplicableCategory = cartCategories.some(cat => eligibility.applicableCategories.includes(cat));
            if (!hasApplicableCategory) {
                return false;
            }
        }

        // 2.9 Excluded Categories [cite: 33]
        // Coupon is invalid if ANY excluded category appears in the cart
        if (eligibility.excludedCategories && eligibility.excludedCategories.length > 0) {
            const hasExcludedCategory = cartCategories.some(cat => eligibility.excludedCategories.includes(cat));
            if (hasExcludedCategory) {
                return false;
            }
        }
    }

    return true; // Passed all checks
};
// src/services/CouponService.js (continued)

/**
 * Computes the discount for a single coupon.
 */
const computeDiscount = (coupon, cartMetrics) => {
    const { discountType, discountValue, maxDiscountAmount } = coupon;
    const cartValue = cartMetrics.cartValue;
    let discount = 0;

    if (discountType === 'FLAT') {
        // FLAT: discount is the fixed discountValue [cite: 84]
        discount = discountValue;
    } else if (discountType === 'PERCENT') {
        // PERCENT: discount is a percentage of cartValue [cite: 85]
        discount = cartValue * (discountValue / 100);

        // Cap the discount by maxDiscountAmount, if provided [cite: 86]
        if (maxDiscountAmount !== null && typeof maxDiscountAmount !== 'undefined') {
            discount = Math.min(discount, maxDiscountAmount);
        }
    }
    
    // Discount cannot exceed the cart value
    discount = Math.min(discount, cartValue);
    
    // Round to 2 decimal places for currency, if necessary
    return parseFloat(discount.toFixed(2));
};

/**
 * Main function to find the best eligible coupon.
 */
export const findBestCoupon = (userContext, cart) => {
    const now = new Date();
    const cartMetrics = calculateCartMetrics(cart);

    // 1. Filter and Calculate Discount for Eligible Coupons
    const eligibleCouponsWithDiscount = Array.from(couponStore.values())
        .filter(coupon => isCouponEligible(coupon, userContext, cartMetrics, now))
        .map(coupon => {
            const discountAmount = computeDiscount(coupon, cartMetrics);
            return {
                ...coupon,
                discountAmount: discountAmount
            };
        });

    if (eligibleCouponsWithDiscount.length === 0) {
        return null; // No coupon applies [cite: 91]
    }

    // 2. Select the Best Coupon (Sorting) [cite: 87]
    eligibleCouponsWithDiscount.sort((a, b) => {
        // Rule 1: Highest discount amount [cite: 88]
        if (a.discountAmount !== b.discountAmount) {
            return b.discountAmount - a.discountAmount; // Descending
        }

        // Rule 2: If tie, earliest endDate [cite: 89]
        if (a.endDate !== b.endDate) {
            // New Date(a) - New Date(b): Ascending order (earlier date first)
            return new Date(a.endDate) - new Date(b.endDate); 
        }

        
        return a.code.localeCompare(b.code); 
    });

    // Return the top resul
    const bestCoupon = eligibleCouponsWithDiscount[0];
    
// chacking per user limit
if (usageLimitPerUser) {
    const userUsage = usageStore.get(user.userId) || {};
    const currentUses = userUsage[code] || 0;
    // chacking the user limit
    if (currentUses >= usageLimitPerUser) {
        return false;
    }
}
    
    return {
        coupon: bestCoupon,
        discountAmount: bestCoupon.discountAmount,
        cartValue: cartMetrics.cartValue 
    };
};