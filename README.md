# Goal
To design a system that allows for the operation of naval assets through GeoFS Naval Roleplay. The system will consist of an addon to GeoFS that connects to a remote server. Additionally, high command and the cabinet will be able to manage their assets on a website hosted on the same server.

# DESIGN
Client-side:
GeoFS Addon Script (and/or chrome extension?)
Javascript

Server-side:
MongoDB Database
Flask server for GeoFS Addon endpoints
ExpressJS site for management

# How to host the site
The following will explain how to setup an instance of the management site.

## Install required software

### Linux (Debain/Ubuntu)
1. run ```sudo apt update```
2. Install git ```sudo apt install git```
3. Install npm ```sudo apt install npm```
4. Install node js ```curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs``` (May already be installed)
5. Install python ```sudo apt install python```
6. Install venv ```sudo apt install python3-venv```

### Windows 10/11
Install the following packages and make sure each is added to path, so that you can run them as commands in the cmd.'
1. git
2. npm
3. nodejs
4. python



## Setup installation
1. Clone the github repo
```git clone https://github.com/iL0g1c/geofs-nrp-system.git```
2. Inside the repo in the src/server directory create the venv ```python3 -m venv venv```
3. Activate the venv
### Linux
```source venv/bin/activate```
### Windows
```.\venv\Scripts\activate.bat```

4. Install the python packages ```python3 -m pip install -r requirements.txt```
5. Go into the nrp-site directory.
6. Install the npm packages ```npm install```

## Setup enviroment variables
If you are a part of the dev team I will provide the envs by DM. Mainly the ENVs are for authinticating with the login service.
  * AUTH0_CLIENT_ID, AUTH0_DOMAIN, AUTH0_CLIENT_SECRET (These are used by auth0 for secure logins. The login page will break without these.)
  * SESSION_SECRET (A random hex number for logins)
  * AUTH0_CALLBACK_URL (The url for the callback after login)
  * AUTH0_LOGOUT_RETURN_TO (The page to redirect to after a logout)

## Run the installation
1. Run ```npm run dev```
2. For autocode updates in another terminal run ```npm run ui``