const _ = require('lodash');
const redis = require('redis').createClient(process.env.REDIS_URL);

const FIVE_MINS = 1000 * 60 * 5;

redis.on('error', (err)=>{
	redis.end();
	console.log('REDIS ERROR');
});

module.exports = Storage = {
	connect : ()=>{
		//TODO: Implement a connection prototol
		return Promise.resolve();
	},
	close : ()=>{

	},
	clear : ()=>{
		return new Promise((resolve, reject)=>{
			redis.flushdb((err, success)=>{
				if(err || !success) return reject(err);
				return resolve();
			});
		})
	},

	get : (key)=>{
		return new Promise((resolve, reject)=>{
			redis.get(key, (err, res)=>{
				if(err) return reject(err);
				try{ return resolve(JSON.parse(res)); }
				catch(e){ return resolve(res) };
			});
		});
	},
	set : (key, val)=>{
		return new Promise((resolve, reject)=>{
			redis.set(key, JSON.stringify(val), (err)=>{
				if(err) return reject(err);
				return resolve();
			});
		});
	},
	del : (key)=>{
		return new Promise((resolve, reject)=>{
			redis.del(key, (err)=>{
				if(err) return reject(err);
				return resolve();
			});
		});
	},


	//Geo
	hasGeo : (user) => Storage.getGeo(user).then((geo)=>!!geo),
	getGeo : (user) => Storage.get(`geo|${user}`),
	setGeo : (user, lat, lon) => Storage.set(`geo|${user}`, { lat, lon, ts : _.now()}),
	delGeo : (user) => Storage.del(`geo|${user}`),

	getGeos : (users)=>{
		return Promise.all(_.map(users, (user)=>Storage.getGeo(user).then((geo)=>[user, geo])))
			.then((pairs)=>_.fromPairs(pairs));
	},


	//Pending
	getPending : (id)=>Storage.set(`pending|${id}`),
	delPending : (id)=>Storage.del(`pending|${id}`),
	setPending : (id, msg)=>{
		return Storage.set(`pending|${id}`, msg)
			.then(()=>redis.expireat(`pending|${id}`, FIVE_MINS))
	},

	getAllPending : ()=>{

	}


};