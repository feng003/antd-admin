import { Button, Result, theme } from "antd";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  const { token } = theme.useToken();
  const { t } = useLingui();

  const detail = error instanceof Error ? error.message : String(error);

  return (
    <div style={{ padding: token.paddingLG, maxWidth: 560, margin: "48px auto" }}>
      <Result
        status="error"
        title={t`Something went wrong`}
        subTitle={detail || t`Please try again or return to the dashboard.`}
        extra={
          <Button type="primary" onClick={() => void router.invalidate()}>
            {t`Retry`}
          </Button>
        }
      />
    </div>
  );
}
