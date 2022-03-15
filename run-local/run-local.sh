#!/bin/bash
git pull

if [ -f ~/.nvm/nvm.sh ]; then
  echo 'sourcing nvm from ~/.nvm'
  . ~/.nvm/nvm.sh
elif command -v brew; then
  # https://docs.brew.sh/Manpage#--prefix-formula
  BREW_PREFIX=$(brew --prefix nvm)
  if [ -f "$BREW_PREFIX/nvm.sh" ]; then
    echo "sourcing nvm from brew ($BREW_PREFIX)"
    . $BREW_PREFIX/nvm.sh
  fi
fi

if ! command -v nvm ; then
  echo "WARN: not able to configure nvm"
  exit 1
fi

nvm use 14
npm ci
npm run build:plugins
source run-local/run-client.sh &
source run-local/run-server.sh &
wait