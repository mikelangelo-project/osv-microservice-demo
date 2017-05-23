# Compose unikernels to run application on Kubernetes
Section [Here Come Unikernels](./README.md#herecomeunikernels) describes how to prepare application
to run it locally using OSv unikernels. Similar steps need to be taken when composing them to run on
Kubernetes, and luckily there is a script to automate it (replace imageserver pod ID to match your environment):
```bash
$ npm install
$ ./virtlet_deploy/compose-and-upload-images.sh image-server-1782580915-zv2w3
```

Script `compose-and-upload-images.sh` first composes unikernel for each service and sets appropriate
boot command for it. Then it uploads the unikernel to the imageserver. When the script finishes, your
Kubernetes cluster is ready to actually boot unikernels, but note two things:

1. image urls are now on `image-service.kube-system` endpoint instead on S3. Therefore you need to
   use `micro-deployments-local.yaml` blueprint instead `micro-deployments.yaml` to deploy application.
2. while S3 server serves via `https` the image-server is plain `http`. At the time of writing this
   document, one needs to reconfigure Virtlet runtime to use SSL; see Virtlet documentation how to do
   this.

One may be wondering why are we uploading same unikernel 6 times, only with different boot command.
Answer is really simple: because Virtlet does not support setting boot command dynamically (yet).

