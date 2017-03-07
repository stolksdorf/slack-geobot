const Moment = require('moment');


module.exports = (Slack)=>{

	return {
		welcome : (user)=>{
			return console.log(`Looks like you aren't sending up your GPS, let's get you setup`);

			return Slack.directMessage(user, '')
		},

		firstGeo : (user)=>{
			return console.log('first GPS!');

			return Slack.directMessage(user,
				`I just received your first GPS! Looks like everything is working :)`
			)
		},

		geomessage : (user, msg)=>{
			return Slack.directMessage(user,
`*${msg.author}* says:
> ${msg.text}

_sent on ${Moment(msg.ts).format('MMM Do H:mm')}_`
			);

		},

		warning : (user)=>{
			console.log('I have not gotten a GPS update in a while, double check everything is working?');
		},

		confirm : (user, targets, msg)=>{
			return console.log('Send confirm!', user);
		},
	}
};