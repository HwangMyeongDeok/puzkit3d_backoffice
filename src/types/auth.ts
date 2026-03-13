export type Role = 'STAFF' | 'MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
