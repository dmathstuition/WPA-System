'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, Lock, Eye, EyeOff } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({ academy_name: '', academy_tagline: '', contact_email: '', timezone: 'Africa/Lagos' })
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok'|'err'>('ok')
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  function showMsg(m: string, t: 'ok'|'err') { setMsg(m); setMsgType(t); setTimeout(() => setMsg(''), 4000) }

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      if (data && !data.error) setSettings(s => ({ ...s, ...data }))
    }).catch(() => {})
  }, [])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) })
    const data = await res.json()
    if (res.ok) showMsg('Settings saved successfully', 'ok')
    else showMsg(data.error ?? 'Failed to save', 'err')
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.next !== password.confirm) { showMsg('Passwords do not match', 'err'); return }
    if (password.next.length < 8) { showMsg('Password must be at least 8 characters', 'err'); return }
    setChangingPwd(true)
    const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change_password', current: password.current, next: password.next }) })
    const data = await res.json()
    if (res.ok) { showMsg('Password changed successfully', 'ok'); setPassword({ current: '', next: '', confirm: '' }) }
    else showMsg(data.error ?? 'Failed to change password', 'err')
    setChangingPwd(false)
  }

  return (
    <>
      <Topbar user={{ id:'', name:'Admin', email:'', role:'admin' }} title="Settings" subtitle="Academy configuration and account" />
      <div className="p-5 max-w-3xl">
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-[12.5px] font-medium animate-fade-in ${msgType === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{msg}</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Academy settings */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <p className="text-[13px] font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={15} className="text-amber-500" /> Academy Settings</p>
            <form onSubmit={saveSettings} className="space-y-3">
              <div><Label>Academy Name</Label><Input className="mt-1" value={settings.academy_name} onChange={e => setSettings(s => ({ ...s, academy_name: e.target.value }))} /></div>
              <div><Label>Tagline</Label><Input className="mt-1" value={settings.academy_tagline} onChange={e => setSettings(s => ({ ...s, academy_tagline: e.target.value }))} /></div>
              <div><Label>Contact Email</Label><Input className="mt-1" type="email" value={settings.contact_email} onChange={e => setSettings(s => ({ ...s, contact_email: e.target.value }))} /></div>
              <div>
                <Label>Timezone</Label>
                <select value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {['Africa/Lagos','Africa/Accra','Africa/Nairobi','Africa/Johannesburg','Europe/London','America/New_York','Asia/Dubai'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <Button type="submit" size="sm" disabled={saving}><Save size={13} /> {saving ? 'Saving…' : 'Save Settings'}</Button>
            </form>
          </div>
          {/* Change password */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <p className="text-[13px] font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock size={15} className="text-red-500" /> Change Password</p>
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <Label>Current Password</Label>
                <div className="relative mt-1">
                  <Input type={showCurrent ? 'text' : 'password'} value={password.current} onChange={e => setPassword(p => ({ ...p, current: e.target.value }))} />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <Label>New Password <span className="text-slate-400 font-normal">(min 8 chars)</span></Label>
                <div className="relative mt-1">
                  <Input type={showNew ? 'text' : 'password'} minLength={8} value={password.next} onChange={e => setPassword(p => ({ ...p, next: e.target.value }))} />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div><Label>Confirm New Password</Label><Input className="mt-1" type="password" value={password.confirm} onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))} /></div>
              <Button type="submit" size="sm" disabled={changingPwd} variant="destructive">{changingPwd ? 'Changing…' : 'Change Password'}</Button>
            </form>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mt-5">
          <p className="text-[12.5px] font-semibold text-slate-800 mb-3">System Info</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['Stack','Next.js + Supabase'],['Database','PostgreSQL'],['Auth','JWT (8h)'],['Deploy','Vercel-ready']].map(([k,v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3"><p className="text-[9.5px] font-bold uppercase tracking-wide text-slate-400">{k}</p><p className="text-[12px] font-semibold text-slate-700 mt-0.5">{v}</p></div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
