# App Akin

## Developer setup

1. Use npm to install the following packages globally:
* - express
* - nodemon
* - bower
* - browserify
* - watchify
* - gulp

2. Cd to the appakin repo root directory and run 'npm install' to install the dev dependencies.  (All dev dependencies should be installed at the root level so that they are shared amongst all the projects in the repo.)

## web.public

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

### JSHint 

TODO

### Build

TODO

### Running locally while developing

If you're not wanting to run the API Web site in an IDE, just cd to the /src/web.api directory and run 'npm start'. Browse to http://localhost:3002/api/test/ping
