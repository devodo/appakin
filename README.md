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
pscp -i d:\work\appakin-key.ppk -r d:\work\appakin\build-output\web.public ubuntu@appakin.com:temp/
<-- copies to temp/web.public

mac: scp -i appakin-key.pem appakin/build-output/web.public ubuntu@appakin.com:temp/



on live machine:
gunzip < file.tar.gz | tar xvf -
sudo cp -r v0.0.3 /var/www/appakin/releases/

sudo rm -rf node_modules
sudo npm install

sudo ln -sfn v0.0.3 current
ls -l

sudo restart appakin
sudo restart appakin-admin
sudo restart solr-admin << logs folder not there or


------------------

# Mac Installation

installing appakin

download and install xcode
download and install git
download and install latest java sdk
download and install se6 java (needed by webstorm). Apple have file for this.
download and install webstorm
download and install tunnelblick

configure tunnelblick - david creates new openvpn settings for me and gives me configuration file

git clone git@10.10.4.1:appakin-docs.git

download and install solr - untar the file somewhere, then copy the example dir to where you want to have your solr install. Rename the directory to solr. Checkout the appakin-solr repo to some location, then copy it into the solr directory that's within the solr directory. Make sure the git files get copied over too.

install:
mvim
homebrew
pgadmin

brew update
brew doctor
brew install postgresql
initdb `brew --prefix`/var/postgres/data -E utf8
in pgadmin, change user to login to db to be your short mac username, and create a user called postgres with password postgres and all role privileges.
to run postgres on startup: ln -sfv /usr/local/opt/postgresql/*.plist ~/Library/LaunchAgents
to run postgres now: launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist

brew install ant
brew install node
sudo gem install sass
sudo npm install -g express nodemon bower gulp nodeunit
cd to root of appakin repo: npm install
cd to web.api directory: npm install
cd to web.public directory: npm install

to update only npm:
npm install -g npm@latest

postgres -D /usr/local/var/postgres/data
or pg_ctl -D /usr/local/var/postgres/data -l logfile start

Then:
In web.api dir: npm start
In web.public dir: gulp dev
In web.public dir: npm start

check on name of database backup file: ssh dev@appakin-dev
copy database backup over: scp dev@appakin-dev:./appakin-2014-11-12.sql.bz2 ~/appakin-2014-11-12.sql.bz2
double click on it to expand it.

add a config-local.json file to web.api with connectionString override for your local postgres instance.
