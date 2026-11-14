import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react/styles.css';
import '@aws-amplify/ui-react-storage/styles.css';

const env = import.meta.env;
const region = env.VITE_AWS_REGION as string;
const bucket = env.VITE_S3_BUCKET as string;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: env.VITE_USER_POOL_ID,
      userPoolClientId: env.VITE_USER_POOL_CLIENT_ID,
      identityPoolId: env.VITE_IDENTITY_POOL_ID,
    },
  },
  Storage: {
    S3: {
      bucket,
      region,
      buckets: {
        main: {
          bucketName: bucket,
          region,
          // Locations shown in the browser. '*' = whole bucket.
          // To expose only certain folders, replace with e.g. 'clients/*'.
          // This only controls what the UI lists; the identity pool's IAM role
          // is what actually enforces access.
          paths: {
            '*': { authenticated: ['get', 'list', 'write', 'delete'] },
          },
        },
      },
    },
  },
});

const { StorageBrowser } = createStorageBrowser({
  config: createAmplifyAuthAdapter(),
});

export default function App() {
  return (
    <Authenticator hideSignUp>
      {({ signOut }) => (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2>{bucket}</h2>
            <button onClick={signOut}>Sign out</button>
          </div>
          <StorageBrowser />
        </div>
      )}
    </Authenticator>
  );
}
