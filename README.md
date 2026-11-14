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

Steps 1-3 can be done by hand (below) or in one go with cloudformation.yaml:

  CloudFormation option (replaces steps 1-3)
       - CloudFormation > Create stack > With new resources (standard)
       - Upload a template file > choose cloudformation.yaml
       - Stack name: s3-browser
       - BucketName: the existing bucket to browse
       - AccessLevel: ReadWrite or ReadOnly
       - AdminEmail: your email (Cognito sends a temporary password), or leave blank
       - Tick "I acknowledge that AWS CloudFormation might create IAM resources"
       - After CREATE_COMPLETE, open the Outputs tab: the Vite* values map
         one-to-one to the entries in .env
       - Bucket CORS (step 4) is still manual: the template does not touch the bucket

  Manual option

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

## Using the Portal

  First-time setup on your PC
       - Install Node.js LTS from nodejs.org
       - In File Explorer, open the s3-browser folder
       - Click the address bar, type cmd, press Enter (a terminal opens in that folder)
       - Run: npm install

  Each time you want to use it
       - In the s3-browser folder's terminal, run: npm run dev
       - Leave that terminal window open while you work
       - Open http://localhost:5173 in your browser

  Signing in
       - Sign in with the email of your Cognito user
       - First sign-in only: use the temporary password Cognito emailed you
         (sender no-reply@verificationemail.com, check spam), then set your own
       - The temporary password expires after 7 days; if it lapses, go to
         Cognito > User pools > Users, delete the user and create it again

  Browsing the bucket
       - On the Home screen, click the bucket location
       - Click folders to move down; use the breadcrumb to move back up
       - Use the actions menu (three dots) to Upload, Download, Copy,
         Create folder or Delete
       - Sign out with the button at the top right

  Good to know
       - Changes are live in S3 immediately. If the bucket also serves a website
         through CloudFront, a deleted or replaced file changes the site once the
         cache clears
       - If listing works but uploads fail, re-check the bucket CORS config (step 4)
       - "Access Denied" after sign-in means the IAM role policy does not cover
         the bucket or prefix you opened

## Adding Your Logo

The portal shows a logo on the sign-in screen, at the top of the file browser, and as the browser-tab icon.

1. Open the `s3-browser` folder in File Explorer.
2. Open the `public` folder inside it (create a folder named `public` if it does not exist).
3. Copy your logo into it and name it exactly `logo.svg` (a vector logo stays sharp at any size; a transparent PNG also works if you change `LOGO_SRC` in `src/App.tsx` to `/logo.png`). Design it for a dark background, because the portal shows it on a dark navy band. Optionally add a square `favicon.png` for the browser-tab icon.
4. Refresh the portal page in your browser. If the page is not running, start it as described in **Using the Portal**.

The band color and the alt text are set near the top of the branding block in `src/App.tsx`. If no logo file is present, the logo is hidden and the portal still works.

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
- CloudFormation cannot set CORS on a bucket it did not create without
  importing the bucket or using a custom resource, so CORS stays a manual step
- VITE_* values are compiled into the browser bundle. Pool and client IDs are
  not secrets, but access keys must never go there
- A Cognito user pool on the Essentials or Lite tier is free up to 10,000
  monthly active users; identity pools have no charge
