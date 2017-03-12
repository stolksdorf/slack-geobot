const Moment = require('moment');
const Slack = require('./slack.api.js');


module.exports = {
	setup : (user)=>{
		return Slack.msg(user,`Looks like your GPS isn't configured, let's get you setup.


`
);
	},

	firstGeo : (user)=>{
		return console.log('first GPS!');

		return Slack.msg(user,
			`I just received a GPS update! Looks like you set evrything up properly :tada:`
		)
	},

	geomessage : (user, msg)=>{
		return Slack.msg(user,
`*${msg.author}* says:
> ${msg.text}

_sent on ${Moment(msg.ts).format('MMM Do H:mm')}_`
		);

	},

	oldGeo : (user)=>{
		return Slack.msg(user,
			`I have not gotten a GPS update in a while, double check everything is working with the app?`
		);
	},

	confirm : (user, recipients, text)=>{
		if(typeof recipients == 'string') recipients = [recipients];
		let confirmMsg;
		return Slack.msg(user, `This message will be sent to *${recipients.join(', ')}* when they get near your current location. React with a :thumbsup: if this looks good.

> ${text}`)
			.then((msg)=>{ confirmMsg = msg})
			.then(()=>Slack.react(confirmMsg, 'thumbsup'))
			.then(()=>Slack.react(confirmMsg, 'thumbsdown'))
			.then(()=>confirmMsg);
	},

	msgStored : (user)=>{
		return Slack.msg(user, 'Great! Your geo-locked message is stored :)');
	}
}
