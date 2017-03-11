const router = require('express').Router();

const Geobot = require('./src/geobot.js');
const Storage = require('./src/storage.js');


router.get('/test', (req, res)=>{
	Geobot.sendWelcome('scott');
	return res.send();
});

router.get('/clear', (req, res) => {
	Storage.clearAll();

	console.log('cleared!');

	return res.send();
});

router.get('/msg/:user', (req, res)=>{
	Geobot.checkMessagesForUser(req.params.user);

	return res.send();
})


module.exports = router;