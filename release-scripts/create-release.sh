#!/bin/bash

# REQUIRE GITHUB_TOKEN in env
# Release process
# 1. Create a milestome with PRs to release
# 2. Run the command ./release-scripts/create-release.sh 2.26.4 platformv19 77

# Check if all required arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <new_version> <release_tag> <milestone_number>"
    exit 1
fi

# Assign input arguments to variables
NEW_VERSION=$1
RELEASE_TAG=$2
MILESTONE_NUMBER=$3

# Check if GITHUB_TOKEN is set in the environment
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set"
    exit 1
fi

# GitHub API URL and repository details
API_URL="https://api.github.com"
REPO_OWNER="ToolJet"
REPO_NAME="ToolJet"

# Label to add when conflicts are detected
CONFLICT_LABEL="merge-conflict"

# Function to check if a command was successful
check_command() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Function to get the creator of the milestone
get_milestone_creator() {
    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
         "$API_URL/repos/$REPO_OWNER/$REPO_NAME/milestones/$MILESTONE_NUMBER")
    echo "$response" | jq -r '.creator.login // empty'
}

# Function to get the current user
get_current_user() {
    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
         "$API_URL/user")
    echo "$response" | jq -r '.login // empty'
}

# Check if the current user is the creator of the milestone
milestone_creator=$(get_milestone_creator)
current_user=$(get_current_user)

if [ "$milestone_creator" != "$current_user" ]; then
    echo "Error: The current user ($current_user) is not the creator of the milestone ($milestone_creator)"
    exit 1
fi

echo "Milestone creator validation passed. Proceeding with the release process."

# Rest of the script remains the same...

# Check if release branch already exists
if git ls-remote --exit-code --heads origin release/$RELEASE_TAG >/dev/null 2>&1; then
    echo "Release branch release/$RELEASE_TAG already exists. Skipping branch creation."
    git fetch origin release/$RELEASE_TAG
    git checkout release/$RELEASE_TAG
    git pull origin release/$RELEASE_TAG
else
    echo "Creating new release branch: release/$RELEASE_TAG"
    # Checkout main branch
    git checkout main
    check_command "Failed to checkout main branch"

    # Pull latest changes
    git pull
    check_command "Failed to pull latest changes"

    # Create new version branch
    git checkout -b release/$RELEASE_TAG
    check_command "Failed to create new branch"

    # Update version
    npm run update-version $NEW_VERSION
    check_command "Failed to update version"

    # Commit version files
    git add .version server/.version frontend/.version
    git commit -m "Bump version to $NEW_VERSION"
    check_command "Failed to commit version files"

    # Push branch
    git push origin release/$RELEASE_TAG
    check_command "Failed to push branch"
fi

# Function to get PR details from a milestone (only open PRs)
get_pr_details() {
    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
         "$API_URL/repos/$REPO_OWNER/$REPO_NAME/issues?milestone=$MILESTONE_NUMBER&state=open")
    echo "$response" | jq -r '.[] | select(.pull_request != null) | "\(.number)\n\(.user.login)\n\(.pull_request.url)"'
}

# Function to check if PR has conflicts
check_pr_conflicts() {
    local pr_number=$1
    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
         "$API_URL/repos/$REPO_OWNER/$REPO_NAME/pulls/$pr_number")
    if echo "$response" | grep -q '"mergeable": false'; then
        echo "Yes"
    else
        echo "No"
    fi
}

# Function to add label to PR
add_label_to_pr() {
    local pr_number=$1
    curl -s -X POST \
         -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$API_URL/repos/$REPO_OWNER/$REPO_NAME/issues/$pr_number/labels" \
         -d "{\"labels\":[\"$CONFLICT_LABEL\"]}"
}

# Get PR details
pr_details=$(get_pr_details)

# Initialize variables for the table
table_data=""
separator="+-------+----------------------+---------------------+\n"
header="| PR    | Author               | Has Merge Conflict  |\n"

# Function to add a row to the table data
add_table_row() {
    table_data+=$(printf "| %-5s | %-20s | %-19s |\n" "$1" "$2" "$3")
    table_data+="\n$separator"
}

# Process PR details and update base branch
while read -r number && read -r author && read -r pr_url; do
    echo "Updating base branch for PR #$number to release/$RELEASE_TAG"
    curl -X PATCH \
         -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$API_URL/repos/$REPO_OWNER/$REPO_NAME/pulls/$number" \
         -d "{\"base\":\"release/$RELEASE_TAG\"}"
    check_command "Failed to update base branch for PR #$number"
    
    # Wait for GitHub to update the mergeable status
    sleep 5
    
    # Check for conflicts
    has_conflict=$(check_pr_conflicts $number)
    if [ "$has_conflict" = "Yes" ]; then
        echo "Conflicts detected in PR #$number. Adding label."
        add_label_to_pr $number
    else
        echo "No conflicts detected in PR #$number"
    fi
    
    # Add row to table data
    add_table_row "$number" "$author" "$has_conflict"
    
done <<< "$pr_details"


# Check if release PR already exists
existing_pr=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "$API_URL/repos/$REPO_OWNER/$REPO_NAME/pulls?head=$REPO_OWNER:release/$RELEASE_TAG&base=main&state=open")

if echo "$existing_pr" | grep -q '"number":'; then
    PR_NUMBER=$(echo "$existing_pr" | grep -o '"number": [0-9]*' | grep -o '[0-9]*' | head -n1)
    echo "Release PR #$PR_NUMBER already exists. Skipping PR creation."
else
    # Create PR for the release
    PR_TITLE="Release $RELEASE_TAG [$NEW_VERSION]"
    PR_BODY="Milestone: https://github.com/$REPO_OWNER/$REPO_NAME/milestone/$MILESTONE_NUMBER"
    PR_RESPONSE=$(curl -s -X POST \
         -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$API_URL/repos/$REPO_OWNER/$REPO_NAME/pulls" \
         -d "{\"title\":\"$PR_TITLE\",\"body\":\"$PR_BODY\",\"head\":\"release/$RELEASE_TAG\",\"base\":\"main\"}")

    PR_NUMBER=$(echo "$PR_RESPONSE" | grep -o '"number": [0-9]*' | grep -o '[0-9]*')

    if [ -n "$PR_NUMBER" ]; then
        echo "Created PR #$PR_NUMBER: $PR_TITLE"
    else
        echo "Failed to create PR. Response:"
        echo "$PR_RESPONSE"
        exit 1
    fi
fi

echo "Release process completed successfully!"

# Print the table at the end of the script
echo -e "\nOpen PRs in the milestone:"
echo -e "$separator$header$separator$table_data"