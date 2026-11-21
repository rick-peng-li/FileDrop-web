import { useMemo } from "react";
import { App, Button, Flex, Input, Modal, QRCode, Typography } from "antd";
import { CopyOutlined } from "@ant-design/icons";

interface ShareLinkModalProps {
  open: boolean;
  userId: string;
  onClose: () => void;
}

export default function ShareLinkModal({
  open,
  userId,
  onClose,
}: ShareLinkModalProps) {
  const { message } = App.useApp();
  const shareUrl = useMemo(
    () => `${window.location.origin}/transfer?code=${userId}`,
    [userId]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success("Link copied");
    } catch {
      message.error("Failed to copy the link");
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Share link">
      <Flex vertical gap={16} style={{ paddingTop: 8 }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Anyone with this link can make a P2P connection with you.
        </Typography.Paragraph>

        <Flex justify="center">
          <div style={{ padding: 12, border: "1px solid rgba(128,128,128,0.2)", borderRadius: 12 }}>
            <QRCode value={shareUrl} size={168} />
          </div>
        </Flex>

        <Flex gap={8}>
          <Input value={shareUrl} readOnly />
          <Button icon={<CopyOutlined />} onClick={handleCopy} aria-label="Copy share link" />
        </Flex>
      </Flex>
    </Modal>
  );
}
