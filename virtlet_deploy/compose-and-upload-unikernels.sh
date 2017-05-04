#!/bin/bash

VIRTLET_POD="${1:-}"
PROJECT_DIR=.

function fun::step {
  local OPTS=""
  if [ "$1" = "-n" ]; then
    shift
    OPTS+="-n"
  fi
  GREEN="$1"
  shift
  if [ -t 2 ] ; then
    echo -e ${OPTS} "\x1B[97m* \x1B[92m${GREEN}\x1B[39m $*" >&2
  else
    echo ${OPTS} "* ${GREEN} $*" >&2
  fi
}

function fun::compose_and_upload {
  fun::step "Composing and uploading micro with --boot=${1}"
   
  capstan package compose micro --size=200MB --update --boot virtlet_${1} --pull-missing
  
  # rename qcow2 image before uploading to Virtlet container
  cp "$HOME/.capstan/repository/micro/micro.qemu" "$HOME/.capstan/repository/micro/micro-${1}.qemu"
  
  if [[ $VIRTLET_POD =~ ^image-server.* ]]; then
    echo Copy to ---image-server---  
    kubectl cp "$HOME/.capstan/repository/micro/micro-${1}.qemu" "kube-system/$VIRTLET_POD:/usr/share/nginx/html/"
  else
    echo Copy to ---virtlet---
    kubectl cp "$HOME/.capstan/repository/micro/micro-${1}.qemu" "kube-system/$VIRTLET_POD:/var/lib/libvirt/images/"
  fi
   
  rm "$HOME/.capstan/repository/micro/micro-${1}.qemu"
}

#
# Main
#

if [[ ${1:-} = "--help" || ${1:-} = "-h" ]]; then
  cat <<EOF >&2
Usage: ./compose-and-upload-unikernels.sh VIRTLET|IMAGESERVER-POD

IMAGESERVER-POD is id of Pod where imageserver server runs. Query it with:
$ kubectl get pods -n kube-system | grep image-server
Example value: image-server-wcn06

NOTE: Instead of virtlet Pod you can specify image-server Pod and qcow2 images will
      be uploaded there instead. Use this only before deploying micro.yaml first time.
EOF
  exit 0
elif [[ ${1:-} = "" ]]; then
  echo Usage: ./compose-and-upload-unikernels.sh IMAGESERVER-POD
  echo Error: missing IMAGESERVER-POD argument
  exit 0
fi

cd $PROJECT_DIR
fun::compose_and_upload "keyvaluestore"
fun::compose_and_upload "master"
fun::compose_and_upload "db"
fun::compose_and_upload "storage"
fun::compose_and_upload "worker"
