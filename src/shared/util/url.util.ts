// URLS
const HOST_CLIENT_ADMIN_LOCAL = 'http://localhost:5173';
export const HOST_CLIENT_ADMIN_PROD = 'https://admin.padeltrack.app';
export const HOST_CLIENT_ADMIN_DEV = 'https://dashboard-padel-track-git-develop-padels-projects-a81ffce3.vercel.app';
export const HOST_CLIENT_PUBLIC_PROD = '';

// CLIENT
export const HOST_ADMINS = [HOST_CLIENT_ADMIN_LOCAL, HOST_CLIENT_ADMIN_PROD, HOST_CLIENT_ADMIN_DEV];
export const HOST_CLIENTS = [];

export const HOST_PERMITS = [...HOST_ADMINS, ...HOST_CLIENTS];
