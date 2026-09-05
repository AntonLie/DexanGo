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
  Badge,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthContext";
import { PageMeta } from "../components/PageMeta";

export function LoginPage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user && user.role === "ADMIN")
    return <Navigate to="/employees" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      if (loggedIn.role !== "ADMIN") {
        logout();
        setError("This portal is for HRD administrators only.");
        return;
      }
      navigate("/employees");
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
        description="Sign in to the DexaGo HRD Admin portal."
      />
      <Box w="100%" maw={420}>
        <Stack gap="xs" mb="lg" align="center">
          <Title order={2} c="teal">
            DexaGo
          </Title>
          <Badge color="teal" variant="light" size="lg">
            HRD Admin Portal
          </Badge>
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
                label="Admin Email"
                placeholder="hrd@dexa.com"
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
              <Button
                type="submit"
                fullWidth
                loading={loading}
                mt="sm"
                color="teal">
                Sign in
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Center>
  );
}
