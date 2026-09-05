import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Table,
  Avatar,
  Text,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  PasswordInput,
  Select,
  Center,
  Loader,
  Tooltip,
  Pagination,
  Box,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
} from '@tabler/icons-react';
import type { EmployeeProfile, EmployeeSortField, SortDir } from '@dexago/shared';
import { ApiError, type UpsertEmployeeInput } from '@dexago/api-client';
import { api } from '../api';
import {
  pageSizeSelectData,
  parseLimit,
  parsePage,
  DEFAULT_LIMIT,
} from '../lib/pagination';
import { makeSortParser, parseDir, DEFAULT_DIR } from '../lib/sort';
import { PageMeta } from '../components/PageMeta';

const SORT_FIELDS: EmployeeSortField[] = ['name', 'email', 'position', 'role', 'createdAt'];
const DEFAULT_SORT: EmployeeSortField = 'createdAt';

const parseSort = makeSortParser(SORT_FIELDS, DEFAULT_SORT);

interface FormState {
  name: string;
  email: string;
  position: string;
  phone: string;
  password: string;
  role: 'EMPLOYEE' | 'ADMIN';
}

const emptyForm: FormState = {
  name: '',
  email: '',
  position: '',
  phone: '',
  password: '',
  role: 'EMPLOYEE',
};

