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
		if(msgHas(msg.text, ['list', 'display', 'get', 'show'], /*['all', 'every'],*/ ['geo', 'position', 'pos'])){
			return Commands.listGeos();
		}

	},

	listGeos : ()=>{
		return Storage.getGeos(Slack.users)
			.then((geos, user)=>{
				const text = _.map(geos, (geo, user)=>{
					if(!geo) return `${user} : _none_`;

					return `${user} : \`${geo.lat}, ${geo.lon}\` - _${Moment(geo.ts).fromNow()}_`;
				}).join('\n');
				return Slack.msg('scott', text);
			});
	}


}

module.exports = Commands;