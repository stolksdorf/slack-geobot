const request = require('superagent-promise')(require('superagent'), Promise);
const _ = require('lodash');
const WebSocket = require('ws');

const Slack = function(token, botInfo){
	let socket;

	const processTeamData = function(teamData){
		const bot = _.find(teamData.users, (user) => {
			return user.id == teamData.self.id;
		});
		if(bot) slack.botId = bot.profile.bot_id;

		_.each(teamData.channels, (channel)=>{ slack.channels[channel.id] = channel.name; });
		_.each(teamData.groups,   (channel)=>{ slack.channels[channel.id] = channel.name; });
		_.each(teamData.users,    (user)   =>{ slack.users[user.id] = user.name; });
		_.each(teamData.ims,      (im)     =>{ slack.dms[im.id] = slack.users[im.user]});
	};

	const processIncomingMsg = function(msg){
		const res = _.assign({}, msg);

		res.text = res.text || "";
		res.channelId = msg.channel;
		res.userId = msg.user || msg.bot_id;

		//For reactions
		if(msg.item && msg.item.channel) res.channelId = msg.item.channel;

		if(res.channelId) res.channel = slack.channels[res.channelId];
		if(res.userId) res.user = slack.users[res.userId];
		if(msg.username) res.user = msg.username;
		if(res.channelId && res.channelId[0] == 'D'){
			res.isDirect = true;
			res.channel = 'direct';
		}
		return res;
	};

	const slack = {
		channels : {},
		users    : {},
		dms      : {},
		botId    : '',

		api : (command, payload) => {
			return request
				.get(`https://slack.com/api/${command}`)
				.query(_.assign({}, payload, { token : token }))
				.then((res)=>{
					if(res.body && res.body.ok === false) throw res.body.error;
					return res;
				});
		},
		reply : (channel, text) => {
			return slack.api('chat.postMessage', {
				channel : channel,
				text : text,
				username   : botInfo.name,
				icon_emoji : botInfo.icon
			})
		},
		directMessage : (user, text) => {
			const userChannel = _.findKey(slack.dms, (dm)=>{
				return dm == user;
			});
			return slack.reply(userChannel, text);
		},
		openSocket : (handler) => {
			return slack.api('rtm.start')
				.then((res) => {
					return new Promise((resolve, reject)=>{
						if (!res.body.ok || !res.body.url) return reject(`bad access token`);

						processTeamData(res.body);
						socket = new WebSocket(res.body.url);

						socket.on('open', resolve);
						socket.on('message', (rawData, flags) => {
							const msg = JSON.parse(rawData);
							if(msg.bot_id === slack.botId) return;
							const message = processIncomingMsg(msg);
							if(message.user == 'logbot') return;
							if(message.type !== 'message') return;
							handler(message);
						});
					});
				})
		},
	}
	return slack;
};

module.exports = Slack;