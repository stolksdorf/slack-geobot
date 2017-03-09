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
	del : (key)=>{
		return new Promise((resolve, reject)=>{
			redis.del(`${PREFIX}|${key}`, (err)=>{
				if(err) return reject(err);
				return resolve();
			});
		});
	},

	delAll : ()=>{
		return new Promise((resolve, reject)=>{
			redis.keys(`${PREFIX}*`, (err, keys)=>{
				const fns = _.map(keys, (key)=>{
					return new Promise((resolve, reject)=>{
						redis.del(key, (err)=>{
							if(err) return reject();
							resolve();
						});
					});
				});
				resolve(Promise.all(fns))
			})

		})
	},

	hasGeo : (user) => storage.getGeo(user).then((geo)=>!!geo),
	getGeo : (user) => storage.get(`geo|${user}`),
	setGeo : (user, geo) => storage.set(`geo|${user}`, geo),
	delGeo : (user) => storage.del(`geo|${user}`),

	getGeos : (users)=>{
		return Promise.all(_.map(users, (user)=>{
				return storage.getGeo(user).then((geo)=>[user, geo])
			}))
			.then((pairs)=>_.fromPairs(pairs));
	},

	getMsgs : (user) => storage.get(`msg|${user}`),
	setMsgs : (user, val) => storage.set(`msg|${user}`, val || []),
	setMsg  : (user, msgObj) => {
		return storage.getMsgs(user)
			.then((msgs) => {
				msgs = msgs || [];
				msgs.push(msgObj);
				return storage.setMsgs(user, msgs);
			})
	},


	setPending : (id, msg, geo)=>{},
	delPending : (id)=>{},
	convertPending : (id)=>{}

};