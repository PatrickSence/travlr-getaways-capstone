var fs = require('fs');
var units = JSON.parse(fs.readFileSync('./data/units.json',
'utf8'));

/*GET rooms View*/
const rooms = (req, res) => {
    res.render('rooms', { title: 'travlr Getaways', units });
};

module.exports = {
    rooms
}; 
