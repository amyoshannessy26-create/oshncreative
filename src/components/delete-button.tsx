"use client";

export function DeleteButton({ action, label = "Delete" }: { action: () => Promise<void>; label?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Are you sure?")) e.preventDefault();
      }}
    >
      <button type="submit" className="text-xs font-medium text-danger hover:underline">
        {label}
      </button>
    </form>
  );
}
