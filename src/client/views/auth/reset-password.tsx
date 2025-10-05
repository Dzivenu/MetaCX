"use client";

import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Anchor,
  Stack,
  Center,
  Alert
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "@/client/providers/router-provider";
import { IconMail, IconArrowLeft, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useAuth } from "@/client/hooks/useAuth";

interface ResetPasswordForm {
  email: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  
  const form = useForm<ResetPasswordForm>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: ResetPasswordForm) => {
    try {
      await resetPassword(values.email);
      setEmailSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      // TODO: Show error notification
    }
  };

  if (emailSent) {
    return (
      <Container size="xs" style={{ minHeight: '100vh' }}>
        <Center style={{ minHeight: '100vh' }}>
          <Paper withBorder shadow="md" p={30} radius="md" w="100%">
            <Stack gap="md" align="center">
              <Title order={2} ta="center">
                Check your email
              </Title>
              
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                We've sent a password reset link to your email address. 
                Please check your inbox and follow the instructions to reset your password.
              </Alert>

              <Text size="sm" c="dimmed" ta="center">
                Didn't receive the email? Check your spam folder or try again.
              </Text>

              <Group justify="center" mt="md">
                <Button variant="outline" onClick={() => setEmailSent(false)}>
                  Try again
                </Button>
                <Button onClick={() => router.push('/login')}>
                  Back to login
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xs" style={{ minHeight: '100vh' }}>
      <Center style={{ minHeight: '100vh' }}>
        <Paper withBorder shadow="md" p={30} radius="md" w="100%">
          <Stack gap="md">
            <Group>
              <Anchor 
                size="sm" 
                onClick={() => router.push('/login')}
                style={{ cursor: 'pointer' }}
              >
                <Group gap="xs">
                  <IconArrowLeft size={16} />
                  Back to login
                </Group>
              </Anchor>
            </Group>

            <Title order={2} ta="center">
              Reset Password
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Enter your email address and we'll send you a link to reset your password
            </Text>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  leftSection={<IconMail size={16} />}
                  {...form.getInputProps('email')}
                />

                <Button type="submit" fullWidth mt="md">
                  Send Reset Link
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Center>
    </Container>
  );
}