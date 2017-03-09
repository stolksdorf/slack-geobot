const _ = require('lodash');
const config = require('nconf');
const Moment = require('moment');

const Messages = require('./messages.js');
const Commands = require('./commands.js');
const dist = require('./distance.js')
const Storage = require('./storage.js');
const Slack = require('./slack.api.js');


//TODO: move these into a utils
const getTargets = (msg, slackUsers)=>{
	let targets = _.filter(slackUsers, (name, id)=>{
		return msg.text.indexOf(`<@${id}>`) !== -1;
	});

	//If no user was specified, send it to all users
	if(_.isEmpty(targets)) return _.filter(slackUsers, (user)=>user != msg.user);
	return targets;
}

const sortMessagesByDistance = (msgs, geo)=>{
	return _.groupBy(msgs, (msg)=>{
		if(dist(msg.geo, geo) <= config.get('distance')) return 'near';
		return 'far';
	});
};

const msgHas = (msg, ...filters)=>{
	if(!msg) return false;
	msg = msg.toLowerCase();
	return _.every(filters, (opts)=>{
		if(_.isString(opts)) opts = [opts];
		return _.some(opts, (opt)=>msg.indexOf(opt.toLowerCase()) !== -1)
	});
};

//const isCmd



const Geobot = {
	start : ()=>{
		Slack.on('message', Geobot.handler);
		//Slack.on('reaction_added', Geobot.handler);
		return Slack.connect(config.get('slack_token'), config.get('bot'))
			.then(()=>Geobot.checkOldGeos())
			.then(()=>console.log('Geobot ready!'))
	},
	handler : (msg) =>{
		console.log(msg);
		const isCmd = msgHas(msg.text, ['geobot', Slack.botId]) && msg.user == 'scott';
		if(isCmd) return Commands.execute(msg)


		console.log('isCmd', isCmd);

		console.log(msg.text);

		console.log(Slack.users);


		console.log(getTargets(msg));


	},

	send : require('./messages.js'),

	//////

	storeGeo : (user, lat, lon)=>{
		console.log('storing geo for', user);
		return Storage.hasGeo(user)
			.then((hasGeo)=>{
				if(!hasGeo) Geobot.send.firstGeo(user);
			})
			.then(()=>{
				return Storage.setGeo(user, {
					lat,
					lon,
					ts : _.now()
				});
			})
			.then(()=>{
				return Geobot.checkMessagesForUser(user);
			});
	},
	storeMessage : (user, targets, text)=>{
		return Storage.getGeo(user)
			.then((geo)=>{
				if(!geo) return Geobot.send.welcome(user);

				return Promise.all(_.map(targets, (target)=>{
					console.log('storing message for', target);
					return Storage.setMsg(target, {
						text   : text,
						author : user,
						ts     : _.now(),
						geo    : geo
					});
				}))
				.then(()=>Geobot.send.confirm(user, targets, text))
			})
	},

	checkMessagesForUser : (user)=>{
		console.log('Checking messages for', user);
		let triggered;
		return Promise.all([
			Storage.getGeo(user),
			Storage.getMsgs(user)
		]).then((res)=>{
			const geo = res[0];
			const msgs = res[1];

			//TODO: Add check for no geo, or no messages

			console.log('geo and msgs', geo, msgs);

			const sorted = sortMessagesByDistance(msgs, geo);
			triggered = sorted.near;

			//Remove triggered messages from storage
			return Storage.setMsgs(user, sorted.far);
		})
		.then(()=>{
			return Promise.all(_.map(triggered, (msg)=>{
				return Geobot.send.geomessage(user, msg);
			}));
		});
	},


	checkOldGeos : ()=>{
		return Storage.getGeos(Slack.users)
			.then((geos)=>{
				return Promise.all(_.map(geos, (geo, user)=>{
					if(!geo) return;

					//TODO; make work
					//const isOld = Moment(geo.ts).isAfter(Moment().subtract(1, 'hours'));
					//if(isOld) return Storage.delGeo(user).then(()=>Geobot.send.warning(user));
				}));
			}).catch((err)=>console.log(err))
	},


	//dev
	dm : Slack.directMessage
};


setTimeout(()=>{
	Geobot.storeGeo('scott', 45, 56);
}, 500);

module.exports = Geobot;