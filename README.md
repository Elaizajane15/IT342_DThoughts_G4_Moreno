# IT342_DThoughts_G4_Moreno

## What Was Implemented / Updated

### Feed (For You / Following)
- Fixed the **Following** tab so it properly loads content instead of showing a blank page.
- Fixed the **active tab highlight** behavior so the white underline switches correctly between **For You** and **Following**.
- Synced tab state with the URL so navigation/back/refresh keeps the correct active tab.

Files updated:
- [Feed.jsx](file:///c:/Users/rose/Downloads/IT342_DThoughts_G4_Moreno/web/src/pages/Feed.jsx)

### Forgot Password (End-to-End)
- Implemented the full **Forgot Password** flow (request reset code + reset password).
- Reset codes are **stored in the database only** (hashed + expiry) and **not returned** to the frontend response.
- Added frontend page to request a reset code and submit the new password.

Backend endpoints:
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Files updated:
- [AuthController.java](file:///c:/Users/rose/Downloads/IT342_DThoughts_G4_Moreno/backend/src/main/java/com/dthoughts/g4/moreno/controller/AuthController.java)
- [AuthService.java](file:///c:/Users/rose/Downloads/IT342_DThoughts_G4_Moreno/backend/src/main/java/com/dthoughts/g4/moreno/service/AuthService.java)
- [api.js](file:///c:/Users/rose/Downloads/IT342_DThoughts_G4_Moreno/web/src/utils/api.js)
- [ForgotPassword.jsx](file:///c:/Users/rose/Downloads/IT342_DThoughts_G4_Moreno/web/src/pages/ForgotPassword.jsx)

### Edit Post Page (Match Create Post)
- Updated **Edit Thought** page to match the **Create Post** experience.
- Added **image attach** UI (dropzone + preview + remove/replace) and uploads the image on save (after updating the text).
- Kept the same **500 character limit** and validation behavior.

Files updated:
- [EditPost.jsx](file:///c:/Users/rose/Downloads/IT342_DThoughts_G4_Moreno/web/src/pages/EditPost.jsx)

## Project Progress (Daily Log)

### Day 1
- Set up the backend and frontend.
- Implemented registration and login, and connected them to the dashboard successfully.

### Day 2
- Improved the UI/UX for the register, login, and feed pages.

### Day 3
- Implemented Google Auth and integrated it with the database.

### Day 4
- Implemented dashboard posts with full CRUD and saved data to the database.
- Implemented the sidebar.
- Implemented guest user login.
- Implemented the New Thought page.
- Implemented drafts (frontend + backend).

### Day 5
- Implemented notifications and the profile page (frontend + backend).
- Implemented edit and delete for posts.

### Day 6
- Implemented the account sidebar.
- Added "Add an existing account".
- Added logout and showed the handle format like `@"user"`.
