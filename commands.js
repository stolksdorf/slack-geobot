const Slack = require('./slack.api.js');
const Storage = require('./storage.js');
const _ = require('lodash');
const Moment = require('moment');

const msgHas = (msg, ...filters)=>{
	if(!msg) return false;
	msg = msg.toLowerCase();
	return _.every(filters, (opts)=>{
		if(_.isString(opts)) opts = [opts];
		return _.some(opts, (opt)=>msg.indexOf(opt.toLowerCase()) !== -1)
	});
};


const Commands = {
	execute : (msg)=>{
		if(msgHas(msg.text, ['list', 'display'], ['all', 'every'], ['geo', 'position', 'pos'])){
			return Commands.listGeos();
		}

	},

	listGeos : ()=>{
		console.log('here');
		Storage.getGeos(Slack.users)
			.then((geos, user)=>{
				console.log(geos);
				_.map(geos, (geo)=>{
					console.log(geo);
				})
			})

	}


}

module.exports = Commands;