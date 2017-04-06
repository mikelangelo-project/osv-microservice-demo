module.exports = {
	getKeyvaluestoreEndpoint: function(){
		if (process.argv.length == 3) {	    
		    return 'http://' + process.argv[2];
		} else if (process.env.MICRO_KEYVALUESTORE_ENDPOINT) {
		    return 'http://' + process.env.MICRO_KEYVALUESTORE_ENDPOINT;
		}
		return false;
	}
};
