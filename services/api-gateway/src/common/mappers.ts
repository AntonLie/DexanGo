import { Employee } from '../../generated/prisma';
import { EmployeeProfile, Role } from '@dexago/shared';

export function toEmployeeProfile(e: Employee): EmployeeProfile {
  const publicUrl = process.env.PUBLIC_URL ?? '';
  let photoUrl: string | null = null;
  if (e.photoUrl) {
    photoUrl = e.photoUrl.startsWith('http') ? e.photoUrl : `${publicUrl}${e.photoUrl}`;
  }
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    position: e.position,
    phone: e.phone,
    photoUrl,
    role: e.role as Role,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
