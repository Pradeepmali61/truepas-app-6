/** @jsxImportSource react */
import { LegalPage, type LegalSectionText } from '@/premium/flows/account';

/** Original Privacy Policy text — headings keep their order (the layout numbers them). */
const SECTIONS: LegalSectionText[] = [
  {
    h: 'Information We Collect',
    p: "We collect biometric data (facial templates), government ID information (Passport, Driver's License, Identity Card), and account metadata to provide secure identity verification services.",
  },
  {
    h: 'Biometric Data Handling',
    p: 'Your facial template is encrypted and stored in a dedicated face gallery. It is never shared with third parties and is used solely for identity matching during verification.',
  },
  {
    h: 'Minor/Guardianship Consent',
    p: 'For family members under 18, a parent or legal guardian must provide explicit consent before biometric enrollment. Children aged 0-4 require a document upload and one photo — no liveness scan. Ages 5-9 require a document and liveness verification (front or back camera). Ages 10+ require a document and front-camera liveness verification.',
  },
  {
    h: 'Data Retention',
    p: 'All data — PostgreSQL records, S3 images, and face templates — is retained while your account is active and permanently deleted upon account deletion. Deletion is verified across all three systems.',
  },
  {
    h: 'Your Rights',
    p: 'You have the right to download your data, withdraw biometric consent, and delete your account at any time. Account deletion removes all data across PostgreSQL, S3, and the face gallery.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalPage
      topTitle="Privacy"
      title="Privacy"
      accent="Policy."
      updated="Last updated: July 2026"
      sections={SECTIONS}
    />
  );
}
