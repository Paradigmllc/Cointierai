'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Partner {
  id: string;
  name: string;
  default_payout_usd: number | null;
}

interface AffiliateLinkFormProps {
  partners: Partner[];
  initial?: {
    id?: string;
    code?: string;
    partner_id?: string;
    target_url?: string;
    campaign?: string;
    display_name?: string;
    description?: string;
    expected_payout_usd?: number;
    is_active?: boolean;
  };
}

export function AffiliateLinkForm({ partners, initial }: AffiliateLinkFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    partner_id: initial?.partner_id ?? partners[0]?.id ?? '',
    target_url: initial?.target_url ?? '',
    campaign: initial?.campaign ?? '',
    display_name: initial?.display_name ?? '',
    description: initial?.description ?? '',
    expected_payout_usd: initial?.expected_payout_usd ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliate-links${initial?.id ? `/${initial.id}` : ''}`, {
        method: initial?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      toast.success('Saved');
      router.push('/admin/affiliate-links');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border/60 bg-card/30 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Short code (URL: /go/[code])" required>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            placeholder="bingx-main"
            required
            minLength={2}
          />
        </Field>
        <Field label="Partner" required>
          <select
            value={form.partner_id}
            onChange={(e) => {
              const p = partners.find((p) => p.id === e.target.value);
              setForm({
                ...form,
                partner_id: e.target.value,
                expected_payout_usd: form.expected_payout_usd || p?.default_payout_usd || 0,
              });
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Target URL (実際のリダイレクト先)" required>
        <Input
          type="url"
          value={form.target_url}
          onChange={(e) => setForm({ ...form, target_url: e.target.value })}
          placeholder="https://bingx.com/invite/ABCDEF"
          required
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          click_id は自動で URL クエリに追加されます (パートナー別 subID パラメータ).
        </p>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Campaign (任意)">
          <Input
            value={form.campaign}
            onChange={(e) => setForm({ ...form, campaign: e.target.value })}
            placeholder="coin-detail-cta"
          />
        </Field>
        <Field label="Expected payout (USD)">
          <Input
            type="number"
            step="0.01"
            value={form.expected_payout_usd}
            onChange={(e) => setForm({ ...form, expected_payout_usd: parseFloat(e.target.value) || 0 })}
          />
        </Field>
      </div>

      <Field label="Display name (管理画面用)">
        <Input
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder="BingX メイン CTA"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
        Active
      </label>

      <div className="flex items-center gap-3 pt-3 border-t border-border/40">
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : initial?.id ? 'Update' : 'Create'}</Button>
        <Badge variant="secondary" className="text-[10px]">
          Preview: /go/{form.code || '...'}
        </Badge>
      </div>
    </form>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">
        {label} {required && <span className="text-loss">*</span>}
      </label>
      {children}
    </div>
  );
}
