const mongoose = require('mongoose');
const TripView = mongoose.model('TripView');

const viewsList = async (req, res) => {
  try {
    const views = await TripView.find().sort({ viewedAt: -1 });
    res.status(200).json(views);
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  viewsList
};