// Input validation helpers
// Returns null on success, or an error string to show inline.

export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 3) return 'Username must be at least 3 characters.';
  if (trimmed.length > 20) return 'Username must be 20 characters or fewer.';
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
    return 'Username can only contain letters, numbers, and underscores.';
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 50) return 'Name must be 50 characters or fewer.';
  return null;
}

export function validateGroupName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Group name is required.';
  if (trimmed.length < 2) return 'Group name must be at least 2 characters.';
  if (trimmed.length > 50) return 'Group name must be 50 characters or fewer.';
  return null;
}
