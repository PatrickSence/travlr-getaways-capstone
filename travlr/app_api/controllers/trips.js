const Trip = require('../models/travlr');

// GET /trips - list of all trips
const tripsList = async (req, res) => {
  try {
    const q = await Trip.find().exec();
    console.log('tripsList result:', q);

    if (!q || q.length === 0) {
      return res.status(404).json({ message: 'No trips found' });
    } else {
      return res.status(200).json(q);
    }
  } catch (err) {
    console.log('tripsList error:', err);
    return res.status(500).json(err);
  }
};

// GET /trips/:tripcode - find one by code
const tripsFindByCode = async (req, res) => {
  console.log('--- tripsFindByCode start ---');
  console.log('Requested tripcode:', req.params.tripcode);

  try {
    const q = await Trip.findOne({ code: req.params.tripcode }).exec();
    console.log('Find query result:', q);

    if (!q) {
      return res.status(404).json({ message: 'Trip not found' });
    } else {
      return res.status(200).json(q);
    }
  } catch (err) {
    console.log('FindByCode error:', err);
    return res.status(500).json(err);
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
      return res.status(400).json({ message: 'Error creating trip' });
    } else {
      return res.status(201).json(q);
    }
  } catch (err) {
    console.log('tripAddTrip error:', err);
    return res.status(500).json(err);
  }
};

// PUT /trips/:tripcode - update a trip
const tripsUpdateTrip = async (req, res) => {
  try {
    console.log('--- tripsUpdateTrip start ---');
    console.log('Requested tripcode:', req.params.tripcode);
    console.log('Request body:', req.body);

    const q = await Trip.findOneAndUpdate(
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
    ).exec();

    console.log('Update query result:', q);

    if (!q) {
      return res.status(404).json({ message: 'Trip not found' });
    } else {
      return res.status(200).json(q);
    }
  } catch (err) {
    console.log('tripsUpdateTrip error:', err);
    return res.status(500).json(err);
  }
};

// DELETE /trips/:tripcode - delete a trip
const tripsDeleteTrip = async (req, res) => {
  console.log('--- tripsDeleteTrip start ---');
  console.log('Requested tripcode:', req.params.tripcode);

  try {
    const q = await Trip.findOneAndDelete({ code: req.params.tripcode }).exec();
    console.log('Delete query result:', q);

    if (!q) {
      console.log('Trip not found for deletion');
      return res.status(404).json({ message: 'Trip not found' });
    } else {
      console.log('Trip deleted successfully');
      return res.status(200).json({
        message: 'Trip deleted successfully',
        deletedTrip: q
      });
    }
  } catch (err) {
    console.log('Delete controller error:', err);
    return res.status(500).json(err);
  }
};

module.exports = {
  tripsList,
  tripsFindByCode,
  tripAddTrip,
  tripsUpdateTrip,
  tripsDeleteTrip

  
};