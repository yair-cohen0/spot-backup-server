#!/bin/bash

echo "-----> Deleting Dist Folder "
rm -rf dist

echo "-----> deleting Dependencies"
rm -rf node_modules
rm -rf package-lock.json
npm cache clean --force

echo "-----> installing Dependencies"
npm install
npm install --save-dev
