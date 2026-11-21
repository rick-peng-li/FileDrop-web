import { Button, Flex, Progress, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { PeerTransferState } from "@/hooks/usePeerTransfer";
import { truncateString } from "@/utils/format";

interface FileDownloadPanelProps {
  transfer: PeerTransferState;
}

export default function FileDownloadPanel({ transfer }: FileDownloadPanelProps) {
  if (!transfer.isReceiving && !transfer.receivedFile) {
    return null;
  }

  return (
    <Flex vertical gap={12}>
      <Typography.Text strong>Received file</Typography.Text>

      <Flex align="center" gap={8} wrap>
        <Typography.Text type="secondary">
          {transfer.isReceiving
            ? `Receiving ${truncateString(transfer.receivedFileName || "file")}...`
            : truncateString(transfer.receivedFileName || "download")}
        </Typography.Text>
        <Button
          icon={<DownloadOutlined />}
          disabled={!transfer.receivedFile || transfer.isReceiving}
          onClick={transfer.downloadReceivedFile}
        >
          Download
        </Button>
      </Flex>

      {transfer.isReceiving ? (
        <Progress percent={transfer.downloadProgress} size="small" status="active" />
      ) : null}
    </Flex>
  );
}
