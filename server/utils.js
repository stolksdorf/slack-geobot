const _ = require('lodash');
const config = require('nconf');

const utils = {

	dist : (geo1, geo2) => {
		const {lat: lat1, lon: lon1} = geo1;
		const {lat: lat2, lon: lon2} = geo2;

		// Math lib function names
		const [pi, asin, sin, cos, sqrt, pow, round] =
			['PI', 'asin', 'sin', 'cos', 'sqrt', 'pow', 'round'].map((k) => Math[k]);
		const radius = 6372.8; // km

		const [rlat1, rlat2, rlon1, rlon2] = [lat1, lat2, lon1, lon2].map((x) => x / 180 * pi);

		const dLat = rlat2 - rlat1;
		const dLon = rlon2 - rlon1;

		return round(
			radius * 2 * asin(
				sqrt(
					pow(sin(dLat / 2), 2) +
					pow(sin(dLon / 2), 2) *
					cos(rlat1) * cos(rlat2)
				)
			) * 100
		);
	},

	getRecipients : (text, slackUsers)=>{
		let targets = _.filter(slackUsers, (name, id)=>{
			return text.indexOf(`<@${id}>`) !== -1;
		});

		//If no user was specified, send it to all users
		if(_.isEmpty(targets)) return 'anyone';
		return targets;
	},

	sortMessagesByDistance : (msgs, geo)=>{
		return _.groupBy(msgs, (msg)=>{
			if(utils.dist(msg.geo, geo) <= config.get('distance')) return 'near';
			return 'far';
		});
	},

	msgHas : (msg, ...filters)=>{
		if(!msg) return false;
		msg = msg.toLowerCase();
		return _.every(filters, (opts)=>{
			if(_.isString(opts)) opts = [opts];
			return _.some(opts, (opt)=>msg.indexOf(opt.toLowerCase()) !== -1)
		});
	},

}

module.exports = utils;