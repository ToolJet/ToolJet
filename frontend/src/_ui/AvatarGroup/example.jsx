import React from "react";
import AvatarGroup from "./index";

const AvatarGroupExample = () => {
  const sampleAvatars = [
    {
      id: "1",
      text: "JD",
      title: "John Doe",
      subtitle: "john.doe@example.com",
      borderColor: "#3b82f6",
      image: null,
    },
    {
      id: "2",
      text: "JS",
      title: "Jane Smith",
      subtitle: "jane.smith@example.com",
      borderColor: "#10b981",
      image: null,
    },
    {
      id: "3",
      text: "MJ",
      title: "Mike Johnson",
      subtitle: "mike.johnson@example.com",
      borderColor: "#f59e0b",
      image: null,
    },
    {
      id: "4",
      text: "SL",
      title: "Sarah Lee",
      subtitle: "sarah.lee@example.com",
      borderColor: "#ef4444",
      image: null,
    },
    {
      id: "5",
      text: "DW",
      title: "David Wilson",
      subtitle: "david.wilson@example.com",
      borderColor: "#8b5cf6",
      image: null,
    },
  ];

  const handleAvatarClick = (avatar, index) => {
    console.log("Avatar clicked:", avatar, "at index:", index);
  };

  return (
    <div className="p-4">
      <h4>Avatar Group Examples</h4>

      <div className="mb-4">
        <h6>Default (max 3 avatars)</h6>
        <AvatarGroup avatars={sampleAvatars} />
      </div>

      <div className="mb-4">
        <h6>Max 2 avatars</h6>
        <AvatarGroup avatars={sampleAvatars} maxDisplay={2} />
      </div>

      <div className="mb-4">
        <h6>With click handler</h6>
        <AvatarGroup
          avatars={sampleAvatars}
          maxDisplay={3}
          onAvatarClick={handleAvatarClick}
        />
      </div>

      <div className="mb-4">
        <h6>Dark mode</h6>
        <div className="bg-dark p-3 rounded">
          <AvatarGroup avatars={sampleAvatars} maxDisplay={3} darkMode={true} />
        </div>
      </div>

      <div className="mb-4">
        <h6>Multiplayer variant (Figma design)</h6>
        <AvatarGroup
          avatars={sampleAvatars}
          maxDisplay={4}
          variant="multiplayer"
          onAvatarClick={handleAvatarClick}
        />
      </div>

      <div className="mb-4">
        <h6>Multiplayer with custom colors</h6>
        <AvatarGroup
          avatars={sampleAvatars.map((avatar) => ({
            ...avatar,
            borderColor: "#C3C7DF",
          }))}
          maxDisplay={3}
          variant="multiplayer"
        />
      </div>
    </div>
  );
};

export default AvatarGroupExample;
