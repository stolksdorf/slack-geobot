const _ = require('lodash');
const utils = require('./utils.js');

const mongoose = require('mongoose');
mongoose.Promise = Promise;
const dbPath = process.env.MONGODB_URI || process.env.MONGOLAB_URI || 'mongodb://localhost/geobot';

const GeomessageSchema = mongoose.Schema({
	text       : {type : String, default : ''},
	author     : {type : String, default : ''},
	recipients : [String],

	ts  : { type: Date, default: Date.now },
	geo : {
		lat : {type: Number, default:0},
		lon : {type: Number, default:0}
	}
}, {
	versionKey: false,

});

const Geomessage = mongoose.model('Geomessage', GeomessageSchema);


const db = {
	connect : ()=>{
		if(mongoose.connection.readyState == 1) return Promise.resolve();
		return mongoose.connect(dbPath)
			.catch((err)=>{
				console.error('Error : Could not connect to a Mongo Database.');
				console.error('        If you are running locally, make sure mongodb.exe is running.');
				throw err;
			});
	},
	close : ()=>{
		return new Promise((resolve, reject) => {
			mongoose.connection.close(()=>{
				return resolve();
			});
		});
	},
	clear : ()=>{
		return Geomessage.find({}).remove().exec();
	},


	removeUserFromMessage : (geomsg, user)=>{
		geomsg.recipients = _.remove(geomsg.recipients, user);
		if(geomsg.recipients.length == 0) return geomsg.remove();
		return geomsg.save();
	},
	storeMessage : (author, geo, recipients, text)=>{
		return (new Geomessage({ author, geo, recipients, text })).save();
	},
	getMessagesForUser : (user)=>{
		return Geomessage.find({ recipients : user })
	},
	getNearbyMessagesForUser : (user, geo, dist=50)=>{
		return db.getMessagesForUser(user)
			.then((msgs)=>{
				return _.filter(msgs, (msg) => utils.dist(geo, msg.geo) <= dist );
			});
	},

	getAll : ()=>Geomessage.find({})
};

module.exports = db;