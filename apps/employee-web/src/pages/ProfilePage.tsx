import { useState } from 'react';
import {
  Card,
  Flex,
  Group,
  Avatar,
  Stack,
  Text,
  Title,
  TextInput,
  PasswordInput,
  Button,
  FileButton,
  Grid,
  Divider,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconPhone, IconLock, IconMail, IconBriefcase } from '@tabler/icons-react';
import { ApiError } from '@dexago/api-client';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import { PageMeta } from '../components/PageMeta';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const notifyError = (err: unknown, fallback: string) => {
    const msg = err instanceof ApiError || err instanceof Error ? err.message : fallback;
    notifications.show({ color: 'red', title: 'Error', message: msg });
  };

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const updated = await api.uploadPhoto(file);
      setUser(updated);
      notifications.show({ color: 'green', title: 'Success', message: 'Profile photo updated' });
    } catch (err) {
      notifyError(err, 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSavePhone = async () => {
    setSavingPhone(true);
    try {
      const updated = await api.updateProfile({ phone });
      setUser(updated);
      notifications.show({ color: 'green', title: 'Success', message: 'Phone number updated' });
    } catch (err) {
      notifyError(err, 'Failed to update phone');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSavePassword = async () => {
    if (password !== confirm) {
      notifications.show({ color: 'red', title: 'Error', message: 'Passwords do not match' });
      return;
    }
    if (password.length < 6) {
      notifications.show({ color: 'red', title: 'Error', message: 'Password must be at least 6 characters' });
      return;
    }
    setSavingPassword(true);
    try {
      await api.updateProfile({ password });
      setPassword('');
      setConfirm('');
      notifications.show({ color: 'green', title: 'Success', message: 'Password changed' });
    } catch (err) {
      notifyError(err, 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Stack maw={900} mx="auto">
      <PageMeta title="Profile" description="View and update your DexaGo employee profile." />
      <Title order={3}>Employee Profile</Title>

      <Card withBorder radius="md" padding="lg">
        <Flex
          direction={{ base: 'column', xs: 'row' }}
          align={{ base: 'center', xs: 'flex-start' }}
          gap="lg"
        >
          <Stack align="center" gap="sm">
            <Avatar src={user.photoUrl ?? undefined} size={120} radius={120} color="indigo">
              {user.name.charAt(0)}
            </Avatar>
            <FileButton onChange={handlePhoto} accept="image/png,image/jpeg,image/webp">
              {(props) => (
                <Button
                  {...props}
                  size="xs"
                  variant="light"
                  leftSection={<IconUpload size={14} />}
                  loading={uploading}
                >
                  Change Photo
                </Button>
              )}
            </FileButton>
          </Stack>

          <Stack gap="xs" w="100%" style={{ flex: 1 }}>
            <Group gap="xs">
              <Title order={4}>{user.name}</Title>
              <Badge color={user.role === 'ADMIN' ? 'grape' : 'indigo'} variant="light">
                {user.role}
              </Badge>
            </Group>
            <Group gap="xs" c="dimmed">
              <IconBriefcase size={16} />
              <Text size="sm">{user.position}</Text>
            </Group>
            <Group gap="xs" c="dimmed">
              <IconMail size={16} />
              <Text size="sm">{user.email}</Text>
            </Group>
            <Group gap="xs" c="dimmed">
              <IconPhone size={16} />
              <Text size="sm">{user.phone ?? '-'}</Text>
            </Group>
          </Stack>
        </Flex>
      </Card>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" padding="lg" h="100%">
            <Stack>
              <Group gap="xs">
                <IconPhone size={18} />
                <Text fw={600}>Update Phone Number</Text>
              </Group>
              <Divider />
              <TextInput
                label="Phone Number"
                placeholder="0812xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
              />
              <Button
                onClick={handleSavePhone}
                loading={savingPhone}
                disabled={phone === (user.phone ?? '')}
              >
                Save Phone
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" padding="lg" h="100%">
            <Stack>
              <Group gap="xs">
                <IconLock size={18} />
                <Text fw={600}>Change Password</Text>
              </Group>
              <Divider />
              <PasswordInput
                label="New Password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => setConfirm(e.currentTarget.value)}
              />
              <Button
                onClick={handleSavePassword}
                loading={savingPassword}
                disabled={!password}
              >
                Change Password
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
