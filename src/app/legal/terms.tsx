/** @jsxImportSource react */
import { LegalPage, type LegalSectionText } from '@/premium/flows/account';

/** Original Terms of Service text — headings keep their order (the layout numbers them). */
const SECTIONS: LegalSectionText[] = [
  {
    h: 'Acceptance of Terms',
    p: 'By using TruePas, you agree to these Terms of Service and our Privacy Policy. TruePas is an identity verification platform that uses biometric data and government documents to verify your identity.',
  },
  {
    h: 'Mandatory Face Enrollment',
    p: 'Face enrollment is a mandatory step in the registration process. You cannot proceed to document verification or use TruePas services without completing face enrollment.',
  },
  {
    h: 'Account Responsibilities',
    p: 'You are responsible for maintaining the confidentiality of your PIN and account credentials. Face updates require PIN verification.',
  },
  {
    h: 'Family Member Onboarding',
    p: 'You may add family members under 18 as dependents. Adults 18 and older must create their own independent TruePas account. Guardianship consent is required for all minor enrollments.',
  },
  {
    h: 'Prohibited Uses',
    p: 'You may not use TruePas for fraudulent identity verification, unauthorized access, or sharing of biometric data with unauthorized parties.',
  },
];

export default function TermsScreen() {
  return (
    <LegalPage
      topTitle="Terms"
      title="Terms of"
      accent="Service."
      updated="Effective: July 2026"
      sections={SECTIONS}
    />
  );
}
