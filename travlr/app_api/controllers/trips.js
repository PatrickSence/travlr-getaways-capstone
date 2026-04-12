const mongoose = require('mongoose');
const Trip = require('../models/travlr');
const Model = mongoose.model('trips');

// GET /trips - list of all trips
const tripsList = async (req, res) => {
    try {
        const q = await Trip.find().exec();

        console.log(q);

        if (!q || q.length === 0) {
            return res
                .status(404)
                .json({ message: 'No trips found' });
        } else {
            return res
                .status(200)
                .json(q);
        }
    } catch (err) {
        return res
            .status(500)
            .json(err);
    }
};

// GET /trips/:tripcode - find one by code
const tripsFindByCode = async (req, res) => {
    try {
        const q = await Model
            .find({ code: req.params.tripcode })
            .exec();

        if (!q || q.length === 0) {
            return res
                .status(404)
                .json({ message: 'Trip not found' });
        } else {
            return res
                .status(200)
                .json(q);
        }
    } catch (err) {
        return res
            .status(500)
            .json(err);
    }
};

// POST /trips - add a new trip
const tripAddTrip = async (req, res) => {
    try {
        const newTrip = new Trip({
            code: req.body.code,
            name: req.body.name,
            length: req.body.length,
            start: req.body.start,
            resort: req.body.resort,
            perPerson: req.body.perPerson,
            image: req.body.image,
            description: req.body.description
        });

        const q = await newTrip.save();

        if (!q) {
            return res
                .status(400)
                .json({ message: 'Error creating trip' });
        } else {
            return res
                .status(201)
                .json(q);
        }
    } catch (err) {
        return res
            .status(500)
            .json(err);
    }
    
};
// PUT: /trips/:tripCode - Updates a trip
const tripsUpdateTrip = async (req, res) => {
    try {
        console.log(req.params);
        console.log(req.body);

        const q = await Model
            .findOneAndUpdate(
                { code: req.params.tripcode },
                {
                    code: req.body.code,
                    name: req.body.name,
                    length: req.body.length,
                    start: req.body.start,
                    resort: req.body.resort,
                    perPerson: req.body.perPerson,
                    image: req.body.image,
                    description: req.body.description
                },
                { new: true }
            )
            .exec();

        if (!q) {
            return res
                .status(404)
                .json({ message: 'Trip not found' });
        } else {
            return res
                .status(200)
                .json(q);
        }
    } catch (err) {
        return res
            .status(500)
            .json(err);
    }
};

module.exports = {
    tripsList,
    tripsFindByCode,
    tripAddTrip,
    tripsUpdateTrip
};