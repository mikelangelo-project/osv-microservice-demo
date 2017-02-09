const express = require('express')  
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload')
var request = require('request')

var os = require('os');

const app = express()  
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(fileUpload())

const port = 8002

if (process.argv.length < 3) {
    console.log("Usage: node storage.js <KEYVALUESTORE_ENDOPOINT>")
    process.exit()
} else {
    kvEndpoint = 'http://' + process.argv[2]
}

// Get DB IP and try to report it to the key-value registry
require('dns').lookup(require('os').hostname(), function (err, address, fam) {
	setTimeout(registerService, 0, 'storageendpoint', address)
})

function registerService(service, address) {
	// POST the address to the registry
	var options = {
		uri: kvEndpoint + "/" + service,
		json: { "value": address + ":" + port }
	}

	request.post(options, function(error, response, body) {
		// If post was successful, continue, otherwise inform the user and exit
		if (!error && response.statusCode == 200) {
			console.log("Storage endpoint registered")
			startService()
		} else {
			console.log("Key-value store is not available")
			setTimeout(registerService, 1000, service, address)
		}
	})
}


app.post('/upload/:taskId', (req, res) => {
	var taskId = req.params.taskId

	if (!req.files) {
		res.status(400).send("Image not found")
		return
	}

	var image = req.files.image
	image.mv(imagePath(taskId), (err) => {
		if (err) {
			res.status(500).send(err)
		} else {
			res.send()
		}
	})
})

app.get('/download/:taskId', (req, res) => {
	var taskId = req.params.taskId
	var path = imagePath(taskId)

	res.download(path)
})

function imagePath(taskId) {
	return __dirname + '/storage/' + taskId + '.png'
}

function startService() {
	app.listen(port, (err) => {
		if (err) {
			return console.log('something bad happened', err)
		}

		console.log(`Storage is listening on ${port}`)
	})
}