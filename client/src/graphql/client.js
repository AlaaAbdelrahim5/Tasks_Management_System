import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Create an HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

// Create a WebSocket link for subscriptions - with explicit config
// Note: Make sure WebSocket is available in the browser
const wsLink = typeof window !== 'undefined' ? new WebSocketLink({
  uri: 'ws://localhost:4000/graphql',
  options: {
    reconnect: true,
    reconnectionAttempts: 5,
    timeout: 30000,
    minTimeout: 15000,
    lazy: false, // Always connect immediately
    connectionParams: () => {
      // Get auth from localStorage if available
      const user = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user')) : {};
      
      return {
        username: user.username || ''
      };
    },
    // Handle WebSocket events
    connectionCallback: (error) => {
      if (error) {
        console.error('WebSocket connection error:', error);
      } else {
        console.log('WebSocket connected successfully');
      }
    }
  }
}) : null;

// Split links based on operation type
// - Use WebSocket for subscription operations
// - Use HTTP for queries and mutations
const splitLink = typeof window !== 'undefined' && wsLink !== null
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

// Create Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  connectToDevTools: true, // Enable dev tools in development
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Don't use cache for queries by default
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only', 
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all'
    },
    subscription: {
      errorPolicy: 'all'
    }
  },
});

// Log when client is created
console.log('Apollo Client created with WebSocket support');

export default client;
