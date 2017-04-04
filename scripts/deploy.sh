#!/usr/bin/env bash
echo 'begin deploy'
cd .tmp && tar -czvf ../dist.tar.gz * .??* && cd ..