import { ReactNode } from "react";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  Box,
  Badge,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconUsers,
  IconClipboardList,
  IconLogout,
  IconChevronDown,
} from "@tabler/icons-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { NotificationListener } from "./NotificationListener";

const navItems = [
  { label: "Employees", to: "/employees", icon: IconUsers },
  { label: "Attendance", to: "/attendance", icon: IconClipboardList },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md">
      <NotificationListener />

      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text fw={700} size="lg" c="teal">
              DexaGo
            </Text>
            <Badge color="teal" variant="light" visibleFrom="sm">
              HRD Admin
            </Badge>
          </Group>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar
                    src={user?.photoUrl ?? undefined}
                    radius="xl"
                    size={32}
                    color="teal">
                    {user?.name?.charAt(0)}
                  </Avatar>
                  <Box visibleFrom="xs">
                    <Text size="sm" fw={500}>
                      {user?.name}
                    </Text>
                  </Box>
                  <IconChevronDown
                    style={{ width: rem(16), height: rem(16) }}
                  />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user?.email}</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={
                  <IconLogout style={{ width: rem(16), height: rem(16) }} />
                }
                onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={20} stroke={1.5} />}
            active={location.pathname === item.to}
            onClick={close}
            mb={4}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
