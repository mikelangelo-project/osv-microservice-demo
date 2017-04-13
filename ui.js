const express = require('express')  
var bodyParser = require('body-parser');
var request = require('request').defaults({ encoding: null });
var jade = require('jade');
var fs = require('fs');
var fileUpload = require('express-fileupload')

const app = express()  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload())
app.set('view engine', 'jade')


const port = process.env.MICRO_UI_PORT || process.env.PORT || 80;
const masterEndpoint = process.env.MICRO_MASTER_ENDPOINT || "http://micro-master.default.svc.cluster.local";
const uploadImageUrl = masterEndpoint + '/task'

function startService() {
	app.listen(port, (err) => {
		if (err) {
			return console.log('something bad happened', err)
		}
		console.log(`UI is listening on ${port}`)
	})
}

app.get('/', (req, res) => {
	var taskId = req.query.taskId;
	taskId = taskId ? taskId : "0";
	downloadImageUrl = `${masterEndpoint}/task/${taskId}/download`;

	request.get({url: downloadImageUrl, timeout: 3000}, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	        data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64'); 
	        res.render('index', { service: downloadImageUrl, imgData: data});
	    }else{
	    	res.render('index', { service: downloadImageUrl, imgData: "", message: "NO RESULT FOUND!"});
	    }
	});
})

app.get('/upload', (req, res) => {	
	res.render('upload', { service: uploadImageUrl});
})

app.post('/upload', (req, res) => {
	var postParams = {
		uri: uploadImageUrl,
		formData: {
			image: req.files.image.data
		},
		timeout: 3000
	};

	request.post(postParams, (storageError, storageResponse, storageBody) => {
		if (!storageError && storageResponse.statusCode == 200) {
			res.render('upload', { service: uploadImageUrl});
		} else {
			res.status(500).send("Error uploading image: " + storageError);
		}
	});	
})

startService();

console.log("Master endpoint:", masterEndpoint);
