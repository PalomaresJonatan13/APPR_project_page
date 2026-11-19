/* A shared floating tooltip stays outside the table's scroll clipping. */
(() => {
  'use strict';
  const table = document.querySelector('#variable-rows');
  const tooltip = document.createElement('div');
  tooltip.id = 'variable-tooltip';
  tooltip.className = 'variable-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  const heading = document.createElement('strong');
  const description = document.createElement('p');
  const unit = document.createElement('small');
  tooltip.append(heading, description, unit);
  document.body.append(tooltip);
  let active = null;
  let closeTimer;

  function hide() {
    clearTimeout(closeTimer);
    if (active) active.removeAttribute('aria-describedby');
    active = null;
    tooltip.hidden = true;
  }
  function scheduleHide() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(hide, 150);
  }
  function show(trigger) {
    const detail = window.VARIABLE_DETAILS[trigger.dataset.variable];
    if (!detail) return;
    clearTimeout(closeTimer);
    if (active && active !== trigger) active.removeAttribute('aria-describedby');
    active = trigger;
    heading.textContent = trigger.dataset.variable;
    description.textContent = detail.description;
    unit.textContent = 'Unidad o codificación publicada: ' + detail.unit;
    trigger.setAttribute('aria-describedby', tooltip.id);
    tooltip.style.maxWidth = (document.documentElement.clientWidth - 24) + 'px';
    tooltip.hidden = false;
    const anchor = trigger.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const gap = 10, margin = 12;
    const left = Math.max(margin, Math.min(anchor.left, document.documentElement.clientWidth - box.width - margin));
    const above = anchor.top - box.height - gap;
    const top = above >= margin ? above : Math.min(anchor.bottom + gap, window.innerHeight - box.height - margin);
    tooltip.style.left = left + 'px';
    tooltip.style.top = Math.max(margin, top) + 'px';
  }
  table.addEventListener('pointerover', event => {
    const trigger = event.target.closest('.variable-hint');
    if (trigger && !trigger.contains(event.relatedTarget)) show(trigger);
  });
  table.addEventListener('pointerout', event => {
    const trigger = event.target.closest('.variable-hint');
    if (trigger && !trigger.contains(event.relatedTarget)) scheduleHide();
  });
  table.addEventListener('focusin', event => {
    const trigger = event.target.closest('.variable-hint');
    if (trigger) show(trigger);
  });
  table.addEventListener('focusout', scheduleHide);
  table.addEventListener('click', event => {
    const trigger = event.target.closest('.variable-hint');
    if (trigger) show(trigger);
  });
  tooltip.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  tooltip.addEventListener('pointerleave', scheduleHide);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.variable-hint, .variable-tooltip')) hide();
  });
  document.addEventListener('input', hide);
  document.addEventListener('change', hide);
  window.addEventListener('resize', hide);
  document.addEventListener('scroll', event => {
    if (!tooltip.contains(event.target)) hide();
  }, true);
})();
