//TODO: Convert into a singleton object
//TODO: Add a general event emitter

const request = require('superagent');
const _ = require('lodash');
const WebSocket = require('ws');

const emitter = new (require('events'))();
let socket;


const processTeamData = (teamData)=>{
	const bot = _.find(teamData.users, (user)=>user.id == teamData.self.id);
	if(bot) Slack.botId = bot.profile.bot_id;

	_.each(teamData.channels, (channel)=>{ Slack.channels[channel.id] = channel.name; });
	_.each(teamData.groups,   (channel)=>{ Slack.channels[channel.id] = channel.name; });
	_.each(teamData.users,    (user)   =>{ Slack.users[user.id] = user.name; });
	_.each(teamData.ims,      (im)     =>{ Slack.dms[im.id] = Slack.users[im.user]});
};

const processIncomingEvent = (msg)=>{
	const res = _.assign({}, msg);

	res.text = res.text || "";
	res.channelId = msg.channel;
	res.userId = msg.user || msg.bot_id;

	//For reactions
	if(msg.item && msg.item.channel) res.channelId = msg.item.channel;

	if(res.channelId) res.channel = Slack.channels[res.channelId];
	if(res.userId) res.user = Slack.users[res.userId];
	if(msg.username) res.user = msg.username;
	if(res.channelId && res.channelId[0] == 'D'){
		res.isDirect = true;
		res.channel = 'direct';
	}
	return res;
};


const Slack = {
	channels : {},
	users    : {},
	dms      : {},

	botId    : '',
	token : '',
	info : {
		name : 'bot',
		icon :':robot:'
	},

	connect : (token, botInfo)=>{
		Slack.token = token;
		Slack.info = botInfo;

		return Slack.api('rtm.start')
			.then((data) => {
				return new Promise((resolve, reject)=>{
					if (!data.ok || !data.url) return reject(`bad access token`);
					processTeamData(data);
					socket = new WebSocket(data.url);

					socket.on('open', resolve);
					socket.on('message', (rawData, flags) => {
						const msg = JSON.parse(rawData);
						if(msg.bot_id === Slack.botId) return;
						const message = processIncomingEvent(msg);
						emitter.emit(message.type, message);
					});
				});
			})
	},

	api : (command, payload) => {
		return new Promise((resolve, reject)=>{
			request
				.get(`https://slack.com/api/${command}`)
				.query(_.assign({}, payload, { token : Slack.token }))
				.end((err, res)=>{
					if(err || res.body && res.body.ok === false) return reject(err || res.body.error);
					return resolve(res.body);
				});
		});
	},

	//Either channel name or user name
	msg : (target, text)=>{
		const dm = _.findKey(Slack.dms, (user)=>target == user);
		return Slack.api('chat.postMessage', {
			channel    : (dm || target),
			text       : text,
			username   : Slack.info.name,
			icon_emoji : Slack.info.icon
		})
	},

	react : (msg, emoji)=>{
		return Slack.api('reactions.add', {
			channel   : msg.channelId || msg.channel,
			name      : emoji,
			timestamp : msg.ts
		});
	},

	on : (event, handler)=>{
		return emitter.on(event, handler);
	}
}

module.exports = Slack;

/*

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

		//TODO: Change to dms?
		_.each(teamData.ims,      (im)     =>{ slack.dms[im.id] = slack.users[im.user]});
	};

	//TODO: change to 'event' ?
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
			return new Promise((resolve, reject)=>{
				request
					.get(`https://slack.com/api/${command}`)
					.query(_.assign({}, payload, { token : token }))
					.send((err, res)=>{
						if(err || res.body && res.body.ok === false) return reject(err || res.body.error);
						return resolve(res);
					});
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

*/