export function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 48em)');

  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(() => parsePage(searchParams.get('page')));
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(() => parseLimit(searchParams.get('limit')));
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<EmployeeSortField>(() => parseSort(searchParams.get('sort')));
  const [dir, setDir] = useState<SortDir>(() => parseDir(searchParams.get('dir')));

  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listEmployees({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort,
        dir,
      });
      setEmployees(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (res.page > res.totalPages) setPage(res.totalPages);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load employees',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, sort, dir]);

  useEffect(() => {
    const next: Record<string, string> = {};
    if (page > 1) next.page = String(page);
    if (limit !== DEFAULT_LIMIT) next.limit = String(limit);
    if (debouncedSearch) next.q = debouncedSearch;
    if (sort !== DEFAULT_SORT) next.sort = sort;
    if (dir !== DEFAULT_DIR) next.dir = dir;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, sort, dir]);

  const toggleSort = (field: EmployeeSortField) => {
    if (sort === field) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setDir('asc');
    }
    setPage(1);
  };

  const sortableTh = (field: EmployeeSortField, label: string) => (
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    open();
  };

  const openEdit = (e: EmployeeProfile) => {
    setEditingId(e.id);
    setForm({
      name: e.name,
      email: e.email,
      position: e.position,
      phone: e.phone ?? '',
      password: '',
      role: e.role,
    });
    open();
  };

  const save = async () => {
    setSaving(true);
    const isCreate = !editingId;
    try {
      if (editingId) {
        const payload: Partial<UpsertEmployeeInput> = {
          name: form.name,
          email: form.email,
          position: form.position,
          phone: form.phone || undefined,
          role: form.role,
        };
        if (form.password) payload.password = form.password;
        await api.updateEmployee(editingId, payload);
        notifications.show({ color: 'green', title: 'Saved', message: 'Employee updated' });
      } else {
        const payload: UpsertEmployeeInput = {
          name: form.name,
          email: form.email,
          position: form.position,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
        };
        await api.createEmployee(payload);
        notifications.show({ color: 'green', title: 'Created', message: 'Employee added' });
      }
      close();
      if (isCreate && page !== 1) setPage(1);
      else await load();
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Save failed';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: EmployeeProfile) => {
    if (!confirm(`Delete employee "${e.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteEmployee(e.id);
      notifications.show({ color: 'green', title: 'Deleted', message: `${e.name} removed` });
      await load();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Delete failed',
      });
    }
  };

  const canSave =
    form.name && form.email && form.position && (editingId || form.password.length >= 6);

  return (
    <Stack>
      <PageMeta title="Employees" description="Manage employee records, roles, and access in DexaGo HRD Admin." />
      <Group justify="space-between">
        <Title order={3}>Employees</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate} color="teal">
          Add Employee
        </Button>
      </Group>

      <TextInput
        placeholder="Search name, email, or position..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => {
          setSearch(e.currentTarget.value);
          setPage(1);
        }}
        maw={360}
      />

      <Card withBorder radius="md" padding={0}>
        {loading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : employees.length === 0 ? (
          <Center h={160}>
            <Text c="dimmed">No employees found.</Text>
          </Center>
        ) : isMobile ? (
          <Stack gap={0}>
            {employees.map((e, i) => (
              <Box
                key={e.id}
                p="sm"
                style={{
                  borderTop: i ? '1px solid var(--mantine-color-default-border)' : undefined,
                }}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                    <Avatar src={e.photoUrl ?? undefined} radius="xl" size={38} color="teal">
                      {e.name.charAt(0)}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <Text fw={600} size="sm" truncate>
                        {e.name}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {e.email}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {e.position}
                        {e.phone ? ` • ${e.phone}` : ''}
                      </Text>
                    </div>
                  </Group>
                  <Stack gap={8} align="flex-end">
                    <Badge color={e.role === 'ADMIN' ? 'grape' : 'teal'} variant="light">
                      {e.role}
                    </Badge>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon variant="light" onClick={() => openEdit(e)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => remove(e)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Group>
              </Box>
            ))}
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={720}>
            <Table striped highlightOnHover verticalSpacing={6} horizontalSpacing="sm" fz="sm">
              <Table.Thead>
                <Table.Tr>
                  {sortableTh('name', 'Employee')}
                  {sortableTh('email', 'Email')}
                  {sortableTh('position', 'Position')}
                  <Table.Th>Phone</Table.Th>
                  {sortableTh('role', 'Role')}
                  <Table.Th ta="right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {employees.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar src={e.photoUrl ?? undefined} radius="xl" size={28} color="teal">
                          {e.name.charAt(0)}
                        </Avatar>
                        <Text fw={500}>{e.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{e.email}</Table.Td>
                    <Table.Td>{e.position}</Table.Td>
                    <Table.Td>{e.phone ?? '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={e.role === 'ADMIN' ? 'grape' : 'teal'} variant="light">
                        {e.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        <Tooltip label="Edit">
                          <ActionIcon variant="light" onClick={() => openEdit(e)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon variant="light" color="red" onClick={() => remove(e)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" c="dimmed">
          {total} employee{total === 1 ? '' : 's'}
        </Text>
        <Group gap="sm" wrap="wrap">
          <Select
            data={pageSizeSelectData}
            value={String(limit)}
            onChange={(v) => {
              setLimit(parseLimit(v));
              setPage(1);
            }}
            allowDeselect={false}
            size="sm"
            w={130}
            aria-label="Rows per page"
          />
          <Pagination value={page} onChange={setPage} total={totalPages} size="sm" color="teal" />
        </Group>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <IconUserPlus size={18} />
            <Text fw={600}>{editingId ? 'Edit Employee' : 'Add Employee'}</Text>
          </Group>
        }
        centered
      >
        <Stack>
          <TextInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextInput
            label="Company Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
          />
          <TextInput
            label="Position"
            required
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.currentTarget.value })}
          />
          <TextInput
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })}
          />
          <Select
            label="Role"
            data={[
              { value: 'EMPLOYEE', label: 'Employee' },
              { value: 'ADMIN', label: 'Admin (HRD)' },
            ]}
            value={form.role}
            onChange={(v) => setForm({ ...form, role: (v as FormState['role']) ?? 'EMPLOYEE' })}
            allowDeselect={false}
          />
          <PasswordInput
            label={editingId ? 'New Password (optional)' : 'Password'}
            required={!editingId}
            placeholder={editingId ? 'Leave blank to keep current' : 'At least 6 characters'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.currentTarget.value })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} disabled={!canSave} color="teal">
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
