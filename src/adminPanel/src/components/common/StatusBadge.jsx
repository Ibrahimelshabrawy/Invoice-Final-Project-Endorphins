import React from 'react';

export default function StatusBadge({ status, label, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();
  let badgeClass = 'badge-draft';
  let displayLabel = label || normalized;

  switch (normalized) {
    case 'DRAFT':
      badgeClass = 'badge-draft';
      break;
    case 'SENT':
      badgeClass = 'badge-sent';
      break;
    case 'PAID':
      badgeClass = 'badge-paid';
      break;
    case 'OVERDUE':
      badgeClass = 'badge-overdue';
      break;
    case 'CANCELLED':
      badgeClass = 'badge-cancelled';
      break;
    case 'ACTIVE':
    case 'TRUE':
      badgeClass = 'badge-active';
      displayLabel = label || 'Active';
      break;
    case 'INACTIVE':
    case 'FALSE':
      badgeClass = 'badge-inactive';
      displayLabel = label || 'Inactive';
      break;
    case 'SERVICE':
      badgeClass = 'badge-service';
      break;
    case 'BUNDLE':
      badgeClass = 'badge-bundle';
      break;
    default:
      badgeClass = 'badge-draft';
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {displayLabel}
    </span>
  );
}
