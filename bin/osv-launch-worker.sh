#!/bin/bash

WORKER_ID=`ps afx | grep qemu | grep worker | wc -l`

echo "Launching worker $WORKER_ID"
byobu-tmux new-window "sudo ~/dev/bin/capstan run -c 1 -n vhost -e '/node worker.js 192.168.122.231:8000' -i node-micro/common node-micro-worker$WORKER_ID && bash -l"