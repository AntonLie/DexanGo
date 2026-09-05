import { ReactNode, Suspense } from 'react';
import {
  AppShell,
  Group,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  NavLink,
  Box,
  Center,
  Loader,
  rem,
} from '@mantine/core';
import {
  IconUserCircle,
  IconClockCheck,
  IconCalendarStats,
  IconLogout,
  IconChevronDown,
} from '@tabler/icons-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { label: 'Profile', to: '/profile', icon: IconUserCircle },
  { label: 'Attendance', to: '/attendance', icon: IconClockCheck },
  { label: 'Summary', to: '/summary', icon: IconCalendarStats },
];

const CONTENT_WIDTH = 640;
const DESKTOP_WIDTH = 960;

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: true, desktop: false } }}
      footer={{ height: { base: 64, sm: 0 } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Text fw={700} size="lg" c="indigo">
            DexaGo
          </Text>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton aria-label="Account menu">
                <Group gap={6} wrap="nowrap">
                  <Avatar src={user?.photoUrl ?? undefined} radius="xl" size={32} color="indigo">
                    {user?.name?.charAt(0)}
                  </Avatar>
                  <IconChevronDown style={{ width: rem(16), height: rem(16) }} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user?.email}</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} />}
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb="xs">
          Menu
        </Text>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={20} stroke={1.5} />}
            active={location.pathname === item.to}
            variant="light"
            mb={4}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={{ base: CONTENT_WIDTH, sm: DESKTOP_WIDTH }} mx="auto" w="100%">
          <Suspense
            fallback={
              <Center h={320}>
                <Loader />
              </Center>
            }
          >
            {children}
          </Suspense>
        </Box>
      </AppShell.Main>

      <AppShell.Footer hiddenFrom="sm">
        <Group h="100%" gap={0} maw={CONTENT_WIDTH} mx="auto" wrap="nowrap">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <UnstyledButton
                key={item.to}
                component={Link}
                to={item.to}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: rem(2),
                  paddingBlock: rem(6),
                  color: active
                    ? 'var(--mantine-color-indigo-6)'
                    : 'var(--mantine-color-gray-6)',
                }}
              >
                <item.icon size={22} stroke={active ? 2 : 1.6} />
                <Text size="0.7rem" fw={active ? 600 : 400}>
                  {item.label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
