/**
 * @file App.tsx
 * @description Application root component configuring a hash-based router and theme provider.
 */

import React from 'react'
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

/**
 * @description Root application component wiring React Router and theme context to the React tree.
 */
export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
