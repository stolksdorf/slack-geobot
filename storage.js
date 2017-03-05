const _ = require('lodash');
const redis = require("redis").createClient(process.env.REDIS_URL);

redis.on("error", function(err){
	redis.end();
	console.log('REDIS ERROR');
});

const attemptParse = (json) => {
	try{
		return JSON.parse(json);
	}catch(e){
		return json;
	}
}

const PREFIX = 'geobot';

module.exports = storage = {
	get : (key)=>{
		return new Promise((resolve, reject)=>{
			redis.get(`${PREFIX}|${key}`, (err, res)=>{
				if(err) return reject(err);
				return resolve(attemptParse(res));
			});
		});
	},
	set : (key, val)=>{
		return new Promise((resolve, reject)=>{
			redis.set(`${PREFIX}|${key}`, JSON.stringify(val), (err)=>{
				if(err) return reject(err);
				return resolve();
			});
		});
	},

	clearAll : ()=>{
		redis.keys(`${PREFIX}*`, (err, keys)=>{
			console.log(keys);
			_.each(keys, (key)=>redis.del(key));
		})
	},

	hasGeo : (user) => storage.getGeo(user).then((geo)=>!!geo),
	getGeo : (user) => storage.get(`geo|${user}`),
	setGeo : (user, geo) => storage.set(`geo|${user}`, geo),

	getMsgs : (user) => storage.get(`msg|${user}`),
	setMsg  : (user, msgObj) => {
		return storage.getMsgs(user)
			.then((msgs) => {
				msgs = msgs || [];
				msgs.push(msgObj);
				return storage.set(`msg|${user}`, msgs);
			})
	}

};