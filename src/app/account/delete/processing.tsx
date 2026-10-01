/** @jsxImportSource react */
import { Trash2 } from 'lucide-react-native';

import { Medallion } from '@/premium/blocks';
import { ProcessingView } from '@/premium/views';

/** Account deletion in progress. */
export default function DeleteProcessing() {
  return (
    <ProcessingView
      title="Deleting your"
      accent="data."
      sub="Please keep the app open. This takes a few seconds."
      hero={<Medallion icon={Trash2} tone="red" size={80} />}
      steps={[
        { label: 'Signed out of all devices', state: 'done' },
        { label: 'Face template erased', detail: 'Permanently removed from the vault', state: 'done' },
        { label: 'Removing documents', detail: '2 of 3', state: 'active' },
        { label: 'Closing account', state: 'todo' },
      ]}
    />
  );
}
