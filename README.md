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

2. **Instal node and bower packages.**
```
cd vicinity/stubs
cd facility
npm install
```
Note, bower packages are installed by npm install.

3. **Configure port for your stub.**

* Open ``package.json`` file in root stub directory (e.g. ``vicinity\stubs\facility\package.json``
* Choose unoccupied port for your stub.
* Edit ``'start'`` script value: ``"start": "http-server -a localhost -p 8030 -c-1",``
* Update list of port in this readme.
