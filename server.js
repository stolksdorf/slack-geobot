const _ = require('lodash');

const config = require('nconf')
	.argv()
	.env({ lowerCase: true })
	.file('environment', { file: `config/${process.env.NODE_ENV}.json` })
	.file('defaults', { file: 'config/default.json' });


const express = require('express');
const app = express();


const log = require('loglevel');
//TODO: Add a Slack log message as a log level

const Geobot = require('./server/geobot.js');


app.get('/:user', (req, res) => {
	const user = req.params.user;
	Geobot.storeGeo(user, req.query.lat, req.query.lon);
	return res.status(200).send('working');
});


const PORT = process.env.PORT || 8000;

Geobot.start()
	.then(()=>{
		const httpServer = app.listen(PORT, () => {
			console.log(`server on port:${PORT}`);
		});
	});
