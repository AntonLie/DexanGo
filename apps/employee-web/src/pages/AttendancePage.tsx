import { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Title,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Center,
  Loader,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLogin2, IconLogout2, IconClock } from '@tabler/icons-react';
import type { TodayAttendance } from '@dexago/shared';
import { ApiError } from '@dexago/api-client';
import { api } from '../api';
import { formatTime } from '../lib/date';
import { PageMeta } from '../components/PageMeta';

export function AttendancePage() {
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      setToday(await api.todayAttendance());
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load attendance',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (kind: 'in' | 'out') => {
    setActing(true);
    try {
      if (kind === 'in') await api.checkIn();
      else await api.checkOut();
      notifications.show({
        color: 'green',
        title: 'Success',
        message: kind === 'in' ? 'Checked in — have a great day!' : 'Checked out — see you tomorrow!',
      });
      await load();
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Action failed';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack maw={720} mx="auto">
      <PageMeta title="Attendance" description="Check in and out and track your work-from-home attendance." />
      <Title order={3}>Attendance</Title>

      <Card withBorder radius="md" padding="xl">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light" color="indigo">
            <IconClock size={32} />
          </ThemeIcon>
          <Text size="2rem" fw={700} ff="monospace">
            {now.toLocaleTimeString('en-GB')}
          </Text>
          <Text c="dimmed">
            {now.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Card withBorder radius="md" padding="lg">
          <Stack align="center">
            <Badge size="lg" variant="light" color={today?.checkedIn ? 'green' : 'gray'}>
              Check In
            </Badge>
            <Text size="xl" fw={600}>
              {formatTime(today?.checkInTime ?? null)}
            </Text>
            <Button
              fullWidth
              color="green"
              leftSection={<IconLogin2 size={18} />}
              disabled={today?.checkedIn}
              loading={acting}
              onClick={() => act('in')}
            >
              {today?.checkedIn ? 'Checked In' : 'Check In'}
            </Button>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Stack align="center">
            <Badge size="lg" variant="light" color={today?.checkedOut ? 'blue' : 'gray'}>
              Check Out
            </Badge>
            <Text size="xl" fw={600}>
              {formatTime(today?.checkOutTime ?? null)}
            </Text>
            <Button
              fullWidth
              color="blue"
              leftSection={<IconLogout2 size={18} />}
              disabled={!today?.checkedIn || today?.checkedOut}
              loading={acting}
              onClick={() => act('out')}
            >
              {today?.checkedOut ? 'Checked Out' : 'Check Out'}
            </Button>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
