import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const GoogleAuth = () => {
  const { googleLogin } = useAuth();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        await googleLogin(response.access_token);
      } catch (error) {
        console.error('Error during Google login:', error);
      }
    },
    onError: () => console.error('Google Login Failed'),
  });

  return (
    <button
      onClick={() => login()}
      className="flex items-center justify-center w-full px-4 py-2 space-x-2 transition-colors duration-300 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-700 dark:border-gray-600"
    >
      <img src="/google.svg" className="w-5 h-5" alt="Google Logo" />
      <span>Continue with Google</span>
    </button>
  );
};

export default GoogleAuth;