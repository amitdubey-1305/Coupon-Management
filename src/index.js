import express from 'express';
// Correctly import the router from the routes folder
import couponRoutes from './routes/cpnRouts.js'; 
// Note: We rename the import to 'couponRoutes' for clarity, but 'cpnRoutes' works too.

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Main application routing: Mount the router
// All requests starting with /api/coupons will be handled by the router
app.use('/api/coupons', couponRoutes);

// Simple base route
app.get('/', (req, res) => {
    res.send('Coupon Manager API is running! Access /api/coupons/best or /api/coupons/create.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // You must also call initializeStore() here to ensure seed data is loaded
    // We'll call it within the store.js file for simplicity. 
});