const _ = require('lodash');
const redis = require('redis').createClient(process.env.REDIS_URL);

const FIVE_MINS = 60 * 5;

redis.on('error', (err)=>{
	redis.end();
	console.log('REDIS ERROR');
});

const cache = {
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
	hasGeo : (user) => cache.getGeo(user).then((geo)=>!!geo),
	getGeo : (user) => cache.get(`geo|${user}`),
	setGeo : (user, lat, lon) => cache.set(`geo|${user}`, { lat, lon, ts : _.now()}),
	delGeo : (user) => cache.del(`geo|${user}`),

	getGeos : (users)=>{
		return Promise.all(_.map(users, (user)=>cache.getGeo(user).then((geo)=>[user, geo])))
			.then((pairs)=>_.fromPairs(pairs));
	},


	//Pending
	getPending : (id)=>cache.get(`pending|${id}`),
	delPending : (id)=>cache.del(`pending|${id}`),
	setPending : (id, msg)=>{
		return cache.set(`pending|${id}`, msg)
			.then(()=>redis.expire(`pending|${id}`, FIVE_MINS))
	},

	getAllPending : ()=>{
		return new Promise((resolve, reject)=>{
			redis.keys(`pending|*`, (err, keys)=>{
				Promise.all(_.map(keys, (key)=>cache.get(key)))
					.then((pending)=>resolve(pending))
			})
		})
	}


};

module.exports = cache;