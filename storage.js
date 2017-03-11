const _ = require('lodash');
const redis = require('redis').createClient(process.env.REDIS_URL);
const mongoose = require('mongoose');
mongoose.Promise = Promise;
const dbPath = process.env.MONGODB_URI || process.env.MONGOLAB_URI || 'mongodb://localhost/geobot';

redis.on('error', (err)=>{
	redis.end();
	console.log('REDIS ERROR');
});


const GeomessageSchema = mongoose.Schema({
	text : {type : String, default : ''},
	author : {type : String, default : ''},
	recipients : [String],


	ts  : { type: Date, default: Date.now },
	geo : {
		lat : {type: Number, default:0},
		lon : {type: Number, default:0}
	}
}, {
	versionKey: false,
	toJSON : {
		transform: (doc, ret, options) => {
			delete ret._id;
			return ret;
		}
	}
});
const Geomessage = mongoose.model('Geomessage', GeomessageSchema);


const attemptParse = (json) => {
	try{ return JSON.parse(json); }
	catch(e){ return json };
}

const PREFIX = 'geobot';

module.exports = Storage = {
	connect : ()=>{

		if(mongoose.connection.readyState == 1) return Promise.resolve();

		return mongoose.connect(dbPath)
			.catch((err)=>{
				console.error('Error : Could not connect to a Mongo Database.');
				console.error('        If you are running locally, make sure mongodb.exe is running.');
				throw err;
			});
	},


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

	hasGeo : (user) => Storage.getGeo(user).then((geo)=>!!geo),
	getGeo : (user) => Storage.get(`geo|${user}`),
	setGeo : (user, geo) => Storage.set(`geo|${user}`, geo),
	delGeo : (user) => Storage.del(`geo|${user}`),

	getGeos : (users)=>{
		return Promise.all(_.map(users, (user)=>{
				return Storage.getGeo(user).then((geo)=>[user, geo])
			}))
			.then((pairs)=>_.fromPairs(pairs));
	},

	getMsgs : (user) => Storage.get(`msg|${user}`),
	setMsgs : (user, val) => Storage.set(`msg|${user}`, val || []),
	setMsg  : (user, msgObj) => {
		return Storage.getMsgs(user)
			.then((msgs) => {
				msgs = msgs || [];
				msgs.push(msgObj);
				return Storage.setMsgs(user, msgs);
			})
	},

	getPending : (id)=>Storage.set(`pending|${id}`),
	delPending : (id)=>Storage.del(`pending|${id}`),
	setPending : (id, msg, geo)=>Storage.set(`pending|${id}`, geo),


};