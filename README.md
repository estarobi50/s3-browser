# s3-browser

## Overview
A private web UI for browsing, uploading, downloading, copying and deleting
objects in an S3 bucket, built on the Amplify UI Storage Browser component.
Sign-in is handled by Amazon Cognito; no Amplify backend and no access keys
in the browser.

## Architecture
User opens the app (http://localhost:5173 in development)
  → Authenticator signs the user in against a Cognito user pool
  → Cognito identity pool exchanges the login for temporary IAM credentials
      → credentials are tied to one IAM role (s3-browser-auth-role)
      → the role's inline policy allows List/Get/Put/Delete on one bucket only
  → Storage Browser calls S3 directly from the browser with those credentials
  → S3 answers cross-origin requests because the bucket's CORS config allows the app origin

## Technologies Used
- Amplify UI Storage Browser (@aws-amplify/ui-react-storage) — the file browser component
- Amplify UI Authenticator (@aws-amplify/ui-react)           — sign-in screen
- Amazon Cognito user pool      — user directory and sign-in (self-registration off)
- Amazon Cognito identity pool  — swaps the login for temporary AWS credentials
- AWS IAM                       — role and inline policy scoped to the bucket
- Amazon S3                     — the bucket being browsed, plus its CORS configuration
- Vite + React + TypeScript     — app tooling

## Deployment Steps

  1. Create Cognito user pool
       - Cognito > User pools > Create user pool
       - Application type: Single-page application (SPA)
       - Sign-in identifier: Email
       - Self-registration: off
       - Users > Create user for yourself
       - Note the User pool ID and the app Client ID (SPA clients have no secret)

  2. Create Cognito identity pool
       - Cognito > Identity pools > Create identity pool
       - User access: Authenticated access only
       - Identity source: Amazon Cognito user pool
       - Create default role, named s3-browser-auth-role
       - Select the user pool and app client from step 1
       - Note the Identity pool ID

  3. Add the S3 policy to the role
       - IAM > Roles > s3-browser-auth-role > Add permissions > Create inline policy > JSON
       - Paste iam-policy.json from this repo, replacing YOUR-BUCKET
       - Remove s3:PutObject / s3:DeleteObject for a read-only browser

  4. Add CORS to the bucket
       - S3 > bucket > Permissions > Cross-origin resource sharing (CORS) > Edit
       - Paste cors.json from this repo
       - Add your real hostname to AllowedOrigins if you host the app later
       - Block Public Access can stay on

  5. Configure and run the app
       - Copy .env.example to .env and fill in the five values
       - npm install
       - npm run dev
       - Open http://localhost:5173 and sign in with the Cognito user

  6. Build for hosting (optional)
       - npm run build
       - Upload the dist/ folder to any static host (S3 + CloudFront, Amplify Hosting)

## Key Learnings
- createAmplifyAuthAdapter takes no arguments; the locations shown in the
  browser come from the Storage.S3.buckets[...].paths block passed to
  Amplify.configure, not from the adapter
- That paths block only decides what the UI lists — the IAM role on the
  identity pool is the real security boundary
- The Storage Browser works against an existing bucket with plain Cognito;
  an Amplify Gen 2 backend or S3 Access Grants is optional, not required
- Without the ExposeHeaders entries in the bucket CORS config (ETag in
  particular), multipart uploads fail even though listing works
- The identity pool's default role starts with almost no permissions; S3
  access has to be added to it afterwards in IAM
- VITE_* values are compiled into the browser bundle. Pool and client IDs are
  not secrets, but access keys must never go there
- A Cognito user pool on the Essentials or Lite tier is free up to 10,000
  monthly active users; identity pools have no charge
