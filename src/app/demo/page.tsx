import { DemoPlayer } from './DemoPlayer'

export const metadata = {
  title: 'Aspis Demo — CyberShield Technologies',
  description: 'See Aspis scan M365, Azure, and Salesforce for security misconfigurations. 4-minute guided demo.',
}

// Public — no auth required
export default function DemoPage() {
  return <DemoPlayer />
}
