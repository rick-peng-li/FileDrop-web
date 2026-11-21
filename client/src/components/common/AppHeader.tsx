import { Button, Space, Typography, theme } from "antd";
import { GithubOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useThemeMode } from "@/context/ThemeProvider";

export default function AppHeader() {
  const { mode } = useThemeMode();
  const { token } = theme.useToken();
  const logo = mode === "dark" ? "/fastdroplight.png" : "/fastdrop.png";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <img
          src={logo}
          alt="FileDrop"
          width={36}
          height={36}
          style={{ transform: "rotate(90deg)" }}
        />
        <Typography.Text strong style={{ fontSize: 20, color: token.colorText }}>
          FileDrop
        </Typography.Text>
      </Link>

      <Space size={4}>
        <Button
          type="text"
          icon={<GithubOutlined />}
          href="https://github.com/rick-peng-li/FileDrop-web"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
        />
        <ThemeToggle />
      </Space>
    </div>
  );
}
