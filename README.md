# App Akin

## Developer setup

1. Install Ruby and SASS: http://sass-lang.com/install
2. If you're on Windows, install VC++ 2010 using the instructions at https://github.com/TooTallNate/node-gyp/wiki/Visual-Studio-2010-Setup.
3. Use npm to install the global packages: 'npm install -g  express nodemon bower browserify watchify gulp nodeunit'.
4. Cd to the appakin repo root directory and run 'npm install' to install the dev dependencies.  (All dev dependencies should be installed at the root level so that they are shared amongst all the projects in the repo.)

## Application: web.public

### JSHint

Cd to the /src/web.public directory and run 'gulp jshint'.

### Build

Cd to the /src/web.public directory and run 'gulp build'.
You can check the build by cding to /build.output/web.public and running 'npm start'. Browse to http://localhost:3000/

### Running locally while developing

TODO

## web.rating

TODO

## web.api

### npm install

crawler, slug and pg have build issues on Windows. I got around this with the following cmd, running it from the Visual Studio command line:
npm install --msvs_version=2013 crawler

Note that you need to have VS2013 installed for this to work. (I have the full version of VS2013 installed.)

### JSHint 

Cd to the /src/web.api directory and run 'gulp jshint'.

### Build

Cd to the /src/web.api directory and run 'gulp build'.
You can check the build by cding to /build.output/web.api and running 'npm start'. Browse to http://localhost:3002/

### Running locally while developing

If you're not wanting to run the API Web site in an IDE, just cd to the /src/web.api directory and run 'npm start'. Browse to http://localhost:3002/api/test/ping

## Deployment

on build:
pscp -i d:\work\appakin-key.ppk -r d:\work\appakin\build-output\web-public ubuntu@appakin.com:v0.0.3

on live machine:
gunzip < file.tar.gz | tar xvf -
sudo cp -r v0.0.3 /var/www/appakin/releases/

sudo ln -sfn v0.0.3 current
