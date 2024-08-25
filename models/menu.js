const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    data: mongoose.Schema.Types.Mixed,  // This will store the entire JSON object as-is
}, { strict: false });

const menuSchema = new mongoose.Schema({
    data: mongoose.Schema.Types.Mixed,  // This will store the entire JSON object as-is
}, { strict: false });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Menu = mongoose.model('Menu', menuSchema);

module.exports = { Restaurant, Menu };
