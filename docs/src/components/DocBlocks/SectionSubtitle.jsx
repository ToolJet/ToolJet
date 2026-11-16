import React from 'react';
import './DocBlocks.css';

/** One muted line directly under a section heading. */
export default function SectionSubtitle({ text }) {
  return <p className="docblk-section-subtitle">{text}</p>;
}
