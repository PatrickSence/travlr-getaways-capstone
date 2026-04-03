const mongoose = require('mongoose');
const Trip = require('../models/travlr');
const Model = mongoose.model('trips');

// GET /trips - list of all trips
// regardless of outcome, response must include HTML Status code
//and JSON message to the requesting client



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
const tripsFindByCode = async (req, res) => {
    const q = await Model
        .find({ code: req.params.tripcode })
        .exec();

        if(!q)
        {
            return res
                .status(404)
                .json({ message: 'Trip not found' });
        } else {
            return res
                .status(200)
                .json(q);
        }
};
module.exports = {
    tripsList,
    tripsFindByCode
};