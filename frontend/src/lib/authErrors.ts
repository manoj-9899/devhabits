// src/lib/authErrors.ts — friendlier Supabase Auth error messages

export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('email rate limit')) {
    return (
      'Supabase has temporarily limited sign-up emails for this project (about 6 per hour on the free plan). ' +
      'Wait an hour, turn off “Confirm email” in Supabase → Authentication → Providers → Email, ' +
      'or add test users in Supabase → Authentication → Users → Add user.'
    );
  }

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'This email already has an account. Try Log in instead.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Wrong email or password. Try again or sign up.';
  }

  return message;
}
