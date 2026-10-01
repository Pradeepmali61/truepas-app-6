/** @jsxImportSource react */
import { LegalView } from '@/premium/views';

/** Privacy Policy. */
export default function PrivacyPolicy() {
  return (
    <LegalView
      topTitle="Privacy"
      title="Privacy,"
      accent="plainly."
      updated="1 Oct 2026"
      intro="We collect the minimum needed to verify you, protect it like a bank, and never sell it."
      sections={[
        { h: 'What we collect', p: 'Your name, contact details, government ID data you choose to add, and an encrypted face template generated on your device.' },
        { h: 'How we use it', p: 'Only to verify your identity when you ask us to — for example at a hotel, gate or venue — and to keep your account secure.' },
        { h: 'Who sees it', p: 'Partner venues receive a yes/no match and the booking details you approve. Nobody else. We never sell or rent personal data.' },
        { h: 'Your rights', p: 'Under the DPDP Act 2023 you can access, correct, download or erase your data at any time from Settings → Your data.' },
      ]}
    />
  );
}
