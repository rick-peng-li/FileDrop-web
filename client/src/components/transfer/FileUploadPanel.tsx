import { useRef } from "react";
import { Button, Flex, Progress, Typography } from "antd";
import { PaperClipOutlined, SendOutlined } from "@ant-design/icons";
import type { PeerTransferState } from "@/hooks/usePeerTransfer";
import { formatFileSize, truncateString } from "@/utils/format";

interface FileUploadPanelProps {
  transfer: PeerTransferState;
}

export default function FileUploadPanel({ transfer }: FileUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Flex vertical gap={12}>
      <Typography.Text strong>Send a file</Typography.Text>

      <Flex align="center" gap={8} wrap>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(event) => transfer.selectFile(event.target.files?.[0] ?? null)}
        />
        <Button
          icon={<PaperClipOutlined />}
          onClick={() => inputRef.current?.click()}
        >
          Select File
        </Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={transfer.isSending}
          disabled={
            !transfer.selectedFile || !transfer.isConnected || transfer.isSending
          }
          onClick={transfer.sendFile}
        >
          Send
        </Button>
      </Flex>

      {transfer.selectedFile ? (
        <Typography.Text type="secondary">
          {truncateString(transfer.selectedFile.name)} ·{" "}
          {formatFileSize(transfer.selectedFile.size)}
        </Typography.Text>
      ) : null}

      {transfer.isSending || transfer.uploadProgress > 0 ? (
        <Progress
          percent={transfer.uploadProgress}
          size="small"
          status={transfer.isSending ? "active" : "success"}
        />
      ) : null}
    </Flex>
  );
}
