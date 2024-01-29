#!/bin/bash
cd /var/app/staging
sudo -u webapp npm uninstall cross-env
sudo -u webapp npm install cross-env
cd backend
sudo -u webapp npm install file:../common
sudo -u webapp npm uninstall bcrypt
sudo -u webapp npm install bcrypt
