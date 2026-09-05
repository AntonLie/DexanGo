import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Loader, Stack, Text, Button, Title } from '@mantine/core';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return (
      <Center h="100vh" p="md">
        <Stack align="center">
          <Title order={3}>Access Denied</Title>
          <Text c="dimmed" ta="center">
            This portal is for HRD administrators only.
          </Text>
          <Button variant="light" color="red" onClick={logout}>
            Sign out
          </Button>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}
