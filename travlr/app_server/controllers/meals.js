var fs = require('fs');
var mealData = JSON.parse(fs.readFileSync('./data/meals.json', 'utf8'));

const meals = (req, res) => {
    res.render('meals', {
        title: 'Travlr Getaways',
        meals: mealData
    });
};

module.exports = {
    meals
};