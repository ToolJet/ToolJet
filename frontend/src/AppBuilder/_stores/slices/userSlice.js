const initialState = {
  user: {},
};

export const createUserSlice = (set) => ({
  ...initialState,
  setUser: (user) => set(() => ({ user }), false, 'setUser'),
});
