const _ = require('lodash');
const config = require('nconf');

const dist = require('./distance.js')
const Storage = require('./storage.js');
const Slack = require('./slack.api.js')(config.get('slack_token'), config.get('bot'));


Slack.openSocket((msg)=>{
	console.log(Slack.users);

	console.log(getTargets(msg));

	//Slack.directMessage('scott', msg.text);
});


const getTargets = (msg)=>{
	let targets = _.filter(Slack.users, (name, id)=>{
		return msg.text.indexOf(`<@${id}>`) !== -1;
	});
	if(_.isEmpty(targets)) return _.filter(Slack.users, (user)=>user != msg.user);
	return targets;
}



const Geobot = {

	sendWelcome : (user)=>{
		Slack.directMessage(user,
			`I just received your first GPS! Looks like everything is working :)`
		)
	},

	sendMessage : (user, msg)=>{

		console.log('sending message to', user);

	},

	sendConfirm : (user, msg)=>{

	},

	storeGeo : (user, lat, lon)=>{
		return Storage.hasGeo(user)
			.then((hasGeo)=>{
				if(!hasGeo) Geobot.sendWelcome(user);
			})
			.then(()=>{
				return Storage.setGeo(user, lat, lon);
			})
			.then(()=>{
				return Geobot.checkMessagesForUser(user);
			});
	},

	checkMessagesForUser : (user)=>{
		console.log('Checking messages for', user);
		let geo;
		Storage.getGeo(user)
			.then((_geo)=>{ geo = _geo})
			.then(()=>Storage.getMsgs(user))
			.then((msgs)=>{

				const triggered = _.filter(msgs, (msg)=>{
					return dist(msg.geo, geo) <= config.get('distance');
				});

				_.each(triggered, (msg)=>Geobot.sendMessage(user, msg));



				console.log(geo);
				console.log(msgs);


			});
	},

	storeMessage : (user, targets, text)=>{
		Storage.getGeo(user)
			.then((geo)=>{
				_.each(targets, (target)=>{
					console.log('storing message for', target);
					Storage.setMsg(target, {
						text : text,
						author : user,
						ts : _.now(),
						geo : {
							lat : geo.lat,
							lon : geo.lon
						}
					});
				});
			})


	},


	//dev
	dm : Slack.directMessage
};

module.exports = Geobot;