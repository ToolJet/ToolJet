import React from 'react';
import { AuthLayout } from '../AuthLayout';
import { InviteSignupForm } from '../InviteSignupForm';
import { JoinWorkspaceForm } from '../JoinWorkspaceForm';

export default {
  title: 'Auth/Flows/TeamInvite',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      viewports: {
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: false,
      description: 'Content to be displayed within the auth layout',
    },
  },
};

// Team Invite Flow - Step 1: Invite Signup
export const TeamInviteSignupFlow = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: (
      <InviteSignupForm
        headerText="Sign up"
        descriptionText="You have been invited to join a workspace. Please create your account to continue."
        emailLabel="Email"
        emailPlaceholder="Enter your email"
        emailValue="nithin@dev.io"
        emailDisabled={true}
        passwordLabel="Password"
        passwordPlaceholder="Create password"
        buttonText="Create account"
      />
    ),
  },
};

// Team Invite Flow - Step 2: Join Workspace
export const TeamInviteJoinWorkspaceFlow = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: (
      <JoinWorkspaceForm
        headerText="Join Dev's workspace"
        descriptionText="You are invited to a workspace Dev's workspace. Accept the invite to join the workspace."
        nameLabel="Name"
        namePlaceholder="Enter your name"
        nameValue="Nithin"
        emailLabel="Email"
        emailPlaceholder="Enter your email"
        emailValue="nithin@dev.io"
        buttonText="Accept Invite"
      />
    ),
  },
};
