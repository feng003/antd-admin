import { Button, Flex, Space, Typography, theme } from "antd";
import { useLingui } from "@lingui/react/macro";
import { Languages } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { GitHub } from "@/components/Icon";
import { Theme } from "@/components/Icon";

const ANTD_ADMIN_REPO = "https://github.com/zuiidea/antd-admin";

export function AppFooter() {
  const { token } = theme.useToken();
  const { t } = useLingui();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode);
  const iconSize = Math.max(12, Math.round(Number(token.fontSizeSM)));

  const toggleLocale = () => {
    setLocale(locale === "en" ? "zh" : "en");
  };

  return (
    <Flex vertical align="center" style={{ textAlign: "center" }}>
      <Flex justify="center" style={{ marginBottom: token.marginSM }}>
        <Space>
          <Button
            type="text"
            size="small"
            onClick={toggleLocale}
            icon={<Languages size={token.size} />}
            aria-label={t`Switch language`}
          />
          <Button
            type="text"
            size="small"
            onClick={toggleDarkMode}
            icon={<Theme size={token.size} />}
            aria-label={t`Toggle Theme`}
          />
        </Space>
      </Flex>
      <Flex
        align="center"
        justify="center"
        wrap
        gap={4}
        style={{
          lineHeight: token.lineHeight,
        }}
      >
        <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, marginBottom: 0 }}>
          {t`Powered by`}
        </Typography.Text>
        <a
          href={ANTD_ADMIN_REPO}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: token.colorLink,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <GitHub size={iconSize} />
          antd-admin
        </a>
      </Flex>
    </Flex>
  );
}
