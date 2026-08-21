import ProgressOverlay from './progress-overlay'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>
    {children}
    <ProgressOverlay />
  </>
}
