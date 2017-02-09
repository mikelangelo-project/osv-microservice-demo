#!/bin/bash

MASTER_ENDPOINT=`curl -s http://192.168.122.231:8000/masterendpoint`

echo "Uploading to $MASTER_ENDPOINT"

for i in $(seq 1 $1)
do 
	curl -X POST -F "image=@/home/lemmy/dl/IMG_0995.PNG" http://$MASTER_ENDPOINT/task
done