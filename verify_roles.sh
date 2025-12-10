#!/bin/bash

# Base URL
API_URL="http://localhost:5173/api"

# 1. Trainer creates course (Expected: Success)
echo "1. Trainer creating course..."
RESPONSE=$(curl -s -X POST "$API_URL/courses" \
  -H "Cookie: better-auth.session_token=token_trainer" \
  -H "Content-Type: application/json" \
  -d '{"title": "Trainer Course", "description": "Course by Trainer"}')
echo "Response: $RESPONSE"
echo -e "\n"

# 2. Student creates course (Expected: 403 Forbidden)
echo "2. Student creating course..."
RESPONSE=$(curl -s -X POST "$API_URL/courses" \
  -H "Cookie: better-auth.session_token=token_student" \
  -H "Content-Type: application/json" \
  -d '{"title": "Student Course", "description": "Should Fail"}')
echo "Response: $RESPONSE"
echo -e "\n"

# 3. Student enrolled in seeded course (Expected: Success)
echo "3. Student enrolling in course1..."
RESPONSE=$(curl -s -X POST "$API_URL/courses/course1/enroll" \
  -H "Cookie: better-auth.session_token=token_student" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Response: $RESPONSE"
echo -e "\n"

# 4. Trainer enrolling (Should Fail per my strict interpretation)
echo "4. Trainer enrolling in course1..."
RESPONSE=$(curl -s -X POST "$API_URL/courses/course1/enroll" \
  -H "Cookie: better-auth.session_token=token_trainer" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Response: $RESPONSE"
echo -e "\n"
