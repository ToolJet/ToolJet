#!/bin/bash
set -e

echo "Initializing database.."
echo "This may take a couple of minutes"
echo -ne "                          (0%)\r"
npm run db:create:prod --silent 1> /dev/null
echo -ne "#####                     (33%)\r"
npm run db:migrate:prod --silent 1> /dev/null
echo -ne "#######################   (100%)\r"
echo -ne "\n\n"


echo "
   _____           _   ___      _
  |_   _|         | | |_  |    | |
    | | ___   ___ | |   | | ___| |_
    | |/ _ \ / _ \| |   | |/ _ \ __|
    | | (_) | (_) | /\__/ /  __/ |_
    \_/\___/ \___/|_\____/ \___|\__|

Everything you need to build internal tools!
GitHub: https://github.com/ToolJet/ToolJet
"

npm run start:prod --silent
