import { createSlice } from "@reduxjs/toolkit";

interface ModalState {
    signupOpen: boolean;
    loginOpen: boolean;
}

const initialState: ModalState = {
    signupOpen: false,
    loginOpen: false,
};

const modalSlice = createSlice({
    name: "modal",
    initialState,
    reducers: {
        openSignup: (state) => { state.signupOpen = true; },
        closeSignup: (state) => { state.signupOpen = false; },
        openLogin: (state) => { state.loginOpen = true; },
        closeLogin: (state) => { state.loginOpen = false; },
    },
});

export const { openSignup, closeSignup, openLogin, closeLogin } = modalSlice.actions;
export default modalSlice.reducer;
