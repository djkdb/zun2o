// Asking someone their name, in the ways people type it. Its own module so replies.ts and
// s2/replies.ts can both use it without importing each other in a circle.
export const ASKS_NAME = /이름(이|은)?\s*(뭐|머|알려|말해|있)|성함/;
