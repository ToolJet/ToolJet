import { ViewPlugin } from '@codemirror/view';
import { completionStatus } from '@codemirror/autocomplete';

/**
 * A ViewPlugin that shows a tooltip when hovering over a truncated autocomplete label.
 * Uses completionStatus to attach/detach mouseover listeners only while autocomplete is open.
 */
export const completionLabelTooltip = ViewPlugin.define(() => {
  let tooltipEl = null;
  let listening = false;

  function showTooltip(label) {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'cm-completion-overflow-tooltip';
      document.body.appendChild(tooltipEl);
    }
    tooltipEl.textContent = label.textContent;
    tooltipEl.style.display = 'block';
    const rect = label.getBoundingClientRect();
    const tooltipW = tooltipEl.getBoundingClientRect().width;
    let left = rect.left + rect.width / 2 - tooltipW / 2;
    // Clamp to viewport edges
    left = Math.max(4, Math.min(left, window.innerWidth - tooltipW - 4));
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${rect.bottom + 6}px`;
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  function handleMouseOver(e) {
    const label = e.target.closest?.('.cm-completionLabel') || e.target.closest?.('.cm-completionInfo');
    if (label && label.scrollWidth > label.clientWidth) {
      showTooltip(label);
    } else {
      hideTooltip();
    }
  }

  function handleMouseOut(e) {
    if (!e.relatedTarget?.closest?.('.cm-tooltip-autocomplete') && !e.relatedTarget?.closest?.('.cm-completionInfo')) {
      hideTooltip();
    }
  }

  function startListening() {
    if (listening) return;
    listening = true;
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
  }

  function stopListening() {
    if (!listening) return;
    listening = false;
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    hideTooltip();
  }

  return {
    update(update) {
      if (completionStatus(update.state)) {
        startListening();
      } else {
        stopListening();
      }
    },
    destroy() {
      stopListening();
      if (tooltipEl) tooltipEl.remove();
      tooltipEl = null;
    },
  };
});
