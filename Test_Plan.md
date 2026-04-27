# Software Test Plan for DThoughts (Post-Vertical Slice Refactoring)

## 1. Introduction
This document outlines the test plan for the DThoughts application following its structural refactoring to a Vertical Slice Architecture. The goal of this regression testing phase is to ensure that no functional requirements were broken during the transition from a technical layer structure to a feature-based structure across the Backend, Web, and Mobile platforms.

## 2. Test Objectives
- Verify that all core functional features (Authentication, Posting, Profiling, Notifications, and Drafts) work seamlessly.
- Validate the communication between the Web/Mobile frontends and the Spring Boot backend.
- Ensure that the application builds and runs correctly on all platforms without missing dependencies or import errors.

## 3. Scope of Testing
The following features are within the scope of this regression test:
1. **Authentication Feature**: Login, Registration, JWT generation and validation.
2. **Post Feature**: Creating posts (with and without images), viewing the feed, liking, saving, and commenting on posts.
3. **Profile Feature**: Viewing user profiles, editing user details, following/unfollowing users.
4. **Notification Feature**: Receiving notifications for likes, comments, and follows; marking notifications as read.
5. **Draft Feature**: Saving unfinished posts as drafts, viewing drafts, and resuming drafts.

## 4. Test Environment
- **Backend**: Spring Boot running locally (`http://localhost:8080`) connected to the local MySQL database.
- **Web**: React frontend running via Vite (`http://localhost:5173`).
- **Mobile**: Android application running on an emulator or physical device pointing to the local backend.

## 5. Test Scenarios and Test Cases

### 5.1 Authentication (Auth Slice)
| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| TC-AUTH-1 | User registers a new account | Account is created in the database and user is redirected to login | |
| TC-AUTH-2 | User logs in with valid credentials | System returns JWT token and redirects to the Feed | |
| TC-AUTH-3 | User attempts login with invalid credentials | System displays an "Invalid Credentials" error | |

### 5.2 Posts & Feed (Post Slice)
| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| TC-POST-1 | User creates a text post | Post appears immediately on the home feed | |
| TC-POST-2 | User creates a post with an image | Image is uploaded successfully and post appears on feed | |
| TC-POST-3 | User likes a post | Like count increments and heart icon state changes | |
| TC-POST-4 | User comments on a post | Comment appears under the post in the post details view | |

### 5.3 User Profiles (Profile Slice)
| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| TC-PROF-1 | User views their own profile | Profile displays correct follower/following count and posts | |
| TC-PROF-2 | User follows another user | Following count increments and Follow button changes state | |
| TC-PROF-3 | User edits their profile bio | Changes are saved and reflected immediately on the profile | |

### 5.4 Notifications (Notification Slice)
| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| TC-NOTF-1 | User receives a like on their post | Notification badge appears; notification is added to the list | |
| TC-NOTF-2 | User opens the notification tab | Notifications are fetched correctly and marked as read upon interaction | |

### 5.5 Drafts (Draft Slice)
| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| TC-DRFT-1 | User writes a post but saves it as a draft | Draft is saved locally and appears in the Drafts tab | |
| TC-DRFT-2 | User resumes a draft | Draft content populates the Create Post screen | |

## 6. Execution Strategy
1. **Compilation Check**: Ensure Backend, Web, and Mobile all compile cleanly (`mvn clean package`, `npm run build`, `./gradlew assembleDebug`).
2. **Backend API Validation**: Run backend and test endpoints via Swagger UI or Postman.
3. **Frontend E2E Validation**: Launch Web and Mobile interfaces and manually execute the test cases listed in Section 5.
4. **Defect Tracking**: Any failures will be documented with stack traces and fixed within the `feature/vertical-slice-architecture` branch before final merge.
