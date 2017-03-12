const _ = require('lodash');
const Moment = require('moment');

const utils = require('./utils.js');
const Slack = require('./slack.api.js');
const Cache = require('./cache.js');
const DB = require('./db.js');



const Commands = {
	execute : (msg)=>{
		if(utils.msgHas(msg.text, ['messages'])){
			return Commands.listMsgs();
		}

		if(utils.msgHas(msg.text, ['list', 'display', 'get', 'show'], /*['all', 'every'],*/ ['geo', 'position', 'pos'])){
			return Commands.listGeos();
		}

		if(utils.msgHas(msg.text, 'clear')){
			return Commands.clear();
		}

		if(utils.msgHas(msg.text, ['add', 'set'])){
			return Commands.addRandomGeo();
		}

		if(utils.msgHas(msg.text, ['pending'])){
			return Commands.listPending();
		}



	},

	listGeos : ()=>{
		return Cache.getGeos(Slack.users)
			.then((geos, user)=>{
				const text = _.map(geos, (geo, user)=>{
					if(!geo) return `${user} : none`;

					return `${user} : ${geo.lat}, ${geo.lon} - ${Moment(geo.ts).fromNow()}`;
				}).join('\n');
				return Slack.msg('scott', '```' + text + '```');
			});
	},

	clear : ()=>{
		return Cache.clear()
			.then(()=>Slack.msg('scott', '`cleared cache`'));
	},

	addRandomGeo : ()=>{
		return Cache.setGeo('scott', 43.987031, -80.438622)
			.then(()=>Slack.msg('scott', '`Added a geo for you`'));

	},

	listPending : ()=>{
		return Cache.getAllPending()
			.then((pendings)=>{
				return Slack.msg('scott', '``` ' +
					_.map(pendings, (pending)=>JSON.stringify(pending, null, '  ')).join('\n\n')
					+ ' ```'
				);
			})
	},

	listMsgs : ()=>{
		console.log('HERE');
		return DB.getAll()
			.then((msgs)=>{
				console.log("WHAT");
				return Slack.msg('scott', '``` ' +
					JSON.stringify(msgs, null, '  ')
					+ ' ```'
				);
			})
	}


}

module.exports = Commands;