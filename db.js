const express = require('express')  
var bodyParser = require('body-parser');
var request = require('request')
var os = require('os');

const app = express()  
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const port = 8001

var dataStore = {}
var oldestNotFinishedTask = 0

if (process.argv.length < 3) {
    console.log("Usage: node db.js <KEYVALUESTORE_ENDOPOINT>")
    process.exit()
} else {
    kvEndpoint = 'http://' + process.argv[2]
}

// Get DB IP and try to report it to the key-value registry
require('dns').lookup(require('os').hostname(), function (err, address, fam) {
	// POST the address to the registry
	var options = {
		uri: kvEndpoint + "/dbendpoint",
		method: 'POST',
		json: { "value": address + ":" + port }
	}

	request(options, function(error, response, body) {
		// If post was successful, continue, otherwise inform the user and exit
		if (!error && response.statusCode == 200) {
			console.log("Database endpoint registered")
		} else {
			console.log("Error has occurred: ", response.statusCode)
			process.exit()
		}
	})
})

app.post('/task', (req, res) => {  
	var taskId = dataStoreSize()
	dataStore[taskId] = {
		"id": taskId,
		state: 0
	}

	res.send("" + taskId)
})

app.get('/task/next', (req, res) =>{
	for (var i = oldestNotFinishedTask; i < dataStoreSize(); i++) {
		if ((dataStore[i]['state'] == 2) && (i == oldestNotFinishedTask)) {
			oldestNotFinishedTask = oldestNotFinishedTask + 1
			continue
		}

		if (dataStore[i]['state'] == 0) {
			dataStore[i]['state'] = 1
			res.send(dataStore[i])
			return
		}
	}

	res.status(404).send({'id': -1, 'state': 0})
})

app.get('/task/:taskId', (req, res) => {
	var taskId = req.params.taskId

	if (taskId in dataStore) {
		res.send(dataStore[taskId])
	} else {
		res.status(404).send("Task not found")
	}
})

app.post('/task/:taskId/finish', (req, res) => {
	var taskId = req.params.taskId

	if (taskId in dataStore) {
		dataStore[taskId]['state'] = 2
		res.send()
	} else {
		res.status(404).send("Task not found")
	}
})

function dataStoreSize() {
	return Object.keys(dataStore).length
}

app.listen(port, (err) => {  
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`Database is listening on ${port}`)
})