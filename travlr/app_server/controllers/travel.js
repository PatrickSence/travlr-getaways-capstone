/* GET travel view */
const travel = (req, res) => {
    res.render('travel', { title: 'Travler Getaways' });
};

module.exports = {
    travel
};