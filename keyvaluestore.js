const express = require('express')  
var bodyParser = require('body-parser');

const app = express()  
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const port = process.env.MICRO_KEYVALUESTORE_PORT || process.env.PORT || 9000;

var keyValueStore = {}
keyValueStore['masterendpoint'] = process.env.MICRO_MASTER_ENDPOINT;
keyValueStore['dbendpoint'] = process.env.MICRO_DB_ENDPOINT;
keyValueStore['storageendpoint'] = process.env.MICRO_STORAGE_ENDPOINT;

app.get('/:key/', (req, res) => {
	var key = req.params.key

	if (key in keyValueStore) {
		res.send(keyValueStore[key])
	} else {
		res.status(404).send("Key not found")
	}
})

app.post('/:key/', function(req, res) {
	var key = req.params.key
	var value = req.body.value

	console.log(key + "=" + value)

	if (!keyValueStore[key]) {
		keyValueStore[key] = value;
	} else {
		console.log('Prevented updating keyvaluestore, key = ' + key, ', value = ' + value);
	}
	res.send('')
})

app.listen(port, (err) => {  
	if (err) {
		return console.log('something bad happened', err)
	}

	console.log(`server is listening on ${port}`)
})

console.log("Running keyvaluestore on port: ", port);
