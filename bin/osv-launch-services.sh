#!/bin/bash

# To compose the package, use the following command
#
# capstan package compose --update node-micro/common
#

echo "Launching key-value store"
byobu-tmux new-window 'sudo ~/dev/bin/capstan run -m 200M -c 1 -n vhost --mac="A2:13:15:00:80:01" -e "/node keyvaluestore.js" -i node-micro/common node-micro-keyvaluestore && bash -l'

sleep 1

echo "Launching database"
byobu-tmux new-window 'sudo ~/dev/bin/capstan run -c 1 -n vhost --mac="A2:13:15:00:80:02" -e "/node db.js 192.168.122.231:8000" -i node-micro/common node-micro-db && bash -l'

sleep 1

echo "Launching storage"
byobu-tmux new-window 'sudo ~/dev/bin/capstan run -c 1 -n vhost --mac="A2:13:15:00:80:03" -e "/node storage.js 192.168.122.231:8000" -i node-micro/common node-micro-storage && bash -l'

sleep 1

echo "Launching master"
byobu-tmux new-window 'sudo ~/dev/bin/capstan run -c 1 -n vhost --mac="A2:13:15:00:80:04" -e "/node master.js 192.168.122.231:8000" -i node-micro/common node-micro-master && bash -l'
