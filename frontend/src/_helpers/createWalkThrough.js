import * as Driver from 'driver.js';
import { addToLocalStorage, getDataFromLocalStorage } from '@/_helpers/appUtils';
import 'driver.js/dist/driver.min.css';

export const initEditorWalkThrough = () => {
  if (
    getDataFromLocalStorage('walkthroughCompleted') == undefined ||
    !getDataFromLocalStorage('walkthroughCompleted')
  ) {
    const darkMode = getDataFromLocalStorage('darkMode') === 'true';
    const driver = new Driver({
      allowClose: true,
      closeBtnText: 'Skip',
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      padding: 2,
      onReset: () => {
        // Here we need to write the logic to update walkthroughCompleted column of the current user.
        addToLocalStorage({ key: 'walkthroughCompleted', value: true });
      },
      className: `${darkMode ? 'dark-theme' : 'light-theme'}-walkthrough`,
    });

    driver.defineSteps([
      {
        element: '.component-image-holder',
        popover: {
          title: 'Drag and drop components',
          description: 'From the component sidebar, drag and drop components to the canvas.',
          position: 'left',
          closeBtnText: 'Skip (1/6)',
        },
      },
      {
        element: '.sidebar-datasources',
        popover: {
          title: 'Connect to data sources',
          description: 'You can manage your data sources from here.',
          position: 'right',
          closeBtnText: 'Skip (2/6)',
        },
      },
      {
        element: '.left-sidebar-inspector',
        popover: {
          title: 'Inspector',
          description: 'Inspector lets you check the properties of components, results of queries etc.',
          position: 'right',
          closeBtnText: 'Skip (3/6)',
        },
      },
      {
        element: '.queries-header ',
        popover: {
          title: 'Create queries',
          description:
            'Create queries to interact with your data sources, run JavaScript snippets and to make API requests.',
          position: 'top',
          closeBtnText: 'Skip (4/6)',
        },
      },
      {
        element: '.release-buttons',
        popover: {
          title: 'Preview, release & share',
          description:
            'Click on preview to view the current changes on app viewer. Click on share button to view the sharing options. Release the editing version to make the changes live. Released versions cannot be modified, you will have to create another version to make more changes.',
          position: 'bottom',
          closeBtnText: 'Skip (5/6)',
        },
      },
      {
        element: '.sidebar-comments',
        popover: {
          title: 'Collaborate',
          description: 'Add comments on canvas and tag your team members to collaborate.',
          position: 'right',
          closeBtnText: 'Skip (6/6)',
        },
      },
    ]);

    driver.start();
  }
};
