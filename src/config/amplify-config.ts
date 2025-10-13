export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-1_zLcYERVQI',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '37ef9023q0b9q6lsdvc5rlvpo1',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
    }
  }
};
