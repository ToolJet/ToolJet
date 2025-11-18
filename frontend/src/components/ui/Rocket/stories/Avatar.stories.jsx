import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../avatar";

export default {
  title: "UI/Rocket/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};

export const Default = () => (
  <Avatar>
    <AvatarImage src="https://github.com/shadcn.png" />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
);

export const Fallback = () => (
  <Avatar>
    <AvatarImage src="https://thishouldnotexist.com/nonexistent.png" />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
);
