// bring in the db connection and Trips schema
const mongoose = require('./db');
const Trip = mongoose.model('trips');

// read in the JSON seed data
var fs = require('fs');
var trips = JSON.parse(fs.readFileSync('./data/trips.json', 'utf-8'));

// delete any existing records, then inser the seed data
const seedDB = async () => {
    await Trip.deleteMany({});
    await Trip.insertMany(trips);
}

// close the MongoDB connection and exit. 
seedDB().then(async () => {
    await mongoose.connection.close();
    process.exit(0);
});