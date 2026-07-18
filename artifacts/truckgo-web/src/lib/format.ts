export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "pending":
      return "warning";
    case "accepted":
      return "info";
    case "in_progress":
      return "info";
    case "completed":
      return "success";
    case "cancelled":
      return "destructive";
    default:
      return "default";
  }
}
