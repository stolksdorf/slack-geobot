const _ = require('lodash');

const express = require('express');
const app = express();

const config = require('nconf')
	.argv()
	.env({ lowerCase: true })
	.file('environment', { file: `config/${process.env.NODE_ENV}.json` })
	.file('defaults', { file: 'config/default.json' });




const Slack = require('./slack.api.js')(config.get('slack_token'), config.get('bot'));

Slack.openSocket((msg)=>{
	console.log(msg);

	Slack.directMessage('scott', "yo");
})






app.get('/log/:user', (req, res) => {
	console.log(req.params.user);

	console.log(req.query);

	Slack.directMessage(req.params.user, `got your geo! ${req.query.lat} ${req.query.lon}`);

	return res.status(200).send('working');
});



const PORT = process.env.PORT || 8000;
const httpServer = app.listen(PORT, () => {
	console.log(`server on port:${PORT}`);
});