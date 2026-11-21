import { Layout, theme } from "antd";
import { Outlet } from "react-router-dom";
import AppHeader from "@/components/common/AppHeader";

export default function MainLayout() {
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <Layout.Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <AppHeader />
      </Layout.Header>
      <Layout.Content style={{ padding: "24px 20px 48px" }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
