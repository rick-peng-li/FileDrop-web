import { Button, Dropdown, type MenuProps } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useThemeMode, type ThemeMode } from "@/context/ThemeProvider";

export default function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  const items: MenuProps["items"] = [
    {
      key: "light",
      label: "Light",
      icon: <SunOutlined />,
    },
    {
      key: "dark",
      label: "Dark",
      icon: <MoonOutlined />,
    },
  ];

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items,
        selectedKeys: [mode],
        onClick: ({ key }) => setMode(key as ThemeMode),
      }}
    >
      <Button
        type="text"
        icon={mode === "dark" ? <MoonOutlined /> : <SunOutlined />}
        aria-label="Switch theme"
      />
    </Dropdown>
  );
}
