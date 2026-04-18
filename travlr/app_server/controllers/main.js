/* GET Homepage */
const index = (req, res) => {
    res.render('index', { title: 'Travlr Getaways' });
};


const Trip = require('../../app_api/models/travlr');

const travel = async (req, res) => {
  try {
    const trips = await Trip.find().exec();

    console.log('Trips found for travel page:', trips);

    res.render('travel', {
      title: 'Travel',
      trips
    });
  } catch (err) {
    console.log('travel page error:', err);
    res.status(500).render('error', {
      message: 'Could not load travel page'
    });
  }
};

module.exports = {
  index,
  travel
};