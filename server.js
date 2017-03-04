const _ = require('lodash');

const express = require('express');
const app = express();

const config = require('nconf')
	.argv()
	.env({ lowerCase: true })
	.file('environment', { file: `config/${process.env.NODE_ENV}.json` })
	.file('defaults', { file: 'config/default.json' });




app.get('/', (req, res) => {
	return res.status(200).send('working');
});



const PORT = process.env.PORT || 8000;
const httpServer = app.listen(PORT, () => {
	console.log(`server on port:${PORT}`);
});