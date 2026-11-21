import { Button, Flex, Tooltip, Typography } from "antd";
import { ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={20}
      style={{ minHeight: "70vh", textAlign: "center" }}
    >
      <Typography.Title level={2} style={{ maxWidth: 780, marginBottom: 0 }}>
        Share Files Seamlessly 🌐, Connect P2P 🤝, and Chat Instantly 💬 with
        FileDrop!
      </Typography.Title>

      <Tooltip title="Ensure that both peers are online to enable file transfers.">
        <Button
          type="text"
          shape="circle"
          icon={<InfoCircleOutlined />}
          aria-label="Connection tips"
        />
      </Tooltip>

      <Button
        type="primary"
        size="large"
        icon={<ArrowRightOutlined />}
        iconPosition="end"
        onClick={() => navigate("/transfer")}
      >
        Get Started
      </Button>

      <Typography.Paragraph type="secondary" style={{ maxWidth: 560 }}>
        Transfer files directly between browsers over an encrypted peer-to-peer
        connection. No uploads, no accounts.
      </Typography.Paragraph>
    </Flex>
  );
}
