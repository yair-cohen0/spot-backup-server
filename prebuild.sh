#!/bin/bash

echo "-----> Deleting Dist Folder "
rm -rf dist

echo "-----> installing Dependencies"
npm install
npm install --save-dev
