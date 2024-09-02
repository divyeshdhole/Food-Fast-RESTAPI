const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');
const app = express();


const allowedOrigins = [
    'https://food-fast-react-app.vercel.app',
    'http://localhost:3000/'
];

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true); // Allow the request
        } else {
            callback(new Error('Not allowed by CORS')); // Reject the request
        }
    },
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

const connectionString = process.env.MONGO_URL || "mongodb://localhost:27017/swiggyData"
// Connect to MongoDB
mongoose.connect(connectionString).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define Menu Schema
const restaurantSchema = new mongoose.Schema({
    data: mongoose.Schema.Types.Mixed,  // Store entire JSON object as-is
}, { strict: false });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const menuSchema = new mongoose.Schema({
    data: mongoose.Schema.Types.Mixed,  // Store entire JSON object as-is
}, { strict: false });

const Menu = mongoose.model('Menu', menuSchema);

// List of Restaurant IDs
const restaurantIds = [
    371720, 194625, 483058, 772519, 233233, 483057, 376659, 630659,
    173074, 173054, 173062, 240478, 469611, 238234, 230012, 625313,
    561971, 173000, 278729, 900980, 834796
];
const swiggyRestaurantsAPI = 'https://www.swiggy.com/dapi/restaurants/list/v5?lat=22.3403&lng=82.6928&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING';

async function fetchAndStoreRestaurantData() {
    try {
        console.log('Fetching restaurant data...');

        const response = await axios.get(swiggyRestaurantsAPI, {
            headers: {
                'User-Agent': 'Mozilla/5.0',  // Adding a User-Agent header
            }
        });

        const restaurantData = response.data;

        // Store the entire restaurant data as-is
        const newRestaurant = new Restaurant({ data: restaurantData });
        await newRestaurant.save();

        console.log('Stored restaurant data successfully.');
    } catch (error) {
        console.error('Error fetching or storing restaurant data:', error.message);
    }
}

// Fetch and store data before starting the server
// fetchAndStoreRestaurantData();
// Function to fetch and store data for each restaurant
async function fetchAndStoreMenuData() {
    try {
        // if (Menu.find().length > 0) {
        //     return;
        // }
        for (let resId of restaurantIds) {
            console.log(`Fetching data for restaurant ID: ${resId}`);

            const swiggyMenuAPI = `https://www.swiggy.com/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=22.3403&lng=82.6928&restaurantId=${resId}&catalog_qa=undefined&submitAction=ENTER`;

            try {
                const menuResponse = await axios.get(swiggyMenuAPI, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',  // Adding a User-Agent header
                    }
                });
                const menuData = menuResponse.data;

                // Store the entire menu data as-is
                const newMenu = new Menu(menuData);
                await newMenu.save();

                console.log(`Stored full menu data for restaurant ID ${resId}`);
            } catch (error) {
                console.error(`Error fetching or storing data for restaurant ID ${resId}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error in the main fetch loop:', error.message);
    }
}
// Express Server Setup
const port = process.env.PORT || 3000;

app.get('/api/restaurant/menu/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // Validate restaurantId
        if (!restaurantId || isNaN(parseInt(restaurantId))) {
            return res.status(400).json({ error: 'Invalid restaurant ID' });
        }

        // Use dot notation to query nested fields
        const menu = await Menu.findOne({ 'data.cards.2.card.card.info.id': restaurantId });

        if (menu) {
            // Respond with the full menu data
            return res.json(menu);
        } else {
            // Respond with a 404 status if the menu is not found
            return res.status(404).json({ error: 'Menu not found' });
        }
    } catch (error) {
        console.error('Error fetching menu:', error.message);
        // Respond with a 500 status for server errors
        return res.status(500).json({ error: 'Failed to fetch menu' });
    }
});
app.get('/api/restaurants', async (req, res) => {
    try {
        // Retrieve all restaurant data
        const restaurants = await Restaurant.find();

        if (restaurants.length > 0) {
            return res.json(restaurants[0]);
        } else {
            return res.status(404).json({ error: 'No restaurants found' });
        }
    } catch (error) {
        console.error('Error fetching restaurant data:', error.message);
        return res.status(500).json({ error: 'Failed to fetch restaurant data' });
    }
});
app.get("/", async (req, res) => {
    return res.json({ hi: "hello world" });
}
);

// Fetch and store data before starting the server
// fetchAndStoreMenuData()
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

