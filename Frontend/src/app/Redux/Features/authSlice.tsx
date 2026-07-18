import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  _id: string | null;
  username: string | null;
  profilePic: string | null;
  email: string | null;
  phoneNo: string | number | null;
  isAdmin: boolean;
  role: "superadmin" | "admin" | "user";
  isVerified: boolean;
  loading: boolean;
  error: string | null;
}

const getUserFromLocalStorage = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

const storedUser = getUserFromLocalStorage();

const initialState: AuthState = storedUser
  ? {
      _id: storedUser._id ?? null,
      username: storedUser.username ?? null,
      profilePic: storedUser.profilePic ?? null,
      email: storedUser.email ?? null,
      phoneNo: storedUser.phoneNo ?? null,
      isAdmin: storedUser.isAdmin ?? false,
      role: storedUser.role ?? "user",
      isVerified: storedUser.isVerified ?? false,
      loading: false,
      error: null,
    }
  : {
      _id: null,
      username: null,
      profilePic: null,
      email: null,
      phoneNo: null,
      isAdmin: false,
      role: "user",
      isVerified: false,
      loading: false,
      error: null,
    };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        _id: string;
        username: string;
        profilePic: string;
        email: string;
        phoneNo: string;
        isVerified: boolean;
        isAdmin: boolean;
        role?: "superadmin" | "admin" | "user";
      }>,
    ) => {
      const user = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
      }

      state._id = user._id;
      state.username = user.username;
      state.profilePic = user.profilePic;
      state.email = user.email;
      state.phoneNo = user.phoneNo;
      state.isVerified = user.isVerified;
      state.isAdmin = user.isAdmin;
      state.role = user.role ?? "user";

      state.loading = false;
      state.error = null;
    },

    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    logout: (state) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }

      state._id = null;
      state.username = null;
      state.profilePic = null;
      state.email = null;
      state.phoneNo = null;
      state.isVerified = false;
      state.isAdmin = false;
      state.role = "user";
      state.loading = false;
      state.error = null;
    },
  },
});

export const { loginRequest, loginSuccess, loginFailure, logout } =
  authSlice.actions;
export default authSlice.reducer;
