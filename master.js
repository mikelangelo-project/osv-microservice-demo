const express = require('express')  
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload')
var request = require('request')
var ip = require('ip');
var os = require('os');

const app = express()  
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(fileUpload())

const port = process.env.MICRO_MASTER_PORT || process.env.PORT || 9003;

var dbEndpoint
var storageEndpoint

kvEndpoint = require('./common').getKeyvaluestoreEndpoint();
if (!kvEndpoint){
	console.log("Usage: node master.js <KEYVALUESTORE_ENDOPOINT>")
	console.log("Alternatively, specify MICRO_KEYVALUESTORE_ENDPOINT env variable.")
	process.exit()
}

// Get Master IP and try to report it to the key-value registry
setTimeout(registerService, 0, 'masterendpoint', ip.address())

function registerService(service, address) {
	// POST the address to the registry
	var options = {
		uri: kvEndpoint + "/" + service,
		json: { "value": address + ":" + port }
	}

	request.post(options, function(error, response, body) {
		// If post was successful, continue, otherwise inform the user and exit
		if (!error && response.statusCode == 200) {
			console.log("Master endpoint registered")

			getServiceEndpoints()
		} else {
			console.log("Key-value store is not available")
			setTimeout(registerService, 1000, service, address)
		}
	})
}

app.post('/task', (req, res) => {
	// Make a new task.
	request.post({uri: dbEndpoint + '/task'}, (dbError, dbResponse, dbBody) => {
		if (!dbError && dbResponse.statusCode == 200) {
			// If the task was successful, we should also store the image in storage.
			taskId = dbBody

			var formData = {
				image: req.files.image.data
			}

			var postImage = {
				uri: storageEndpoint + '/upload/' + taskId,
				formData: formData
			}

			request.post(postImage, (storageError, storageResponse, storageBody) => {
				if (!storageError && storageResponse.statusCode == 200) {
					// Since we have the confirmation that the requested image is successfully
					// stored, we can change the status of the task to "ready"
					request.post({uri: dbEndpoint + '/task/' + taskId + '/ready'})
					res.send()
				} else {
					res.status(500).send("Error uploading image: " + storageError)
				}
			})
		} else {
			res.status(500).send("Error creating task: " + dbError)
		}
	})
})

app.get('/task/next', (req, res) => {
	request.get({uri: dbEndpoint + '/task/next'}).pipe(res)
})

app.get('/task/:taskId/download', (req, res) => {
	var taskId = req.params.taskId

	// Request a download from the storage.
	request.get({uri: storageEndpoint + '/download/' + taskId}).pipe(res)
})

app.post('/task/:taskId/finish', (req, res) => {
	var taskId = req.params.taskId

	request.post({uri: dbEndpoint + '/task/' + taskId + '/finish'}).pipe(res)
})

app.get('/task/:taskId/ready', (req, res) => {
	var taskId = req.params.taskId

	request.get({uri: dbEndpoint + '/task/' + taskId}, (dbError, dbStatus, dbBody) => {
		if (!dbError && dbStatus.statusCode == 200) {
			data = JSON.parse(dbBody)
			res.send(data.state == 2)
		} else {
			res.status(dbStatus.statusCode).send(dbError)
		}
	})
})

function getServiceEndpoints() {
	if (!dbEndpoint) {
		request(kvEndpoint + '/dbendpoint', (error, response, body) => {
			if (!error && response.statusCode == 200) {
				dbEndpoint = 'http://' + body
			} else {
				console.log("Error getting DB service.")
			}
		})
	}

	if (!storageEndpoint) {
		request(kvEndpoint + '/storageendpoint', (error, response, body) => {
			if (!error && response.statusCode == 200) {
				storageEndpoint = 'http://' + body
			} else {
				console.log("Error getting Storage service.")
			}
		})
	}

	if (dbEndpoint && storageEndpoint) {
		startService()
	} else {
		setTimeout(getServiceEndpoints, 1000)
	}
}

function startService() {
	app.listen(port, (err) => {
		if (err) {
			return console.log('something bad happened', err)
		}

		console.log(`Master is listening on ${port}`)
	})
}

console.log("Running master on port: ", port);
console.log("Using keyvaluestore endpoint: ", kvEndpoint);
