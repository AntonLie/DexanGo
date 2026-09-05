import { useState, FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Center,
  Box,
  Alert,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthContext";
import { PageMeta } from "../components/PageMeta";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/profile" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" p="md" bg="var(--mantine-color-gray-0)">
      <PageMeta
        title="Sign in"
        description="Sign in to the DexaGo employee portal."
      />
      <Box w="100%" maw={420}>
        <Stack gap="xs" mb="lg" align="center">
          <Title order={2} c="indigo">
            DexaGo
          </Title>
          <Text c="dimmed" size="sm">
            Employee WFH Attendance Portal
          </Text>
        </Stack>

        <Paper withBorder shadow="md" p="xl" radius="md">
          <form onSubmit={handleSubmit}>
            <Stack>
              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  variant="light">
                  {error}
                </Alert>
              )}
              <TextInput
                label="Company Email"
                placeholder="you@dexa.com"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <Button type="submit" fullWidth loading={loading} mt="sm">
                Sign in
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Center>
  );
}
