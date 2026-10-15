# Firebase Configuration (Option)

Firebase is supported as an alternative backend for the Country Tracker application.

## Setup Instructions

1.  **Create Firebase Project**: Go to the Firebase Console and create a new project.
2.  **Enable Auth**: Enable Google Authentication in the Auth section.
3.  **Enable Firestore**: Create a Firestore database.
4.  **Get Config**: Go to Project Settings and add a Web App to get the configuration object.

## Application Configuration

To use Firebase as the backend, set the following environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_BACKEND_TYPE="firebase"
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```
