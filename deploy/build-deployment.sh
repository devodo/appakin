#!/bin/bash

# first arg is your username on the azure server.

if [ $# -eq 0 ]; then
    echo "no argument provided"
    exit 1
fi

echo "arg is $1"
echo 'cleaning'

rm -r ./output
mkdir ./output

echo 'building web.api'

pushd ../../appakin/src/web.api
gulp build
popd

pushd ../../appakin/build-output
tar cf ../../appakin/deploy/output/appakin-deploy.tar ./web.api
popd

echo 'building solr.admin'

pushd ../../appakin/src/solr.admin
gulp build
popd

pushd ../../appakin/build-output
tar rf ../../appakin/deploy/output/appakin-deploy.tar ./solr.admin
popd

echo 'building web.public'

pushd ../../appakin-web/src/web.public
gulp build
popd

pushd ../../appakin-web/build-output
tar rf ../../appakin/deploy/output/appakin-deploy.tar ./web.public
popd

gzip ./output/appakin-deploy.tar

echo 'finished building deployment output'
echo 'uploading file'

scp -i ../../appakin-azure.key ./output/appakin-deploy.tar.gz $1@appakin.cloudapp.net:

echo 'finished uploading file'

