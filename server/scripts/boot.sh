#!/bin/bash
set -e

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

# Run setup
npm run db:setup:prod
# Start ToolJet
exec npm run start:prod
