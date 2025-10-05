"use client";

import { useState } from 'react';
import { useOrganizations } from '@/client/hooks/useOrganizations';
import { 
  Modal, 
  TextInput, 
  Textarea, 
  Button, 
  Group, 
  Stack,
  Text 
} from '@mantine/core';

interface CreateOrganizationModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateOrganizationModal({ opened, onClose }: CreateOrganizationModalProps) {
  const { createOrganization, loading } = useOrganizations();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Organization slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await createOrganization({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Organization" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Organization Name"
            placeholder="Enter organization name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={errors.name}
            required
          />

          <TextInput
            label="Organization Slug"
            placeholder="organization-slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            error={errors.slug}
            description={`This will be used in URLs: yourapp.com/org/${formData.slug || 'slug'}`}
            required
          />

          <Textarea
            label="Description"
            placeholder="Brief description of your organization"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Organization
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}