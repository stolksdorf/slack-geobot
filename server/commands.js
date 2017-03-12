const _ = require('lodash');
const Moment = require('moment');

const utils = require('./utils.js');
const Slack = require('./slack.api.js');
const Cache = require('./cache.js');


const Commands = {
	execute : (msg)=>{
		if(utils.msgHas(msg.text, ['list', 'display', 'get', 'show'], /*['all', 'every'],*/ ['geo', 'position', 'pos'])){
			return Commands.listGeos();
		}

	},

	listGeos : ()=>{
		return Cache.getGeos(Slack.users)
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