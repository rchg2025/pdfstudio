import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function GoogleAuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const [clientId, setClientId] = useState('');
  
  useEffect(() => {
    fetch('/api/utils/google')
      .then(res => res.json())
      .then(data => {
        if (data.clientId) {
          setClientId(data.clientId);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId || "no-client-id-configured"}>
      {children}
    </GoogleOAuthProvider>
  );
}
