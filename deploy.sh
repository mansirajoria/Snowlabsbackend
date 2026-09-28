#!/bin/bash
sudo su
git pull origin staging
docker-compose up -d --build
