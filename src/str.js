const couponStore = new Map();
const usageStore = new Map();
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextMonth = new Date(today);
nextMonth.setMonth(today.getMonth() + 1);

const SEED_COUPONS = [
    // Flat 200 off
    {
        code: "WELCOME_FLAT_200",
        description: "Flat $200 off for new users over $1000",
        discountType: "FLAT",
        discountValue: 200,
        startDate: today.toISOString(),
        endDate: nextMonth.toISOString(),
        usageLimitPerUser: 1,
        eligibility: {
            allowedUserTiers: ["NEW"],
            minCartValue: 1000,
            firstOrderOnly: true
        }
    },
    // 2. 30 % off
    {
        code: "SALE_PERCENT_30",
        description: "30% off, max $300, for regulars on fashion/electronics",
        discountType: "PERCENT",
        discountValue: 30, 
        maxDiscountAmount: 300, 
        startDate: today.toISOString(),
        endDate: nextMonth.toISOString(), 
        eligibility: {
            allowedUserTiers: ["REGULAR", "GOLD"],
            applicableCategories: ["fashion", "electronics"],
            minLifetimeSpend: 500
        }
    },
    // 3. Valid before last date
    {
        code: "TIED_EARLY_DATE",
        description: "A small flat discount, expires early",
        discountType: "FLAT",
        discountValue: 50,
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(), 
        eligibility: {
            minCartValue: 200
        }
    },
    // 4. discount at same date
    {
        code: "A_TIED_LATE_DATE", 
        description: "Another small flat discount, expires late",
        discountType: "FLAT",
        discountValue: 50,
        startDate: today.toISOString(),
        endDate: nextMonth.toISOString(),
        eligibility: {
            minCartValue: 200
        }
    },
    {
        // After spacific date
        code: "Z_TIED_LATE_DATE", 
        description: "Another small flat discount, expires late",
        discountType: "FLAT",
        discountValue: 50,
        startDate: today.toISOString(),
        endDate: nextMonth.toISOString(),
        eligibility: {
            minCartValue: 200
        }
    },
    // 5. Excluded Category Test
    {
        code: "NO_TOYS",
        description: "Flat $10 off, but no toys allowed in cart",
        discountType: "FLAT",
        discountValue: 10,
        startDate: today.toISOString(),
        endDate: nextMonth.toISOString(),
        eligibility: {
            excludedCategories: ["toys"],
            minCartValue: 100
        },
        
    },

    // 6 . Sunday Spacial
    {
        code: "SUNDAY_SPACIAL",
        description: "20% off on Sundays for Gold members",
        discountType: "PERCENT",
        discountValue: 20,
        maxDiscountAmount: 150,
        startDate: today.toISOString(),
        endDate: nextMonth.toISOString(),
        eligibility: {
            applicableCategories: ["undergarments", "fashion"],
            minCartValue: 300
        }
        
    }
];

// Function to initialize the store with seed data
const initializeStore = () => {
    SEED_COUPONS.forEach(coupon => {
        couponStore.set(coupon.code, coupon);
    });

    // Seed data for usageStore (e.g., user 'u456' has used 'WELCOME_FLAT_200' once)
    usageStore.set('u456', {
        'WELCOME_FLAT_200': 1,
    });
};

// Initialize the store on startup
initializeStore();


export { 
    couponStore,
    usageStore
};