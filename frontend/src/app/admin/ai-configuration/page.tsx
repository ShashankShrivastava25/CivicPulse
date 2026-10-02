'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Save, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { adminService } from '@/services/adminService';
import type { AiConfig } from '@/types';

export default function AiConfigurationPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'ai-configuration'], queryFn: adminService.getAiConfiguration });
  const [form, setForm] = useState<AiConfig | null>(null);

  useEffect(() => { if (data) setForm(data.ai); }, [data]);

  const save = useMutation({
    mutationFn: () => adminService.updateAiConfiguration(form!),
    onSuccess: () => { toast.push('AI configuration saved.'); qc.invalidateQueries({ queryKey: ['admin', 'ai-configuration'] }); },
    onError: (e: Error) => toast.push(e.message, 'error'),
  });

  if (isLoading || !form) return <DashboardLayout roles={['ADMIN']} title="AI configuration">{() => <LoadingState />}</DashboardLayout>;
  if (isError) return <DashboardLayout roles={['ADMIN']} title="AI configuration">{() => <ErrorState message="We could not load the configuration." onRetry={() => refetch()} />}</DashboardLayout>;

  const num = (k: keyof AiConfig) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: Number(e.target.value) });
  const str = (k: keyof AiConfig) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <DashboardLayout roles={['ADMIN']} title="AI configuration">
      {() => (
        <div className="space-y-6">
          <Card className="flex items-center justify-between p-4">
            <p className="flex items-center gap-2 text-sm"><KeyRound className="h-4 w-4 text-muted" aria-hidden />Hugging Face API key</p>
            <Badge tone={data!.apiKeyConfigured ? 'success' : 'warning'}>{data!.apiKeyConfigured ? 'Configured on the server' : 'Not configured'}</Badge>
          </Card>
          <p className="-mt-3 text-xs text-muted">The API key is only ever set as a server environment variable. It is never shown or editable here.</p>

          <Card className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" aria-hidden />Hugging Face models</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Image classification model" value={form.imageModel} onChange={str('imageModel')} placeholder="e.g. microsoft/resnet-50" />
              <Field label="Image embedding model" value={form.imageEmbeddingModel} onChange={str('imageEmbeddingModel')} />
              <Field label="Text embedding model" value={form.textEmbeddingModel} onChange={str('textEmbeddingModel')} />
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Duplicate detection weights</h2>
            <p className="text-xs text-muted">Weights should roughly sum to 1. They combine into a single confidence score compared against the threshold below.</p>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Image similarity" type="number" step="0.05" min={0} max={1} value={form.imageSimilarityWeight} onChange={num('imageSimilarityWeight')} />
              <Field label="Text similarity" type="number" step="0.05" min={0} max={1} value={form.textSimilarityWeight} onChange={num('textSimilarityWeight')} />
              <Field label="Location" type="number" step="0.05" min={0} max={1} value={form.locationWeight} onChange={num('locationWeight')} />
              <Field label="Category" type="number" step="0.05" min={0} max={1} value={form.categoryWeight} onChange={num('categoryWeight')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Duplicate threshold (0–1)" type="number" step="0.05" min={0} max={1} value={form.duplicateThreshold} onChange={num('duplicateThreshold')} />
              <Field label="Search radius (meters)" type="number" step="50" min={50} max={5000} value={form.duplicateSearchRadius} onChange={num('duplicateSearchRadius')} />
            </div>
          </Card>

          <Button loading={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" />Save changes</Button>
        </div>
      )}
    </DashboardLayout>
  );
}
