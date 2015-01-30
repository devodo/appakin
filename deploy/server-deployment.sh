#!/bin/bash

if [ $# -eq 0 ]; then
    echo 'no arguments provided'
    exit 1
fi

echo "arg is $1"

echo 'cleaning'

rm -r ./web.api
rm -r ./web.public
rm -r ./solr.admin
rm ./appakin-deploy.tar

echo 'unzipping'

gunzip appakin-deploy.tar.gz
tar xf appakin-deploy.tar

echo 'copying to releases dir'

sudo mkdir /mnt/data/www/appakin/releases/v$1
sudo cp -r ./web.public /mnt/data/www/appakin/releases/v$1/web.public
sudo cp -r ./web.api /mnt/data/www/appakin/releases/v$1/web.api
sudo cp -r ./solr.admin /mnt/data/www/appakin/releases/v$1/solr.admin

echo 'installing npm packages'

pushd /mnt/data/www/appakin/releases/v$1/web.api
sudo npm install
popd

pushd /mnt/data/www/appakin/releases/v$1/solr.admin
sudo npm install
popd

echo 'making current release point to these files then restarting'

pushd /mnt/data/www/appakin/releases

sudo ln -sfn v$1 current
ls -l

#sudo restart appakin
#sudo restart appakin-admin
#sudo restart solr-admin

popd

echo 'tidying up'

#rm -r ./web.public
#rm -r ./web.api
#rm -r ./solr.admin
#rm ./appakin-deploy.tar

echo 'finished'
