const express = require('express')  
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload')
var request = require('request')
var fs = require('fs')
var Jimp = require('jimp')

const app = express()  
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(fileUpload())

var masterEndpoint
var storageEndpoint

kvEndpoint = require('./common').getKeyvaluestoreEndpoint();
if (!kvEndpoint){
	console.log("Usage: node worker.js <KEYVALUESTORE_ENDOPOINT>")
	console.log("Alternatively, specify MICRO_KEYVALUESTORE_ENDPOINT env variable.")
	process.exit()
}

getServiceEndpoints()

function doWork() {
	request.get({uri: masterEndpoint + '/task/next'}, (err, res, body) => {
		if (!err && res.statusCode == 200) {
			task = JSON.parse(body)

			console.log("Working on task " + task.id)
			if (task && task.id != -1) {
				var imagePath = __dirname + '/data/worker/' + task.id + '.png'
				imagePath = imagePath.replace("//", "/"); // if _dirname is /, then we get //worker/1.png

				request.get({uri: masterEndpoint + '/task/' + task.id + '/download'}).pipe(fs.createWriteStream(imagePath)).on('close', () => {
					console.log("\tprocessing " + imagePath)

					Jimp.read(imagePath,(jimpErr, image) => {
						if (jimpErr) {
							console.log("\terror: " + jimpErr)
							setTimeout(doWork, 5000)
							return
						}

						image.invert().write(imagePath, () => {
							console.log('\tdone')

							var formData = {
								image: fs.createReadStream(imagePath),
							}

							var postImage = {
								uri: storageEndpoint + '/upload/' + task.id,
								formData: formData
							}

							request.post(postImage, (storageError, storageResponse, storageBody) => {
								if (!storageError && storageResponse.statusCode == 200) {
									request.post({uri: masterEndpoint + '/task/' + task.id + '/finish'})
									setTimeout(doWork, 1000)
								} else {
									console.log("\tError storing processed image")
									setTimeout(doWork, 5000)
								}
							})
						})
					})
				})
			} else {
				setTimeout(doWork, 5000)
			}
		} else {
			console.log("Nothing to do at the moment")

			setTimeout(doWork, 5000)
		}
	})
}

function getServiceEndpoints() {
	if (!masterEndpoint) {
		request(kvEndpoint + '/masterendpoint', (error, response, body) => {
			if (!error && response.statusCode == 200) {
				masterEndpoint = 'http://' + body
			} else {
				console.log("Error getting Master service.")
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

	if (masterEndpoint && storageEndpoint) {
		doWork()
	} else {
		setTimeout(getServiceEndpoints, 1000)
	}
}

console.log("Using keyvaluestore endpoint: ", kvEndpoint);
