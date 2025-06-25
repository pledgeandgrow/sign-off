declare module '*/heirs/ListHeirs' {
  import { FC } from 'react';
  import { Heir } from '../types/heir';

  interface ListHeirsProps {
    heirs: Heir[];
    onEdit: (heir: Heir) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
  }

  const ListHeirs: FC<ListHeirsProps>;
  export default ListHeirs;
}

declare module '*/heirs/AddHeir' {
  import { FC } from 'react';
  import { HeirFormData } from '../types/heir';

  interface AddHeirProps {
    onSubmit: (data: HeirFormData) => void;
    onCancel: () => void;
    existingHeirs: { percentage: number }[];
  }

  const AddHeir: FC<AddHeirProps>;
  export default AddHeir;
}

declare module '*/heirs/EditHeir' {
  import { FC } from 'react';
  import { Heir, HeirFormData } from '../types/heir';

  interface EditHeirProps {
    heir: Heir;
    existingHeirs: Heir[];
    onSave: (data: HeirFormData & { id: string }) => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
  }

  const EditHeir: FC<EditHeirProps>;
  export default EditHeir;
}
