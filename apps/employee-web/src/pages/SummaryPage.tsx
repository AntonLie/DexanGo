import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  Stack,
  Title,
  Group,
  Button,
  Text,
  Badge,
  Center,
  SimpleGrid,
  Divider,
  Skeleton,
  ActionIcon,
  Drawer,
  Modal,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconSearch, IconCalendar, IconFilter, IconArrowRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { AttendanceSummaryRow } from '@dexago/shared';
import { api } from '../api';
import { ymd, formatDate, formatTime, formatDayLabel } from '../lib/date';
import { PageMeta } from '../components/PageMeta';

const PAGE_SIZE = 8;
const DATE_FORMAT = 'DD MMM YYYY';
const DROPDOWN_Z = 1100; // keep the calendar above the filter dialog (zIndex 1000)
const HEADER_H = 56; // AppShell header height — sticky offset

const PRESETS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
];
const DEFAULT_DAYS = 7; // default / reset range = last week

function atMidnight(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function today(): Date {
  return atMidnight(new Date());
}

function rangeStart(days: number): Date {
  const d = today();
  d.setDate(d.getDate() - (days - 1));
  return d;
}

function parseYmd(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function SummaryCardSkeleton() {
  return (
    <Card withBorder radius="md" padding="md">
      <Skeleton height={14} width="55%" mb="sm" />
      <Divider mb="sm" />
      <SimpleGrid cols={2}>
        <Skeleton height={30} radius="sm" />
        <Skeleton height={30} radius="sm" />
      </SimpleGrid>
    </Card>
  );
}

function SummaryCard({ row }: { row: AttendanceSummaryRow }) {
  return (
    <Card withBorder radius="md" padding="md">
      <Group gap="xs" mb="sm">
        <IconCalendar size={16} />
        <Text fw={600} size="sm">
          {formatDate(row.date)}
        </Text>
      </Group>
      <Divider mb="sm" />
      <SimpleGrid cols={2}>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Check In
          </Text>
          <Badge color={row.checkIn ? 'green' : 'gray'} variant="light" size="lg">
            {formatTime(row.checkIn)}
          </Badge>
        </Stack>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Check Out
          </Text>
          <Badge color={row.checkOut ? 'blue' : 'gray'} variant="light" size="lg">
            {formatTime(row.checkOut)}
          </Badge>
        </Stack>
      </SimpleGrid>
    </Card>
  );
}

export function SummaryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [from, setFrom] = useState<Date | null>(
    () => parseYmd(searchParams.get('from')) ?? rangeStart(DEFAULT_DAYS),
  );
  const [to, setTo] = useState<Date | null>(() => parseYmd(searchParams.get('to')) ?? today());
  const [draftFrom, setDraftFrom] = useState<Date | null>(from);
  const [draftTo, setDraftTo] = useState<Date | null>(to);
  const [filterOpen, { open, close }] = useDisclosure(false);
  const isDesktop = useMediaQuery('(min-width: 48em)', true, {
    getInitialValueInEffect: false,
  });

  const [rows, setRows] = useState<AttendanceSummaryRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = (f: Date | null, t: Date | null) => ({
    from: f ? ymd(f) : undefined,
    to: t ? ymd(t) : undefined,
  });

  const loadFirstPage = async (f: Date | null, t: Date | null) => {
    setLoading(true);
    try {
      const page = await api.summary({ ...query(f, t), limit: PAGE_SIZE });
      setRows(page.rows);
      setNextCursor(page.nextCursor);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load summary',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirstPage(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await api.summary({ ...query(from, to), cursor: nextCursor, limit: PAGE_SIZE });
      setRows((prev) => [...prev, ...page.rows]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load more',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const openFilter = () => {
    setDraftFrom(from);
    setDraftTo(to);
    open();
  };

  const applyRange = (f: Date | null, t: Date | null, clearUrl = false) => {
    setFrom(f);
    setTo(t);
    if (clearUrl) {
      setSearchParams({}, { replace: true });
    } else {
      const params: Record<string, string> = {};
      if (f) params.from = ymd(f);
      if (t) params.to = ymd(t);
      setSearchParams(params, { replace: true });
    }
    close();
    loadFirstPage(f, t);
  };

  const applyFilter = () => applyRange(draftFrom, draftTo);
  const applyPreset = (days: number) => applyRange(rangeStart(days), today());
  const resetFilter = () => applyRange(rangeStart(DEFAULT_DAYS), today(), true);

  const isActivePreset = (days: number) =>
    !!from && !!to && ymd(from) === ymd(rangeStart(days)) && ymd(to) === ymd(today());

  const hasMore = !loading && !!nextCursor;

  useEffect(() => {
    if (loading || loadingMore || !nextCursor) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loadMore();
      },
      { rootMargin: '120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, nextCursor, from, to]);

  const filterBody = (
    <Stack pb="md">
      <div>
        <Text size="xs" c="dimmed" fw={600} mb={6}>
          Template
        </Text>
        <Group gap="xs">
          {PRESETS.map((p) => (
            <Button
              key={p.days}
              size="xs"
              radius="xl"
              variant={isActivePreset(p.days) ? 'filled' : 'light'}
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </Group>
      </div>

      <DatePickerInput
        label="From"
        leftSection={<IconCalendar size={16} />}
        value={draftFrom}
        onChange={setDraftFrom}
        valueFormat={DATE_FORMAT}
        clearable
        popoverProps={{ zIndex: DROPDOWN_Z }}
      />
      <DatePickerInput
        label="To"
        leftSection={<IconCalendar size={16} />}
        value={draftTo}
        onChange={setDraftTo}
        valueFormat={DATE_FORMAT}
        clearable
        popoverProps={{ zIndex: DROPDOWN_Z }}
      />
      <Group grow mt="xs">
        <Button variant="default" onClick={resetFilter}>
          Reset
        </Button>
        <Button leftSection={<IconSearch size={16} />} onClick={applyFilter} loading={loading}>
          Apply
        </Button>
      </Group>
    </Stack>
  );

  return (
    <Stack maw={640} mx="auto">
      <PageMeta title="Summary" description="Review your daily work-from-home attendance summary." />
      <Box
        pt="xs"
        pb="sm"
        style={{
          position: 'sticky',
          top: HEADER_H,
          zIndex: 3,
          background: 'var(--mantine-color-body)',
          boxShadow: '0 6px 8px -6px rgba(0, 0, 0, 0.18)',
        }}
      >
        <Title order={3} mb="sm">
          Attendance Summary
        </Title>

        <Card
          withBorder
          radius="md"
          padding="md"
          onClick={openFilter}
          style={{ cursor: 'pointer' }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={6}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Filter Period
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Badge variant="light" color="indigo" size="lg">
                  {formatDayLabel(from)}
                </Badge>
                <IconArrowRight size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />
                <Badge variant="light" color="indigo" size="lg">
                  {formatDayLabel(to)}
                </Badge>
              </Group>
            </Stack>
            <ActionIcon variant="subtle" color="indigo" aria-label="Edit filter">
              <IconFilter size={18} />
            </ActionIcon>
          </Group>
        </Card>
      </Box>

      {loading ? (
        <Stack>
          {Array.from({ length: 5 }).map((_, i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </Stack>
      ) : rows.length === 0 ? (
        <Card withBorder radius="md" padding="xl">
          <Center>
            <Text c="dimmed">No attendance records in this range.</Text>
          </Center>
        </Card>
      ) : (
        <Stack>
          {rows.map((row) => (
            <SummaryCard key={row.date} row={row} />
          ))}
          {loadingMore && <SummaryCardSkeleton />}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
        </Stack>
      )}

      <ActionIcon
        onClick={openFilter}
        size={56}
        radius="xl"
        color="indigo"
        variant="filled"
        aria-label="Filter dates"
        hiddenFrom="sm"
        style={{
          position: 'fixed',
          right: 'max(16px, calc(50vw - 320px + 16px))',
          bottom: 80,
          boxShadow: 'var(--mantine-shadow-lg)',
          zIndex: 150,
        }}
      >
        <IconFilter size={24} />
      </ActionIcon>

      {isDesktop ? (
        <Modal
          opened={filterOpen}
          onClose={close}
          title="Filter Period"
          centered
          radius="lg"
          zIndex={1000}
        >
          {filterBody}
        </Modal>
      ) : (
        <Drawer
          opened={filterOpen}
          onClose={close}
          position="bottom"
          title="Filter Period"
          radius="lg"
          size="sm"
          zIndex={1000}
        >
          {filterBody}
        </Drawer>
      )}
    </Stack>
  );
}
