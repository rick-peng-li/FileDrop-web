import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Divider,
  Flex,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CheckOutlined,
  CopyOutlined,
  DisconnectOutlined,
  LinkOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { PeerTransferState } from "@/hooks/usePeerTransfer";
import ShareLinkModal from "./ShareLinkModal";
import FileUploadPanel from "./FileUploadPanel";
import FileDownloadPanel from "./FileDownloadPanel";

interface ConnectionCardProps {
  transfer: PeerTransferState;
}

export default function ConnectionCard({ transfer }: ConnectionCardProps) {
  const { message } = App.useApp();
  const [isCopied, setIsCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transfer.userId);
      setIsCopied(true);
      message.success("Copied");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      message.error("Failed to copy");
    }
  };

  const statusTag = transfer.isConnected ? (
    <Tag color="success">Connected</Tag>
  ) : transfer.isConnecting ? (
    <Tag color="processing">Connecting</Tag>
  ) : (
    <Tag>Idle</Tag>
  );

  return (
    <Card
      title="P2P Connection"
      extra={statusTag}
      style={{ height: "100%" }}
      styles={{ body: { padding: 24 } }}
    >
      <Flex vertical gap={20}>
        <Flex vertical gap={6}>
          <Typography.Text type="secondary">My ID</Typography.Text>
          <Space.Compact style={{ width: "100%" }}>
            <Input value={transfer.userId} readOnly />
            <Button
              icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              aria-label="Copy ID"
            />
            <Button
              icon={<LinkOutlined />}
              onClick={() => setShareOpen(true)}
              aria-label="Share link"
            />
          </Space.Compact>
        </Flex>

        <Flex vertical gap={6}>
          <Typography.Text type="secondary">Peer`s ID</Typography.Text>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={transfer.partnerInput}
              onChange={(event) => transfer.setPartnerInput(event.target.value)}
              placeholder="Enter a 10-character Peer ID"
              disabled={transfer.isConnected || transfer.isConnecting}
              maxLength={10}
              onPressEnter={transfer.connectToPeer}
            />
            <Button
              type="primary"
              onClick={transfer.connectToPeer}
              disabled={transfer.isConnected}
              icon={transfer.isConnecting ? <LoadingOutlined /> : undefined}
            >
              Connect
            </Button>
          </Space.Compact>
        </Flex>

        {transfer.incomingCall ? (
          <Alert
            type="success"
            showIcon
            message={`Incoming connection from ${transfer.incomingCall.from}`}
            action={
              <Button size="small" type="primary" onClick={transfer.acceptIncomingCall}>
                Accept
              </Button>
            }
          />
        ) : null}

        <Flex align="center" justify="space-between" gap={12}>
          <Flex vertical gap={2}>
            <Typography.Text type="secondary">Connection Status</Typography.Text>
            <Typography.Text strong>
              {transfer.isConnected
                ? transfer.connectedPeer
                : transfer.isConnecting
                  ? "Waiting for the peer to accept..."
                  : "No connection"}
            </Typography.Text>
          </Flex>
          {transfer.isConnected ? (
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={transfer.terminateConnection}
            >
              Terminate
            </Button>
          ) : null}
        </Flex>

        <Divider style={{ margin: "4px 0" }} />

        <FileUploadPanel transfer={transfer} />
        <FileDownloadPanel transfer={transfer} />
      </Flex>

      <ShareLinkModal
        open={shareOpen}
        userId={transfer.userId}
        onClose={() => setShareOpen(false)}
      />
    </Card>
  );
}
