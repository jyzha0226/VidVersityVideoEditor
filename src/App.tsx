/**
 * @file App.tsx
 * @description Application root component configuring a hash-based router and theme provider.
 */

import React, { useMemo, useState } from 'react'
import { RouterProvider, createHashRouter } from 'react-router'
import ArchivePage from './pages/Archive'
import DraftsPage from './pages/Drafts'
import HomePage from './pages/Home'
import { ThemeProvider } from './theme/ThemeProvider'

/**
 * @description Hash router configuration for the single-page application.
 */
const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/drafts',
    element: <DraftsPage />,
  },
  {
    path: '/archive',
    element: <ArchivePage />,
  },
])

const DEMO_ACCESS_SESSION_KEY = 'vidversity-demo-access'
const DEFAULT_DEMO_PASSWORD_HASH =
  'a7471bc87449dd35810dad4d1e924172f5e9a79826f81e4b66575d94940107f1'

function resolveDemoPasswordHash(): string {
  const configured = (globalThis as typeof globalThis & {
    __VIDVERSITY_DEMO_ACCESS__?: {
      passwordHash?: string
    }
  }).__VIDVERSITY_DEMO_ACCESS__?.passwordHash

  return configured?.trim() || DEFAULT_DEMO_PASSWORD_HASH
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function DemoAccessGate({ children }: { children: React.ReactNode }): JSX.Element {
  const expectedPasswordHash = useMemo(resolveDemoPasswordHash, [])
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [hasAccess, setHasAccess] = useState(
    () => sessionStorage.getItem(DEMO_ACCESS_SESSION_KEY) === expectedPasswordHash,
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsChecking(true)

    try {
      const nextHash = await sha256Hex(password)
      if (nextHash === expectedPasswordHash) {
        sessionStorage.setItem(DEMO_ACCESS_SESSION_KEY, expectedPasswordHash)
        setHasAccess(true)
        return
      }

      setError('Password not recognised.')
      setPassword('')
    } catch {
      setError('Could not verify access in this browser.')
    } finally {
      setIsChecking(false)
    }
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <section className="w-full max-w-sm rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#0b63f6] text-lg font-black text-white">
              V
            </div>
            <h1 className="text-xl font-semibold tracking-normal">VidVersity Demo</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the demo password to continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="demo-password">
                Password
              </label>
              <input
                id="demo-password"
                autoComplete="current-password"
                autoFocus
                className="h-11 w-full rounded-[8px] border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#0b63f6] focus:ring-2 focus:ring-[#0b63f6]/20"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? (
              <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="h-11 w-full rounded-[8px] bg-[#0b63f6] px-4 text-sm font-semibold text-white transition hover:bg-[#084fc6] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChecking || password.trim().length === 0}
              type="submit"
            >
              {isChecking ? 'Checking...' : 'Continue'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

/**
 * @description Root application component wiring React Router and theme context to the React tree.
 */
export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <DemoAccessGate>
        <RouterProvider router={router} />
      </DemoAccessGate>
    </ThemeProvider>
  )
}
