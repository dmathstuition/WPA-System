export async function fetchArray(url: string): Promise<any[]> {
  try {
    const r = await fetch(url)
    if (!r.ok) return []
    const res = await r.json()
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.data)) return res.data
    return []
  } catch { return [] }
}

export async function fetchOne(url: string): Promise<any | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const res = await r.json()
    if (res?.error) return null
    if (res?.data && typeof res.data === 'object') return res.data
    return res
  } catch { return null }
}

export async function postJSON(url: string, body: any, method = 'POST') {
  try {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    return { ok: r.ok, data }
  } catch (e: any) {
    return { ok: false, data: { error: e.message } }
  }
}
