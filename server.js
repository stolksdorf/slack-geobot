const _ = require('lodash');

const express = require('express');
const app = express();

const config = require('nconf')
	.argv()
	.env({ lowerCase: true })
	.file('environment', { file: `config/${process.env.NODE_ENV}.json` })
	.file('defaults', { file: 'config/default.json' });


const Geobot = require('./geobot.js');
const Storage = require('./storage.js');

//////////////////////////

app.get('/test', (req, res)=>{
	Geobot.sendWelcome('scott');
	return res.send();
});

app.get('/clear', (req, res) => {
	Storage.clearAll();

	console.log('cleared!');

	return res.send();
});

app.get('/msg/:user', (req, res)=>{
	Geobot.checkMessagesForUser(req.params.user);

	return res.send();
})

///////////////////`



app.get('/log/:user', (req, res) => {
	const user = req.params.user;
	Geobot.storeGeo(user, req.query.lat, req.query.lon);
	Geobot.dm(req.params.user, `got your geo! ${req.query.lat} ${req.query.lon}`);
	return res.status(200).send('working');
});


const PORT = process.env.PORT || 8000;

Geobot.start()
	.then(()=>{
		const httpServer = app.listen(PORT, () => {
			console.log(`server on port:${PORT}`);
		});
	});
