declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_URL?: string;
    REACT_APP_API_TIMEOUT?: string;
    REACT_APP_API_RETRY_ATTEMPTS?: string;
    REACT_APP_API_RETRY_DELAY?: string;
    REACT_APP_VERSION?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
} 