const _ = require('lodash');

const config = require('nconf')
	.argv()
	.env({ lowerCase: true })
	.file('environment', { file: `config/${process.env.NODE_ENV}.json` })
	.file('defaults', { file: 'config/default.json' });


const express = require('express');
const app = express();

//Setup Slack logging
const Slack = require('./server/slack.api.js');
const log = require('pico-log');

log.trace = Slack.log;
log.debug = Slack.log;
log.info = Slack.info;
log.warn = Slack.warn;
log.error = Slack.error;

log.setLevel(config.get('loglevel'));



const Geobot = require('./server/geobot.js');

app.get('/:user', (req, res) => {
	const user = req.params.user;
	log.debug('GPS from ', user);
	Geobot.storeGeo(user, req.query.lat, req.query.lon);
	return res.status(200).send('working');
});


const PORT = process.env.PORT || 8000;
Geobot.start()
	.then(()=>{
		const httpServer = app.listen(PORT, () => {
			console.log(`server on port:${PORT}`);
		});
	})
	.catch((err)=>log.error(err));
