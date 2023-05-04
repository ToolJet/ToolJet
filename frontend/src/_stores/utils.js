import { devtools } from 'zustand/middleware';

export const zustandDevTools = process.env.NODE_ENV === 'production' ? (fn) => fn : devtools;
