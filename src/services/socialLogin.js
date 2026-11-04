const providers = ['google', 'facebook'];
const destinations = ['/kids', '/operations', '/parent', '/tawasl'];

export function enabledProviders(settings) {
  return providers.filter(provider => settings?.external?.[provider] === true);
}

export function socialLoginOptions(provider, origin, destination) {
  if (!providers.includes(provider)) throw new Error('Unsupported sign-in provider');
  const callback = new URL('/complete-profile', origin);
  if (destinations.includes(destination)) callback.searchParams.set('next', destination);
  const options = { redirectTo: callback.href };
  if (provider === 'google') options.queryParams = { prompt: 'select_account' };
  else options.scopes = 'email';
  return { provider, options };
}
