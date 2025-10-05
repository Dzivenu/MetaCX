"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Container,
  Stack,
  Title,
  Text,
  TextInput,
  Textarea,
  Group,
  Button,
  Alert,
} from "@mantine/core";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const createOrganizationAction = useAction(
    api.actions.organizations.createOrganization
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatedSlug = useMemo(() => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }, [name]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const effectiveSlug = slug || generatedSlug;
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }
    if (!effectiveSlug || !/^[a-z0-9-]+$/.test(effectiveSlug)) {
      setError("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    setSubmitting(true);
    try {
      await createOrganizationAction({
        name: name.trim(),
        slug: effectiveSlug,
        public_metadata: description ? { description } : undefined,
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Stack gap="sm" align="center">
          <Title order={1} ta="center">
            Create Organization
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            Organizations help you collaborate with team members and manage
            projects together.
          </Text>
        </Stack>

        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        <form onSubmit={onSubmit}>
          <Stack gap="md">
            <TextInput
              label="Organization Name"
              placeholder="Enter organization name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
            />

            <TextInput
              label="Organization Slug"
              placeholder="organization-slug"
              value={slug}
              onChange={(e) => setSlug(e.currentTarget.value)}
              description={`This will be used in URLs: yourapp.com/org/${slug || generatedSlug || "slug"}`}
              required
            />

            <Textarea
              label="Description"
              placeholder="Brief description of your organization"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              rows={3}
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit" loading={submitting}>
                Create Organization
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
