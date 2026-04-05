"use client";

import { useAuth } from "@/hooks/useAuth";

type NavbarUserNameProps = {
  fallback?: string;
};

const NavbarUserName = ({ fallback = "User" }: NavbarUserNameProps) => {
  const { user } = useAuth();

  const name = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "";

  return <>{name || fallback}</>;
};

export default NavbarUserName;
