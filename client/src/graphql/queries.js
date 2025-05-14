import { gql } from '@apollo/client';

// Query to get all users
export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      email
      username
      isStudent
    }
  }
`;

// Query to get messages between two users
export const GET_MESSAGES = gql`
  query GetMessages($sender: String!, $receiver: String!) {
    getMessages(sender: $sender, receiver: $receiver) {
      id
      sender
      receiver
      content
      timestamp
    }
  }
`;

// Mutation to send a message
export const SEND_MESSAGE = gql`
  mutation SendMessage($sender: String!, $receiver: String!, $content: String!) {
    sendMessage(sender: $sender, receiver: $receiver, content: $content) {
      id
      sender
      receiver
      content
      timestamp
    }
  }
`;

// Subscription to receive new messages
export const MESSAGE_RECEIVED = gql`
  subscription MessageReceived($receiver: String!) {
    messageReceived(receiver: $receiver) {
      id
      sender
      receiver
      content
      timestamp
    }
  }
`;
