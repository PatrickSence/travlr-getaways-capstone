//var fs = require('fs');
//var trips = JSON.parse(fs.readFileSync('./data/trips.json','utf8'));
const tripsEndpoint = 'http://localhost:3000/api/trips';
const options = {
method: 'GET',
headers: {
'Accept': 'application/json'
}
}

/*GET travel View*/
const travel = async (req, res, next) => {
    //console.log(TRAVEL CONTROLLER BEGIN);
    await fetch(tripsEndpoint, options)
        .then((res) => res.json())
        .then((trips) => {
            let message = null;
            if (!(trips instanceof Array)) {
                message = 'inform the web developer that there was an API lookup error';
                trips = [];
            } else{
                if (!trips.length) {
                    message = 'I am so sorry, however no trips exist in our database';
                }
            }
            res.render('travel', { title: 'travlr Getaways', trips: trips, message });
        })
        .catch((err) => res.status(500).send(err.message));
};

module.exports = {
    travel
};    