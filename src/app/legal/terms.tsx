/** @jsxImportSource react */
import { LegalView } from '@/premium/views';

/** Terms of Service. */
export default function Terms() {
  return (
    <LegalView
      topTitle="Terms"
      title="Terms of"
      accent="service."
      updated="1 Oct 2026"
      intro="These terms explain how you can use Truepas to verify your identity and check in at partner venues."
      sections={[
        { h: 'Your Truepas account', p: 'You must be 18 or older to hold an account. Members under 18 can be added to a family by a verified guardian, who remains responsible for their use.' },
        { h: 'Using face check-in', p: 'When you check in, the venue receives a confirmation that your identity matches the booking. Venues never receive your face template or document images.' },
        { h: 'Accuracy of information', p: 'The details on your Truepas must match your government documents. We may pause verification if information appears inaccurate or altered.' },
        { h: 'Ending your account', p: 'You can delete your account at any time from Settings. Biometric data is erased immediately; limited records may be retained where the law requires.' },
      ]}
    />
  );
}
