"use client";

import { useState } from "react";
import { useRouter } from "@/client/providers/router-provider";
import { useForm } from "react-hook-form";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  TextInput,
  Select,
  Switch,
  Alert,
  Grid,
  Stack,
} from "@mantine/core";
import { IconArrowLeft, IconAlertCircle } from "@tabler/icons-react";
import { useUsersConvex, CreateUserData } from "@/client/hooks/useUsersConvex";
import { useAuth } from "@/client/hooks/useAuth";

interface FormData extends CreateUserData {
  // No additional fields needed
}

export default function CreateUserPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { createUser } = useUsersConvex();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      active: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newUser = await createUser(data);

      // Navigate to the new user's detail page
      router.push(`/admin/users/${newUser.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/users");
  };

  return (
    <Container size="md" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} mb="xs">
            Create User
          </Title>
          <Text c="dimmed">Add a new user to the system</Text>
        </div>

        <Button
          variant="light"
          leftSection={<IconArrowLeft size="1rem" />}
          onClick={handleCancel}
        >
          Back to Users
        </Button>
      </Group>

      {/* Form */}
      <Card withBorder>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="lg">
            {/* Personal Information */}
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="First Name"
                  placeholder="Enter first name"
                  withAsterisk
                  error={errors.firstName?.message}
                  {...register("firstName", {
                    required: "First name is required",
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters",
                    },
                  })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Last Name"
                  placeholder="Enter last name"
                  withAsterisk
                  error={errors.lastName?.message}
                  {...register("lastName", {
                    required: "Last name is required",
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters",
                    },
                  })}
                />
              </Grid.Col>
            </Grid>

            {/* Email */}
            <TextInput
              label="Email Address"
              placeholder="Enter email address"
              type="email"
              withAsterisk
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Please enter a valid email address",
                },
              })}
            />

            {/* Active Status */}
            <Switch
              label="Active user (can log in)"
              description="User will be able to log in when active"
              defaultChecked={true}
              {...register("active")}
              onChange={(event) =>
                setValue("active", event.currentTarget.checked)
              }
            />

            {/* Submit Error */}
            {submitError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {submitError}
              </Alert>
            )}

            {/* Actions */}
            <Group justify="flex-end" pt="md">
              <Button
                variant="light"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Create User
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}
