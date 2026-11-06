import React, { useState } from 'react';
import { Button } from '@/components/ui/Rocket';
import ConstantModal from './components/ConstantModal';
import DeleteConstantsDialog from './components/DeleteConstantsDialog';
import ConstantsEmptyState from './components/ConstantsEmptyState';
import ConstantsPageHeader from './components/ConstantsPageHeader';

const ENVS = [
  { id: 'dev', name: 'Development', enabled: true },
  { id: 'stg', name: 'Staging', enabled: true },
  { id: 'prod', name: 'Production', enabled: false },
];
const globalConstant = {
  id: 'c1',
  name: 'API_URL',
  type: 'Global',
  values: [
    { environment_id: 'dev', environment_name: 'Development', has_value: true, value: 'http://dev' },
    { environment_id: 'stg', environment_name: 'Staging', has_value: true, value: 'http://stg' },
  ],
};
const secretConstant = {
  ...globalConstant,
  id: 'c2',
  name: 'STRIPE_KEY',
  type: 'Secret',
  values: globalConstant.values.map((v) => ({ ...v, value: null })),
};
const fakeRequest = () => new Promise((r) => setTimeout(r, 800));

export default function ConstantsPreview() {
  const [which, setWhich] = useState(null);
  const close = (open) => !open && setWhich(null);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <ConstantsPageHeader onCreate={() => setWhich('create')} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          ['create', 'Create modal'],
          ['editGlobal', 'Edit Global'],
          ['editSecret', 'Edit Secret'],
          ['del1', 'Delete one'],
          ['del3', 'Delete three'],
        ].map(([k, label]) => (
          <Button key={k} variant="outline" onClick={() => setWhich(k)}>
            {label}
          </Button>
        ))}
      </div>
      <ConstantModal
        mode="create"
        open={which === 'create'}
        onOpenChange={close}
        environments={ENVS}
        lockedPlanName="Business"
        onSubmit={fakeRequest}
      />
      <ConstantModal
        mode="edit"
        constant={globalConstant}
        open={which === 'editGlobal'}
        onOpenChange={close}
        environments={ENVS}
        onSubmit={fakeRequest}
      />
      <ConstantModal
        mode="edit"
        constant={secretConstant}
        open={which === 'editSecret'}
        onOpenChange={close}
        environments={ENVS}
        onSubmit={fakeRequest}
      />
      <DeleteConstantsDialog
        open={which === 'del1'}
        constants={['STRIPE_SECRET_KEY']}
        onOpenChange={close}
        onConfirm={fakeRequest}
      />
      <DeleteConstantsDialog
        open={which === 'del3'}
        constants={['A', 'B', 'C']}
        onOpenChange={close}
        onConfirm={fakeRequest}
      />
      <div style={{ display: 'flex', gap: 16 }}>
        <ConstantsEmptyState variant="secret" onCreate={() => {}} />
        <ConstantsEmptyState variant="global" onCreate={() => {}} />
        <ConstantsEmptyState variant="search" query="stripe" />
      </div>
    </div>
  );
}
