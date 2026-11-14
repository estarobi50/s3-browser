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

// Branding: logo is public/logo.svg (vector, designed for a dark background).
// Replace that file (or point LOGO_SRC at a .png) to change it; if it is missing the logo is simply hidden.
const LOGO_SRC = '/logo.svg';
const TITLE = 'Digital Culture IT Solutions';
const BRAND_BG = '#080f1e';

function Logo({ height }: { height: number }) {
  return (
    <img
      src={LOGO_SRC}
      alt={TITLE}
      style={{ height, display: 'block' }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

const authComponents = {
  Header() {
    return (
      <div
        style={{
          background: BRAND_BG,
          borderRadius: 8,
          padding: '20px 24px',
          margin: '24px auto 16px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Logo height={72} />
      </div>
    );
  },
};

export default function App() {
  return (
    <Authenticator hideSignUp components={authComponents}>
      {({ signOut }) => (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: BRAND_BG,
              color: '#fff',
              borderRadius: 8,
              padding: '12px 20px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Logo height={44} />
              <span style={{ opacity: 0.7 }}>File portal · {bucket}</span>
            </div>
            <button onClick={signOut}>Sign out</button>
          </div>
          <StorageBrowser />
        </div>
      )}
    </Authenticator>
  );
}
