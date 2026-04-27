import { useMemo } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { useLingui } from "@lingui/react/macro";

type MutationLifecycle<TValues> = {
  onMutate?: (values: TValues) => void;
  onSuccess?: (values: TValues) => void;
  onError?: (values: TValues) => void;
};

export type CrudToastLifecycles<TCreate, TUpdate> = {
  createLifecycle?: MutationLifecycle<TCreate>;
  updateLifecycle?: MutationLifecycle<TUpdate>;
  deleteLifecycle?: MutationLifecycle<string>;
};

export function useCrudToasts<TCreate, TUpdate>(options: {
  message: MessageInstance;
  resourceKey: string;
}): CrudToastLifecycles<TCreate, TUpdate> {
  const { message, resourceKey } = options;
  const { t } = useLingui();

  const keys = useMemo(
    () => ({
      create: `${resourceKey}-mutation-create`,
      update: `${resourceKey}-mutation-update`,
      delete: `${resourceKey}-mutation-delete`,
    }),
    [resourceKey],
  );

  return useMemo(
    () => ({
      createLifecycle: {
        onSuccess: () => {
          message.success({ content: t`Created successfully`, key: keys.create });
        },
        onError: () => {
          message.error({ content: t`Create failed`, key: keys.create });
        },
      },
      updateLifecycle: {
        onMutate: () => {
          message.loading({ content: t`Updating…`, key: keys.update, duration: 0 });
        },
        onSuccess: () => {
          message.success({ content: t`Updated successfully`, key: keys.update });
        },
        onError: () => {
          message.error({ content: t`Update failed`, key: keys.update });
        },
      },
      deleteLifecycle: {
        onMutate: () => {
          message.loading({ content: t`Deleting…`, key: keys.delete, duration: 0 });
        },
        onSuccess: () => {
          message.success({ content: t`Deleted successfully`, key: keys.delete });
        },
        onError: () => {
          message.error({ content: t`Delete failed`, key: keys.delete });
        },
      },
    }),
    [keys.create, keys.delete, keys.update, message, t],
  );
}
