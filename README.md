# MongoDB connection:

# Port list:

* Vicinity neighbourhood manager: localhost:8000
  * client: localhost:8000
  * server: localhost:3000
* Facility stub:
  * client: localhost: 8010

# STUBS

## Create dummy backend application

Sometime you need to create simple backend application, e.g. Facility manager application which reads data from GATEWAY api of Vicinity Neighbourhood manager.

In this example the backend application which reads data directly only from gateway api.

Architecture will be as follows:
* SPA by AngularJS+Bootstrap with expressjs/nodejs.
* Data layer will be implemented by VNM.
* Authentication is using JWT.

### Building AngularJS and ExpressJS/nodeJS
Pre-requisits: npm, nodejs [http://nodejs.org/], git [https://git-scm.com/] installed.

1. **Create AngularJS from angularjs/nodejs seed.** Clone AngularJS in your project directory.
If you want manage stub under VICINITY git repository, you should store it in "stubs" directories.

```
cd vicinity/stubs
git clone --depth=1 https://github.com/angular/angular-seed.git facility
```

remove ```.git``` directory in ```stubs\facility``` directory


2. **Instal node and bower packages and put them under version control.**
```
cd vicinity/stubs
cd facility
npm install
git add .
git status
```
Note, bower packages are installed by npm install.

3. **Configure port for your stub.**

* Open ``package.json`` file in root stub directory (e.g. ``vicinity\stubs\facility\package.json``
* Choose unoccupied port for your stub.
* Edit ``'start'`` script value: ``"start": "http-server -a localhost -p 8030 -c-1",``
* Update list of port in this readme.


### Adding Bootstrap framework

1. **Adding bootstrap framework.**

* Open ```bower.json``` file in ```stubs\facility```directory.
* Add bootstrap dependency.

```
{
  "name": "angular-seed",
  "description": "A starter project for AngularJS",
  "version": "0.0.0",
  "homepage": "https://github.com/angular/angular-seed",
  "license": "MIT",
  "private": true,
  "dependencies": {
    "angular": "~1.4.0",
    "angular-route": "~1.4.0",
    "angular-loader": "~1.4.0",
    "angular-mocks": "~1.4.0",
    "html5-boilerplate": "~5.2.0",
    "bootstrap": "3.3.6"
  }
}
```

* Run ```npm install``` in ```stubs\facility``` directory.
* Put files under version control "git add ."

2. **Adding boostrap in template.**

* Download bootstrap template such as (https://github.com/puikinsh/gentelella/releases)
* Import index.html and necessary supporting files in ```stubs\facility\app.
* run application using ```npm start ```


# ATOM editor

## GIT configuration

## NodeJS Debugger

1. **Install node-debugger package in ATOM editor**
  * Atom -> Preferences -> Install
  * Search "node-debugger"
  * Install

2. **Configure node-debugger package in ATOM editor**
  * Atom -> Preferences -> Community Packages -> node-debuger
  * Settings:
    * Set "Node Path" to local location of the node executable (e.g. ```which node```)
    * Path to ```vicinityManager/server/bin/www``` (e.g. Right click on file in left menu and 'Copy path')

3. **Usable commands**
```
'node-debugger:start-resume' (F5)
'node-debugger:debug-active-file' (ctrl-F5)
'node-debugger:stop' (shift-F5)
'node-debugger:toggle-breakpoint' (F9)
'node-debugger:step-next' (F10)
'node-debugger:step-in' (F11)
'node-debugger:step-out' (shift-F11)
'node-debugger:attach'
```

# Deploy instance of VCNT NM in a virtual machine

## Linux/Debian machine
 
 
0. Pre-requisites
  GIT - [https://git-scm.com/]
  NodeJS - [http://nodejs.org/]
  

1. Get the web application
  * Navigate to the right folder and clone the repository:
    * cd /var/www
    git clone https://jalmela@bitbucket.org/bavenir/vicinity.git ???

2. Install and configure Mongo DB
 * Install
 **Import they key for the official MongoDB repository.
 
  sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6

  **After successfully importing the key, you will see:

  Output
  gpg: Total number processed: 1
  gpg:               imported: 1  (RSA: 1)
  
  Next, we have to add the MongoDB repository details so apt will know where to download the packages from.
  
  **Issue the following command to create a list file for MongoDB.
  
  echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.4 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list

  **After adding the repository details, update the packages list and install the MongoDB package.

  sudo apt-get update 
  sudo apt-get install -y mongodb-org

  **Once MongoDB installs, start the service, and ensure it starts when your server reboots:
 
 sudo systemctl enable mongod.service
 sudo systemctl start mongod
 sudo systemctl status mongod – Check it runs properly
 
## VERY IMPORTANT
  ** Create target folders for mongo and give permissions to the mongo user on that folders.   

  Mkdir /data/db 
  Chown -R mongodb:mongodb /data/db
  Chown -R mongodb:mongodb /var/lib/mongodb 
    
   
  * Configuration file -- /etc/mongod.conf
  
  ** Set paths to:
  
    *** Storage:
    dbPath: /data/db
    *** SystemLog:
    path: /var/log/mongodb/mongod.log


3. Run the client

  * Install NGINX -- https://www.nginx.com/resources/wiki/start/
  sudo apt-get update
  sudo apt-get upgrade
  sudo apt-get install nginx

  * Configure NGINX
  
  https://www.linode.com/docs/web-servers/nginx/how-to-configure-nginx
  
  ** Backup the old configuration

  cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
  service nginx reload

  ** Create server file
  
  touch /etc/nginx/sites-available/vicinity
  
  ** Script vicinity
  
  # Vicinity server configuration
  
  ```
  server {
  
	listen 80 default_server;
	listen [::]:80 default_server;

	root /var/www/vicinity/vicinityManager/client/app;

	# Add index.php to the list if you are using PHP
	index index.html index.htm index.nginx-debian.html;

	server_name _;

	location / {
		# First attempt to serve request as file, then
		# as directory, then fall back to displaying a 404.
		try_files $uri $uri/ =404;
	}
  }
  
```

4. Run the server

  * Install forever 
  npm install –g forever
  sudo mkdir /var/run/forever

  * Create a service 
  sudo touch /etc/init.d/vcnt_server
  sudo chmod a+x /etc/init.d/ vcnt_server 
  sudo update-rc.d vcnt_server defaults

  * Script

```
  #!/bin/bash
  ### BEGIN INIT INFO
  # If you wish the Daemon to be lauched at boot / stopped at shutdown :
  #
  #    On Debian-based distributions:
  #      INSTALL : update-rc.d scriptname defaults
  #      (UNINSTALL : update-rc.d -f  scriptname remove)
  #
  #    On RedHat-based distributions (CentOS, OpenSUSE...):
  #      INSTALL : chkconfig --level 35 scriptname on
  #      (UNINSTALL : chkconfig --level 35 scriptname off)
  #
  # chkconfig:         2345 90 60
  # Provides:          /var/www/vicinity/vicinityManager/server/bin/www
  # Required-Start:    $remote_fs $syslog
  # Required-Stop:     $remote_fs $syslog
  # Default-Start:     2 3 4 5
  # Default-Stop:      0 1 6
  # Short-Description: forever running /var/www/vicinity/vicinityManager/server/bin/www
  # Description:       /var/www/vicinity/vicinityManager/server/bin/www
  ### END INIT INFO
  #
  # initd a node app
  # Based on a script posted by https://gist.github.com/jinze at https://gist.github.com/3748766
  #

  if [ -e /lib/lsb/init-functions ]; then
    # LSB source function library.
	. /lib/lsb/init-functions
  fi;

  pidFile="/var/log/vicinity/vcnt_server.pid"
  logFile="/var/log/vicinity/vcnt_server.log"
  outFile="/var/log/vicinity/vcnt_server.out"
  errFile="/var/log/vicinity/vcnt_server.err"
  command="node"
  nodeApp="/var/www/vicinity/vicinityManager/server/bin/www"
  foreverApp="forever"

  export PORT=3000
  export VCNT_MNGR_DB='mongodb://localhost:27017/vicinity_neighbourhood_manager'

  start() {
    echo "Starting $nodeApp"

	# Notice that we change the PATH because on reboot
   # the PATH does not include the path to node.
   # Launching forever with a full path
   # does not work unless we set the PATH.
   PATH=/usr/local/bin:$PATH
   export NODE_ENV=production
   PORT=$PORT VCNT_MNGR_DB=$VCNT_MNGR_DB $foreverApp start --pidFile $pidFile -l $logFile -o $outFile -e $errFile -a -d -c "$command" $nodeApp
   RETVAL=$?
  }

  restart() {
	
    echo -n "Restarting $nodeApp"
	$foreverApp restart $nodeApp
	RETVAL=$?
  }

  stop() {
	
    echo -n "Shutting down $nodeApp"
     $foreverApp stop $nodeApp
     RETVAL=$?
  }

  status() {
     
     echo -n "Status $nodeApp"
     $foreverApp list
     RETVAL=$?
  }

  case "$1" in
   start)
      start
        ;;
    stop)
        stop
        ;;
   status)
      status
       ;;
   restart)
   	  restart
        ;;
	*)
       echo "Usage:  {start|stop|status|restart}"
       exit 1
        ;;
  esac
  exit $RETVAL
```

  * Run service
  sudo service vcnt_server start

5. Putting all together -- First user and organisation in the app

  *To start using the web app we need to create the first user manually

  ** Basic set up

  Create dB vicinity_neighbourhood_manager in Mongo
  Create the collections user and useraccounts

  ** Insert first organisation in Mongo – In the useraccount collection
  
  db. useraccounts.insert({
    "location" : Some location as String,
    "organisation" : Some name as String,
    "businessId" : Some BID as String
  })

  ** Find organisation and copy the Mongo Id

  db.useraccounts.find({organisation: organisationName}).pretty()

  ** Insert first user – In the user collection
  
```
  db.users.insert({
    "email" : Some mail as String,
    "occupation" : Some occupation as String,
    "name" : Some name as String,
    "authentication" : {
        "password" : Some password as String,
        "principalRoles" : [ 
            "user", 
            "administrator", 
            "infrastructure operator"
        ]
    },
    "organisation" : ObjectId("5a265f5bfac8abf7fd273a7d"),
  })
```

  ** Add your new user to the organisation
  
  db.useraccounts.update({'organisation': organisationName},{$push:{'accountOf': userMongoId }})

  ** Try to log in 
  
  Navigate your browser to the app domain and use the mail and password to do the first log in. 



