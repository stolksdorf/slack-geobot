const Moment = require('moment');
const Slack = require('./slack.api.js');


module.exports = {
	welcome : (user)=>{
		return console.log(`Looks like you aren't sending up your GPS, let's get you setup`);

		return Slack.msg(user, '')
	},

	firstGeo : (user)=>{
		return console.log('first GPS!');

		return Slack.msg(user,
			`I just received your first GPS! Looks like everything is working :)`
		)
	},

	geomessage : (user, msg)=>{
		return Slack.msg(user,
`*${msg.author}* says:
> ${msg.text}

_sent on ${Moment(msg.ts).format('MMM Do H:mm')}_`
		);

	},

	warning : (user)=>{
		console.log('I have not gotten a GPS update in a while, double check everything is working?');
	},

	confirm : (user, targets, msg)=>{
		let confirmMsg;
		return Slack.msg(user, `

`)
			.then((_msg)=>{ confirmMsg = _msg})
			.then(()=>Slack.react(confirmMsg, 'thumbsup'))
			.then(()=>Slack.react(confirmMsg, 'thumbsdown'))
			.then(()=>confirmMsg);
	},
}
