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
    console.log("Usage: node db.js <KEYVALUESTORE_ENDOPOINT>")
    process.exit()
} else {
    kvEndpoint = 'http://' + process.argv[2]
}

// Get DB IP and try to report it to the key-value registry
require('dns').lookup(require('os').hostname(), function (err, address, fam) {
	// POST the address to the registry
	var options = {
		uri: kvEndpoint + "/storageendpoint",
		method: 'POST',
		json: { "value": address + ":" + port }
	}

	request(options, function(error, response, body) {
		// If post was successful, continue, otherwise inform the user and exit
		if (!error && response.statusCode == 200) {
			console.log("Storage endpoint registered")
		} else {
			console.log("Error has occurred: ", response.statusCode)
			process.exit()
		}
	})
})

app.post('/upload/:taskId', (req, res) => {
	var taskId = req.params.taskId

	if (!req.files) {
		res.status(400).send("Image not found")
		return
	}

	var image = req.files.image
	console.log("Saving file")
	image.mv(imagePath(taskId), (err) => {
		if (err) {
			console.log("Error")
			res.status(500).send(err)
		} else {
			console.log("done")
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

app.listen(port, (err) => {  
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`Storage is listening on ${port}`)
})