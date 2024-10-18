

export interface EventPayloads {
  'user.welcome-admin-first': { name: string; email: string; password: string; webAdmin: string };
  'user.new-password': { name: string; email: string; password: string; webAdmin: string };
  'user.reset-password': { name: string; email: string; link: string };
  'user.verify-email': { name: string; email: string; otp: string };
  'client.forgot-password': { name: string; email: string; link: string };

}
