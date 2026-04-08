import React, { SVGProps } from 'react';

type IllustrationProps = SVGProps<SVGSVGElement>;

export default function ModulesEmptyState(svgProps: IllustrationProps): React.ReactNode {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';

  return isDarkMode ? <ModulesDark {...svgProps} /> : <ModulesLight {...svgProps} />;
}

const ModulesLight = (props: SVGProps<SVGSVGElement>) => (
  <svg width="300" height="207" viewBox="0 0 300 207" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip0_modules_light)">
      <rect width="300" height="207" rx="16" fill="#EAF1FA" />
      <rect width="300" height="193" rx="16" fill="white" />
      <circle cx="20.5012" cy="20.5001" r="4.5" fill="#D8E6FF" />
      <circle cx="33.5012" cy="20.5001" r="4.5" fill="#D8E6FF" />
      <circle cx="46.5012" cy="20.5001" r="4.5" fill="#D8E6FF" />
      <rect x="16.0012" y="33.0001" width="268" height="146" rx="4" fill="#EAF1FA" />
      <path fillRule="evenodd" clipRule="evenodd" d="M74.6377 61.4837C74.8379 61.2834 75.1626 61.2834 75.3629 61.4837L77.6706 63.7914C77.8709 63.9917 77.8709 64.3164 77.6706 64.5166L75.3629 66.8243C75.1626 67.0246 74.8379 67.0246 74.6377 66.8243L72.33 64.5166C72.1297 64.3164 72.1297 63.9917 72.33 63.7914L74.6377 61.4837ZM70.7915 65.3299C70.9918 65.1296 71.3165 65.1296 71.5167 65.3299L73.8244 67.6375C74.0247 67.8378 74.0247 68.1625 73.8244 68.3628L71.5167 70.6705C71.3165 70.8707 70.9918 70.8707 70.7915 70.6705L68.4838 68.3628C68.2836 68.1625 68.2836 67.8378 68.4838 67.6375L70.7915 65.3299ZM79.2091 65.3299C79.0088 65.1296 78.6841 65.1296 78.4838 65.3299L76.1761 67.6375C75.9759 67.8378 75.9759 68.1625 76.1761 68.3628L78.4838 70.6705C78.6841 70.8707 79.0088 70.8707 79.2091 70.6705L81.5168 68.3628C81.717 68.1625 81.717 67.8378 81.5168 67.6375L79.2091 65.3299ZM75.3629 69.176C75.1626 68.9757 74.8379 68.9757 74.6377 69.176L72.33 71.4837C72.1297 71.684 72.1297 72.0087 72.33 72.209L74.6377 74.5167C74.8379 74.7169 75.1626 74.7169 75.3629 74.5167L77.6706 72.209C77.8709 72.0087 77.8709 71.684 77.6706 71.4837L75.3629 69.176Z" fill="#A5C1F1" />
      <rect x="67.5002" y="76.5001" width="99" height="75" rx="11.5" stroke="#D4DEFF" />
      <rect x="75.0002" y="84.0001" width="40" height="36" rx="4" fill="white" />
      <rect x="75.0002" y="128" width="40" height="4" rx="2" fill="#CFE1FF" />
      <rect x="75.0002" y="140" width="20" height="4" rx="2" fill="#CFE1FF" />
      <rect x="216" y="45.0001" width="56" height="122" rx="2" fill="white" />
      <rect x="222" y="63.0001" width="12" height="4" rx="0.942108" fill="#E6EFFF" />
      <rect x="222" y="71.0001" width="44" height="7" rx="0.942108" fill="#E6EFFF" />
      <rect x="222" y="86.0001" width="12" height="4" rx="0.942108" fill="#E6EFFF" />
      <rect x="222" y="94.0001" width="44" height="7" rx="0.942108" fill="#E6EFFF" />
      <g filter="url(#filter0_modules_light)">
        <path d="M233.442 105.425C232.353 104.803 231.038 105.728 231.226 106.982L233.781 124.079C233.995 125.508 235.863 125.861 236.568 124.605L239.914 118.637C240.037 118.417 240.208 118.229 240.414 118.086C240.619 117.942 240.854 117.848 241.1 117.81L247.874 116.764C249.286 116.546 249.628 114.634 248.382 113.925L233.442 105.425Z" fill="#282828" />
      </g>
    </g>
    <rect x="0.516381" y="0.516381" width="298.967" height="205.967" rx="15.4836" stroke="#CFE1FF" strokeWidth="1.03276" />
    <defs>
      <filter id="filter0_modules_light" x="225.208" y="103.226" width="29.9424" height="32.1495" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="3" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_modules_light" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_modules_light" result="shape" />
      </filter>
      <clipPath id="clip0_modules_light">
        <rect width="300" height="207" rx="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const ModulesDark = (props: SVGProps<SVGSVGElement>) => (
  <svg width="300" height="207" viewBox="0 0 300 207" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip0_modules_dark)">
      <rect width="300" height="207" rx="16" fill="#38425B" />
      <rect width="300" height="193" rx="16" fill="#212429" />
      <circle cx="20.5012" cy="20.5001" r="4.5" fill="#38425B" />
      <circle cx="33.5012" cy="20.5001" r="4.5" fill="#38425B" />
      <circle cx="46.5012" cy="20.5001" r="4.5" fill="#38425B" />
      <rect x="16.0012" y="33.0001" width="268" height="146" rx="4" fill="#38425B" />
      <path fillRule="evenodd" clipRule="evenodd" d="M74.6375 61.4837C74.8378 61.2834 75.1625 61.2834 75.3628 61.4837L77.6705 63.7914C77.8707 63.9917 77.8707 64.3164 77.6705 64.5166L75.3628 66.8243C75.1625 67.0246 74.8378 67.0246 74.6375 66.8243L72.3299 64.5166C72.1296 64.3164 72.1296 63.9917 72.3299 63.7914L74.6375 61.4837ZM70.7914 65.3299C70.9917 65.1296 71.3164 65.1296 71.5166 65.3299L73.8243 67.6375C74.0246 67.8378 74.0246 68.1625 73.8243 68.3628L71.5166 70.6705C71.3164 70.8707 70.9917 70.8707 70.7914 70.6705L68.4837 68.3628C68.2834 68.1625 68.2834 67.8378 68.4837 67.6375L70.7914 65.3299ZM79.209 65.3299C79.0087 65.1296 78.684 65.1296 78.4837 65.3299L76.176 67.6375C75.9757 67.8378 75.9757 68.1625 76.176 68.3628L78.4837 70.6705C78.684 70.8707 79.0087 70.8707 79.209 70.6705L81.5167 68.3628C81.7169 68.1625 81.7169 67.8378 81.5167 67.6375L79.209 65.3299ZM75.3628 69.176C75.1625 68.9757 74.8378 68.9757 74.6375 69.176L72.3299 71.4837C72.1296 71.684 72.1296 72.0087 72.3299 72.209L74.6375 74.5167C74.8378 74.7169 75.1625 74.7169 75.3628 74.5167L77.6705 72.209C77.8707 72.0087 77.8707 71.684 77.6705 71.4837L75.3628 69.176Z" fill="#212429" />
      <rect x="67.5002" y="76.5001" width="99" height="75" rx="11.5" stroke="#46547C" />
      <rect x="75.0002" y="84.0001" width="40" height="36" rx="4" fill="#212429" />
      <rect x="75.0002" y="128" width="40" height="4" rx="2" fill="#46547C" />
      <rect x="75.0002" y="140" width="20" height="4" rx="2" fill="#46547C" />
      <rect x="216" y="45.0001" width="56" height="122" rx="2" fill="#212429" />
      <rect x="222" y="63.0001" width="12" height="4" rx="0.942108" fill="#38425B" />
      <rect x="222" y="71.0001" width="44" height="7" rx="0.942108" fill="#38425B" />
      <rect x="222" y="86.0001" width="12" height="4" rx="0.942108" fill="#38425B" />
      <rect x="222" y="94.0001" width="44" height="7" rx="0.942108" fill="#38425B" />
      <g filter="url(#filter0_modules_dark)">
        <path d="M233.442 105.57C232.353 104.959 231.038 105.868 231.226 107.102L233.781 123.918C233.995 125.324 235.863 125.671 236.568 124.435L239.914 118.566C240.037 118.35 240.208 118.164 240.414 118.023C240.619 117.882 240.854 117.79 241.1 117.753L247.874 116.723C249.286 116.509 249.628 114.628 248.382 113.931L233.442 105.57Z" fill="#AFAFAF" />
      </g>
    </g>
    <rect x="0.516381" y="0.516381" width="298.967" height="205.967" rx="15.4836" stroke="#46547C" strokeWidth="1.03276" />
    <defs>
      <filter id="filter0_modules_dark" x="225.208" y="103.375" width="29.9424" height="31.8191" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="3" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_modules_dark" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_modules_dark" result="shape" />
      </filter>
      <clipPath id="clip0_modules_dark">
        <rect width="300" height="207" rx="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
