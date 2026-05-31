import { Module } from '@/types'

export const MODULES: Module[] = [
  {
    slug: 'posture',
    name: 'Security Posture',
    description: 'Continuous M365, Azure, and SaaS misconfiguration scanning via Prowler and Maester.',
    icon: 'shield',
    available: true,
  },
  {
    slug: 'ttx',
    name: 'Tabletop Exercises',
    description: 'Scenario-based incident response exercises tailored to your industry and threat profile.',
    icon: 'swords',
    available: true,
  },
  {
    slug: 'awareness',
    name: 'Security Awareness',
    description: 'Phishing simulations and training campaigns integrated with your M365 tenant.',
    icon: 'graduation-cap',
    available: false,
    comingSoon: true,
  },
  {
    slug: 'threat-hunting',
    name: 'Threat Hunting',
    description: 'Proactive threat hunting via Axiom integration against your M365 and endpoint logs.',
    icon: 'search',
    available: false,
    comingSoon: true,
  },
]
