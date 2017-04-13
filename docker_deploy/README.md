# Deploy on Kubernetes using Docker containers

In our environment it was `PROJECT_DIR=$HOME/git-repos/osv-microservice-demo`.

## UI

Build container using the provided Dockerfile-ui:
```bash
$ cd $PROJECT_DIR
$ npm install
$ docker build -t mike/osv-microservice-demo-ui . -f docker_deploy/Dockerfile-ui
```

Optionally, you can run container locally to see if everything is allright:
```bash
$ docker run -t mike/osv-microservice-demo-ui
Master endpoint: http://micro-master.default.svc.cluster.local
Ui is listening on 80
```

Inject container to all DIND nodes since we don't know where Deployment will be scheduled:
```bash
$ docker save mike/osv-microservice-demo-ui | docker exec -i kube-node-1 docker load
$ docker save mike/osv-microservice-demo-ui | docker exec -i kube-node-2 docker load
```

Deploy on Kubernetes:
```bash
$ kubectl create -f docker_deploy/micro-ui.yaml
```

At this point Deployment should exist on Kubernetes with a single Pod. Visiting the Pod's IP should
show you the UI on port 80 by default.
