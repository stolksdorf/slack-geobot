const Moment = require('moment');
const Slack = require('./slack.api.js');


module.exports = {
	setup : (user)=>{
		return Slack.msg(user,`Looks like your GPS isn't configured, let's get you setup.

1. First download this app here, https://play.google.com/store/apps/details?id=com.mendhak.gpslogger&hl=en
2. After it's installed, go into Settings > General
  - Startup on bootup, checked
  - Start on app launch, checked
  - Hide notification buttons, checked
  - Hide notification from status bar, checked
3. Settings > Logging details
  - Log to custom URL, checked
  - Set the URL to \`http://slack-geobot.herokuapp.com/[username]?lat=%LAT&lon=%LON\`
  - username should be what shows up when your type \`@yourname\`
  - eg. \`http://slack-geobot.herokuapp.com/scott?lat=%LAT&lon=%LON\`
4. Settings > Performance
  - 'Don't log if I'm not moving', checked
5. You are all set! I will message you when I receive your first GPS ping
`);
	},

	firstGeo : (user)=>{
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
			//.then(()=>Slack.react(confirmMsg, 'thumbsdown'))
			.then(()=>confirmMsg);
	},

	msgStored : (user)=>{
		return Slack.msg(user, 'Great! Your geo-locked message is stored :)');
	}
}
