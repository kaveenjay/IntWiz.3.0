import type { User } from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login:         (email: string, password: string) => Promise<void>;
  register:      (email: string, password: string) => Promise<void>;
  logout:        () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface AuthError {
  code:    string;
  message: string;
}
