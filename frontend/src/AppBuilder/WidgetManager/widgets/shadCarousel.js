export const shadCarouselConfig = {
  name: 'ShadCarousel',
  displayName: 'Carousel',
  description:
    "Carousel of slides [{ image, title?, description?, link? }] (or image URLs) with arrows and dots, loop, autoplay (interval ms, pauses on hover), slidesPerView 1 to 4, aspectRatio ('16/9', '4/3', '1/1', '21/9' or 'fill' to fill the widget's height), imageFit cover or contain, captions as an overlay or below. Exposed currentIndex, currentSlide and clickedSlide (with its index); events onSlideChanged, onSlideClicked (a slide's link also opens in a new tab); actions next, previous, goTo(index). Height follows the width and ratio (+28px for dots, +52px for captions below)",
  component: 'ShadCarousel',
  defaultSize: {
    width: 20,
    height: 410,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    slides: {
      type: 'code',
      displayName: 'Slides',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ image: 'https://…/1.jpg', title: 'Summer sale', description: 'Up to 40% off', link: '' }]",
    },
    defaultIndex: {
      minValue: 0,
      maxValue: 100000,
      type: 'code',
      displayName: 'Start at slide (0-based)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 0,
      },
    },
    aspectRatio: {
      type: 'select',
      displayName: 'Aspect ratio',
      options: [
        {
          name: '16:9',
          value: '16/9',
        },
        {
          name: '4:3',
          value: '4/3',
        },
        {
          name: '3:2',
          value: '3/2',
        },
        {
          name: 'Square',
          value: '1/1',
        },
        {
          name: '21:9',
          value: '21/9',
        },
        {
          name: '3:4 (portrait)',
          value: '3/4',
        },
        {
          name: "Fill the widget's height",
          value: 'fill',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '16/9',
      },
    },
    imageFit: {
      type: 'switch',
      displayName: 'Image fit',
      options: [
        {
          displayName: 'Cover',
          value: 'cover',
        },
        {
          displayName: 'Contain',
          value: 'contain',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'cover',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    captionPosition: {
      type: 'switch',
      displayName: 'Caption',
      options: [
        {
          displayName: 'Overlay',
          value: 'overlay',
        },
        {
          displayName: 'Below',
          value: 'below',
        },
        {
          displayName: 'None',
          value: 'none',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'overlay',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    slidesPerView: {
      minValue: 1,
      maxValue: 4,
      type: 'code',
      displayName: 'Slides per view (1 to 4)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 1,
      },
    },
    showArrows: {
      type: 'toggle',
      displayName: 'Show arrows',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    showDots: {
      type: 'toggle',
      displayName: 'Show dots',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    loop: {
      type: 'toggle',
      displayName: 'Loop',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    autoplay: {
      type: 'toggle',
      displayName: 'Autoplay',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    interval: {
      minValue: 1000,
      maxValue: 600000,
      conditionallyRender: { key: 'autoplay', value: true },
      type: 'code',
      displayName: 'Autoplay interval (ms)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 5000,
      },
    },
    pauseOnHover: {
      conditionallyRender: { key: 'autoplay', value: true },
      type: 'toggle',
      displayName: 'Pause on hover',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingIndicator: {
      type: 'switch',
      displayName: 'Loading look',
      options: [
        {
          displayName: 'Spinner',
          value: 'spinner',
        },
        {
          displayName: 'Skeleton',
          value: 'skeleton',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'spinner',
      },
      isFxNotRequired: true,
      fullWidth: true,
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onSlideChanged: {
      displayName: 'On slide changed',
    },
    onSlideClicked: {
      displayName: 'On slide clicked',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    slideBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Slide background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    arrowBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Arrow background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    arrowColor: {
      type: 'colorSwatches',
      displayName: 'Arrow icon color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    dotColor: {
      type: 'colorSwatches',
      displayName: 'Dot color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    activeDotColor: {
      type: 'colorSwatches',
      displayName: 'Active dot color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    captionBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Caption overlay background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    captionTextColor: {
      type: 'colorSwatches',
      displayName: 'Caption overlay text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Caption title color (below)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    descriptionColor: {
      type: 'colorSwatches',
      displayName: 'Caption description color (below)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Slide radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
      },
    },
    gap: {
      type: 'numberInput',
      displayName: 'Gap between slides (px)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    currentIndex: 0,
    currentSlide: {},
    clickedSlide: {},
  },
  actions: [
    {
      handle: 'next',
      displayName: 'Next slide',
    },
    {
      handle: 'previous',
      displayName: 'Previous slide',
    },
    {
      handle: 'goTo',
      displayName: 'Go to slide',
      params: [
        {
          handle: 'index',
          displayName: 'Index (0-based)',
          defaultValue: '{{0}}',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      slides: {
        value:
          "{{[{ image: 'https://picsum.photos/seed/tj-coast/1200/675', title: 'Coastal routes', description: 'Plan deliveries along the shoreline' }, { image: 'https://picsum.photos/seed/tj-city/1200/675', title: 'City hubs', description: 'Twelve depots, one dashboard' }, { image: 'https://picsum.photos/seed/tj-hills/1200/675', title: 'Mountain passes', description: 'Seasonal schedules at a glance' }]}}",
      },
      defaultIndex: {
        value: '{{0}}',
      },
      aspectRatio: {
        value: '16/9',
      },
      imageFit: {
        value: 'cover',
      },
      captionPosition: {
        value: 'overlay',
      },
      slidesPerView: {
        value: '{{1}}',
      },
      showArrows: {
        value: '{{true}}',
      },
      showDots: {
        value: '{{true}}',
      },
      loop: {
        value: '{{true}}',
      },
      autoplay: {
        value: '{{false}}',
      },
      interval: {
        value: '{{5000}}',
      },
      pauseOnHover: {
        value: '{{true}}',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      loadingIndicator: {
        value: 'spinner',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
