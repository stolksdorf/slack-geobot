const _ = require('lodash');
const config = require('nconf');
const Moment = require('moment');
const log = require('pico-log');

const Messages = require('./slack.msg.js');
const Commands = require('./commands.js');
const utils = require('./utils.js')
const Slack = require('./slack.api.js');
const Cache = require('./cache.js');
const DB = require('./db.js');



const Geobot = {
	start : ()=>{
		Slack.on('message', Geobot.msgHandler);
		Slack.on('reaction_added', Geobot.reactionHandler);
		return Cache.connect()
			.then(()=>DB.connect())
			.then(()=>Slack.connect(config.get('slack_token'), config.get('bot')))
			.then(()=>Geobot.checkOldGeos())
			.then(()=>log.info('Geobot rebooted!'))
			.then(()=>log.debug(Slack.users, Slack.connected))
	},
	msgHandler : (msg) =>{
		const isCmd = utils.msgHas(msg.text, ['geobot', Slack.botId]) && msg.user == 'scott';
		if(isCmd) return Commands.execute(msg);

		return Geobot.parseMessage(msg)
	},
	reactionHandler : (event)=>{
		if(event.user == 'geobot') return;
		if(event.reaction !== '+1') return;

		Cache.getPending(event.item.ts)
			.then((pending)=>{
				if(!pending) return;
				//parse recicpents here
				if(pending.recipients == 'anyone'){
					pending.recipients = _.filter(Slack.users, (user)=>user !== pending.user);
				}
				return Cache.delPending(event.item.ts)
					.then(()=>Geobot.storeMessage(pending.user, pending.recipients, pending.text))
			})
	},

	storeGeo : (user, lat, lon)=>{
		//log.debug('storing geo for', user);
		return Cache.hasGeo(user)
			.then((hasGeo)=>{
				if(!hasGeo){
					log.debug('first geo got!', user)
					return Messages.firstGeo(user);
				}
			})
			.then(()=>Cache.setGeo(user, lat, lon))
			.then(()=>Geobot.checkMessagesForUser(user));
	},
	storeMessage : (user, recipients, text)=>{
		log.debug('storaging message', user, recipients, text);
		return Cache.getGeo(user)
			.then((geo)=>DB.storeMessage(user, geo, recipients, text))
			.then(()=>Messages.msgStored(user))
			.catch((err)=>log.error(err));
	},

	checkMessagesForUser : (user)=>{
		return Cache.getGeo(user)
			.then((geo)=>DB.getNearbyMessagesForUser(user, geo))
			.then((msgs)=>{
				return Promise.all(_.map(msgs, (msg)=>{
					return DB.removeUserFromMessage(msg, user)
						.then(()=>Messages.geomessage(user, msg))
				}));
			});
	},

	checkOldGeos : ()=>{
		return Cache.getGeos(Slack.users)
			.then((geos)=>{
				return Promise.all(_.map(geos, (geo, user)=>{
					if(!geo) return;

					//TODO; make work
					//const isOld = Moment(geo.ts).isAfter(Moment().subtract(1, 'hours'));
					//if(isOld) return Cache.delGeo(user).then(()=>Messages.oldGeo(user));
				}));
			})
			.catch((err)=>log.error(err));
	},

	parseMessage : (msg)=>{
		log.debug('parsing', msg);
		return Cache.hasGeo(msg.user)
			.then((hasGeo)=>{
				if(!hasGeo){
					log.debug('No geo', msg.user);
					return Messages.setup(msg.user)
						.then(()=>log.debug('Sent setup message', msg.user))
				}

				const recipients = utils.getRecipients(msg.text, Slack.users);

				return Messages.confirm(msg.user, recipients, msg.text)
					.then((confirmMsg)=>Cache.setPending(confirmMsg.ts, {
						user : msg.user,
						recipients : recipients,
						text : msg.text,
						id : confirmMsg.ts
					}))
			})
			.catch((err)=>log.error(err));
	}
};

module.exports = Geobot;