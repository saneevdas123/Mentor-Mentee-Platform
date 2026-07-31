'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Card, Modal, Field, useToast, PageHeader, EmptyState, SkeletonRows, Btn } from '@/components/ui';

const NAV = [
  { href: '/hod', label: 'Overview' },
  { href: '/hod/baskets', label: 'Credit Baskets' },
  { href: '/reports/naac', label: 'NAAC Report' },
  { href: '/reports/nirf', label: 'NIRF Report' },
  { href: '/reports/nba', label: 'NBA Report' },
];

const BLANK = { name: '', code: '', aliases: '', defaultCredits: 0, order: 0, description: '' };

export default function BasketsClient({ me }) {
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const { show: toast, node } = useToast();

  async function load() {
    try {
      const d = await fetch('/api/baskets').then((r) => r.json());
      setBaskets(d.baskets || []);
    } catch {
      toast('Failed to load baskets', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm(BLANK); setEditId(null); setShow(true); }
  function openEdit(b) {
    setForm({ name: b.name, code: b.code || '', aliases: (b.aliases || []).join(', '), defaultCredits: b.defaultCredits || 0, order: b.order || 0, description: b.description || '' });
    setEditId(b._id); setShow(true);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editId ? `/api/baskets/${editId}` : '/api/baskets';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) return toast(d.error || 'Failed', { tone: 'error' });
      setShow(false); toast(editId ? 'Basket updated' : 'Basket added', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Remove this basket? Existing plans keep their labels.')) return;
    await fetch(`/api/baskets/${id}`, { method: 'DELETE' });
    toast('Basket removed', { tone: 'success' }); load();
  }

  return (
    <Shell role="HOD" name={me.name} nav={NAV}>
      <PageHeader
        title="Credit Baskets"
        subtitle="Define CBCS baskets for your department. The gradesheet parser uses these names and aliases to classify courses."
      />

      <Card title={`Baskets (${baskets.length})`} actions={<Btn onClick={openNew}>+ Add Basket</Btn>}>
        {loading ? <SkeletonRows rows={4} cols={5} /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="th">Order</th><th className="th">Name</th><th className="th">Code</th><th className="th">Aliases (for parsing)</th><th className="th">Default credits</th><th className="th"></th></tr></thead>
              <tbody>
                {baskets.map((b) => (
                  <tr key={b._id}>
                    <td className="td">{b.order}</td>
                    <td className="td font-medium">{b.name}</td>
                    <td className="td">{b.code || '—'}</td>
                    <td className="td text-sm text-gray-500">{(b.aliases || []).join(', ') || '—'}</td>
                    <td className="td">{b.defaultCredits || 0}</td>
                    <td className="td whitespace-nowrap">
                      <Btn variant="ghost" className="py-1" onClick={() => openEdit(b)}>Edit</Btn>
                      <Btn variant="ghost" className="py-1 text-red-600" onClick={() => remove(b._id)}>Remove</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!baskets.length && (
              <EmptyState
                title="No baskets yet"
                description="Add your first basket (e.g. Program Core) to begin credit tracking."
                action={<Btn onClick={openNew}>+ Add Basket</Btn>}
              />
            )}
          </div>
        )}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title={editId ? 'Edit Basket' : 'Add Basket'}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Program Core" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code (optional)"><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PC" /></Field>
            <Field label="Default credits"><input className="input" type="number" value={form.defaultCredits} onChange={(e) => setForm({ ...form, defaultCredits: e.target.value })} placeholder="0" /></Field>
          </div>
          <Field label="Aliases (comma-separated, help the parser match variants)">
            <input className="input" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} placeholder="Programme Core, Core" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Display order"><input className="input" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} placeholder="0" /></Field>
          </div>
          <Field label="Description (optional)"><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" /></Field>
          <Btn type="submit" loading={busy} className="w-full">{busy ? 'Saving…' : (editId ? 'Save changes' : 'Add basket')}</Btn>
        </form>
      </Modal>
      {node}
    </Shell>
  );
}
