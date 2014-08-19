# App Akin

## Developer setup

1. Use npm to install the global packages: 'npm install -g  express nodemon bower browserify watchify gulp'.
2. Cd to the appakin repo root directory and run 'npm install' to install the dev dependencies.  (All dev dependencies should be installed at the root level so that they are shared amongst all the projects in the repo.)

## Application: web.public

### JSHint

Cd to the /src/web.public directory and run 'gulp jshint'.

### Build

Cd to the /src/web.public directory and run 'gulp build'.
You can check the build by cding to /build.output/web.public and running 'npm start'. Browse to http://localhost:3000/

### Running locally while developing

1. Install the livereload extension in Chrome.
2. Set up a build configuration in WebStorm/IntelliJ that is configured as follows:
  - Node interpreter: Path of node.exe, e.g., C:\Program Files\nodejs\node.exe on Windows.
  - Node parameters: empty
  - Working directory: Path to /src/web.public directory in your appakin repo.
  - Javascript file: Path to nodemon, e.g., something like 'C:\Users\Steve\AppData\Roaming\npm\node_modules\nodemon\bin\nodemon.js' on Windows.
  - Application parameters: server.js
  - Open browser after launch, Default, with the path 'http://localhost:3000/'.
3. In a command line window, cd to the /src/web.public directory and run 'gulp dev'.
4. Debug the Web site.
5. In Chrome, connect the opened browser window to livereload.

## Application: web.rating

TODO

## Application: web.api

### JSHint 

Cd to the /src/web.api directory and run 'gulp jshint'.

### Build

Cd to the /src/web.api directory and run 'gulp build'.
You can check the build by cding to /build.output/web.api and running 'npm start'. Browse to http://localhost:3002/

### Running locally while developing

If you're not wanting to run the API Web site in an IDE, just cd to the /src/web.api directory and run 'npm start'. Browse to http://localhost:3002/api/test/ping
