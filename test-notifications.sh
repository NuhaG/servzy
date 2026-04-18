#!/bin/bash
# Notification System Testing Script
# Usage: Copy this file to your project root and run: bash test-notifications.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL (adjust if running on different port)
BASE_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Notification System Testing Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print results
print_result() {
  local status=$1
  local message=$2
  
  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✓ $message${NC}"
  else
    echo -e "${RED}✗ $message${NC}"
  fi
}

# Check if server is running
echo -e "\n${YELLOW}1. Checking if server is running...${NC}"
if curl -s "$BASE_URL" > /dev/null 2>&1; then
  print_result 0 "Server is running on $BASE_URL"
else
  print_result 1 "Cannot connect to $BASE_URL - make sure dev server is running"
  exit 1
fi

# Test authentication
echo -e "\n${YELLOW}2. Testing authentication...${NC}"
AUTH_RESPONSE=$(curl -s "$BASE_URL/api/me")
if echo "$AUTH_RESPONSE" | grep -q "error"; then
  print_result 1 "Authentication failed - might not be signed in"
  echo "Response: $AUTH_RESPONSE"
else
  print_result 0 "Authentication successful"
  echo "User: $(echo "$AUTH_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)"
fi

# Test notification creation
echo -e "\n${YELLOW}3. Testing notification creation...${NC}"
TEST_RESPONSE=$(curl -s "$BASE_URL/api/notifications/test")
if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
  print_result 0 "Test notification created successfully"
  NOTIF_COUNT=$(echo "$TEST_RESPONSE" | grep -o '"totalNotifications":[0-9]*' | cut -d':' -f2)
  echo "Total notifications now: $NOTIF_COUNT"
else
  print_result 1 "Failed to create test notification"
  echo "Response: $TEST_RESPONSE"
fi

# Test notification fetching
echo -e "\n${YELLOW}4. Testing notification fetching...${NC}"
FETCH_RESPONSE=$(curl -s "$BASE_URL/api/notifications?limit=10")
if echo "$FETCH_RESPONSE" | grep -q '"notifications"'; then
  print_result 0 "Notifications fetched successfully"
  TOTAL=$(echo "$FETCH_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
  UNREAD=$(echo "$FETCH_RESPONSE" | grep -o '"unreadCount":[0-9]*' | cut -d':' -f2)
  echo "Total: $TOTAL | Unread: $UNREAD"
else
  print_result 1 "Failed to fetch notifications"
  echo "Response: $FETCH_RESPONSE"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\nNext steps:"
echo -e "1. Open your app in browser ($BASE_URL)"
echo -e "2. Sign in if you haven't already"
echo -e "3. Look for the bell icon 🔔 in the navigation"
echo -e "4. Click it to see your notifications"
echo -e "\nOr navigate to test page:"
echo -e "file:///c:/Users/Lenovo/Desktop/servzy/test-notifications.html"
