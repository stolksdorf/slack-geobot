const _ = require('lodash');
const config = require('nconf');
const Moment = require('moment');

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
			.then(()=>Slack.connect(config.get('slack_token'), config.get('bot')))
			.then(()=>Geobot.checkOldGeos())
			.then(()=>console.log('Geobot ready!'))
	},
	msgHandler : (msg) =>{
		const isCmd = msgHas(msg.text, ['geobot', Slack.botId]) && msg.user == 'scott';
		if(isCmd) return Commands.execute(msg);

		return Geobot.parseMessage(msg)
	},
	reactionHandler : (msg)=>{
		console.log('reaction', msg);




	},

	storeGeo : (user, lat, lon)=>{
		console.log('storing geo for', user);
		return Cache.hasGeo(user)
			.then((hasGeo)=>{
				if(!hasGeo) Messages.firstGeo(user);
			})
			.then(()=>Cache.setGeo(user, lat, lon))
			.then(()=>Geobot.checkMessagesForUser(user));
	},
	storeMessage : (user, recipients, text)=>{
		return Cache.getGeo(user)
			.then((geo)=>DB.storeMessage(user, geo, recipients, text))
			.then(()=>Messages.msgStored(user))
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
			}).catch((err)=>console.log(err))
	},

	parseMessage : (msg)=>{
		return Cache.hasGeo(msg.user)
			.then((hasGeo)=>{
				if(!hasGeo) return Messages.setup(msg.user);

				const recipients = utils.getRecipients(msg.text);

				return Messages.confirm(msg.user, recipients, msg.text)
					.then((confirmMsg)=>Cache.setPending(confirmMsg.ts, {
						user : msg.user,
						recipients : recipients,
						text : msg.text
					}));
			})

		/*

		Cache.setPending()

		Messages.confirm(msg.user, [], geo, msg.text)
			.then((confirmMsg)=>{
				return Cache.setPending(confirmMsg.ts, )
			})

		//Store the message
		//send the
		*/

	},


	//dev
	dm : Slack.directMessage
};


setTimeout(()=>{
	//Geobot.storeGeo('scott', 45, 56);
}, 500);

module.exports = Geobot;