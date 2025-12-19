import { Loader2, Mail, Lock, User, LogOut, Chrome } from "lucide-react";

export const Icons = {
  spinner: Loader2,
  mail: Mail,
  lock: Lock,
  user: User,
  logout: LogOut,
  google: Chrome,
};

export type IconName = keyof typeof Icons;
