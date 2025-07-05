export const CONNECTION_STATUS = {
  UNKNOWN: -1, // This is not a valid WebSocket state, but can be used to indicate an unknown state
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};
