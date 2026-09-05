import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Title,
  Card,
  Group,
  Button,
  Select,
  Table,
  Badge,
  Text,
  Center,
  Loader,
  Avatar,
  Pagination,
  Box,
  ActionIcon,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import {
  IconSearch,
  IconCalendar,
  IconRefresh,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type {
  AttendanceWithEmployee,
  AttendanceSortField,
  SortDir,
  EmployeeProfile,
} from '@dexago/shared';
import { api } from '../api';
import { ymd, parseYmd, formatDateTime } from '../lib/date';
import {
  pageSizeSelectData,
  parseLimit,
  parsePage,
  DEFAULT_LIMIT,
} from '../lib/pagination';
import { makeSortParser, parseDir, DEFAULT_DIR } from '../lib/sort';
import { PageMeta } from '../components/PageMeta';

const SORT_FIELDS: AttendanceSortField[] = ['employeeName', 'status', 'timestamp'];
const DEFAULT_SORT: AttendanceSortField = 'timestamp';

const parseSort = makeSortParser(SORT_FIELDS, DEFAULT_SORT);

export function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 48em)');

  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [from, setFrom] = useState<Date | null>(() => parseYmd(searchParams.get('from')));
  const [to, setTo] = useState<Date | null>(() => parseYmd(searchParams.get('to')));
  const [employeeId, setEmployeeId] = useState<string | null>(
    () => searchParams.get('employeeId'),
  );
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(() => parsePage(searchParams.get('page')));
  const [limit, setLimit] = useState(() => parseLimit(searchParams.get('limit')));
  const [sort, setSort] = useState<AttendanceSortField>(() => parseSort(searchParams.get('sort')));
  const [dir, setDir] = useState<SortDir>(() => parseDir(searchParams.get('dir')));
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (
    p = page,
    f = from,
    t = to,
    emp = employeeId,
    lim = limit,
    s = sort,
    d = dir,
  ) => {
    setLoading(true);
    try {
      const res = await api.allAttendance({
        from: f ? ymd(f) : undefined,
        to: t ? ymd(t) : undefined,
        employeeId: emp ?? undefined,
        page: p,
        limit: lim,
        sort: s,
        dir: d,
      });
      setRecords(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      const effPage = res.page > res.totalPages ? res.totalPages : p;
      setPage(effPage);

      const next: Record<string, string> = {};
      if (effPage > 1) next.page = String(effPage);
      if (lim !== DEFAULT_LIMIT) next.limit = String(lim);
      if (f) next.from = ymd(f);
      if (t) next.to = ymd(t);
      if (emp) next.employeeId = emp;
      if (s !== DEFAULT_SORT) next.sort = s;
      if (d !== DEFAULT_DIR) next.dir = d;
      setSearchParams(next, { replace: true });
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
    api
      .listEmployees({ limit: 100 })
      .then((res) => setEmployees(res.data))
      .catch(() => undefined);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = () => load(1);

  const reset = () => {
    setFrom(null);
    setTo(null);
    setEmployeeId(null);
    load(1, null, null, null);
  };

  const toggleSort = (field: AttendanceSortField) => {
    const nextDir: SortDir = sort === field ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(field);
    setDir(nextDir);
    load(1, from, to, employeeId, limit, field, nextDir);
  };

  const sortableTh = (field: AttendanceSortField, label: string) => (
    <Table.Th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(field)}>
      <Group gap={4} wrap="nowrap">
        <span>{label}</span>
        {sort === field ? (
          dir === 'asc' ? (
            <IconChevronUp size={14} />
          ) : (
            <IconChevronDown size={14} />
          )
        ) : (
          <IconSelector size={14} style={{ opacity: 0.4 }} />
        )}
      </Group>
    </Table.Th>
  );

  return (
    <Stack>
      <PageMeta title="Attendance" description="Monitor employee attendance records in DexaGo HRD Admin." />
      <Title order={3}>Employee Attendance (Read Only)</Title>

      <Card withBorder radius="md" padding="lg">
        <Group align="flex-end" gap="md" wrap="wrap">
          <Select
            label="Employee"
            placeholder="All employees"
            clearable
            searchable
            data={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.email})` }))}
            value={employeeId}
            onChange={setEmployeeId}
            w={{ base: '100%', sm: 260 }}
          />
          <DatePickerInput
            label="From"
            leftSection={<IconCalendar size={16} />}
            value={from}
            onChange={setFrom}
            valueFormat="DD MMM YYYY"
            clearable
            w={{ base: '100%', sm: 170 }}
          />
          <DatePickerInput
            label="To"
            leftSection={<IconCalendar size={16} />}
            value={to}
            onChange={setTo}
            valueFormat="DD MMM YYYY"
            clearable
            w={{ base: '100%', sm: 170 }}
          />
          <Group gap="sm" grow={isMobile} w={{ base: '100%', sm: 'auto' }}>
            <Button
              leftSection={<IconSearch size={16} />}
              onClick={search}
              loading={loading}
              color="teal"
            >
              Search
            </Button>
            <Button leftSection={<IconRefresh size={16} />} variant="default" onClick={reset}>
              Reset
            </Button>
          </Group>
        </Group>
      </Card>

      {isMobile && (
        <Group gap="xs" justify="flex-end">
          <Text size="xs" c="dimmed">
            Sort
          </Text>
          <Select
            size="xs"
            data={[
              { value: 'timestamp', label: 'Date & Time' },
              { value: 'employeeName', label: 'Employee' },
              { value: 'status', label: 'Status' },
            ]}
            value={sort}
            onChange={(v) => v && toggleSort(v as AttendanceSortField)}
            allowDeselect={false}
            w={150}
            aria-label="Sort by"
          />
          <ActionIcon
            variant="light"
            color="teal"
            onClick={() => toggleSort(sort)}
            aria-label="Toggle sort direction"
          >
            {dir === 'asc' ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>
      )}

      <Card withBorder radius="md" padding={0}>
        {loading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : records.length === 0 ? (
          <Center h={160}>
            <Text c="dimmed">No attendance records found.</Text>
          </Center>
        ) : isMobile ? (
          <Stack gap={0}>
            {records.map((r, i) => (
              <Box
                key={r.id}
                p="sm"
                style={{
                  borderTop: i ? '1px solid var(--mantine-color-default-border)' : undefined,
                }}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                    <Avatar radius="xl" size={34} color="teal">
                      {r.employeeName.charAt(0)}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {r.employeeName}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {r.employeeEmail}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDateTime(r.timestamp)}
                      </Text>
                    </div>
                  </Group>
                  <Badge color={r.status === 'IN' ? 'green' : 'blue'} variant="light">
                    {r.status === 'IN' ? 'Check In' : 'Check Out'}
                  </Badge>
                </Group>
              </Box>
            ))}
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={640}>
            <Table striped highlightOnHover verticalSpacing={6} horizontalSpacing="sm" fz="sm">
              <Table.Thead>
                <Table.Tr>
                  {sortableTh('employeeName', 'Employee')}
                  {sortableTh('status', 'Status')}
                  {sortableTh('timestamp', 'Date & Time')}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {records.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar radius="xl" size={26} color="teal">
                          {r.employeeName.charAt(0)}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>
                            {r.employeeName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {r.employeeEmail}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={r.status === 'IN' ? 'green' : 'blue'} variant="light">
                        {r.status === 'IN' ? 'Check In' : 'Check Out'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDateTime(r.timestamp)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" c="dimmed">
          {total} record{total === 1 ? '' : 's'}
        </Text>
        <Group gap="sm" wrap="wrap">
          <Select
            data={pageSizeSelectData}
            value={String(limit)}
            onChange={(v) => {
              const nextLimit = parseLimit(v);
              setLimit(nextLimit);
              load(1, from, to, employeeId, nextLimit);
            }}
            allowDeselect={false}
            size="sm"
            w={130}
            aria-label="Rows per page"
          />
          <Pagination
            value={page}
            onChange={(p) => load(p)}
            total={totalPages}
            size="sm"
            color="teal"
          />
        </Group>
      </Group>
    </Stack>
  );
}
