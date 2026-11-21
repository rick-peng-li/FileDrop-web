import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Typography,
  theme,
  type InputRef,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import type { PeerTransferState } from "@/hooks/usePeerTransfer";

interface ChatPanelProps {
  transfer: PeerTransferState;
}

export default function ChatPanel({ transfer }: ChatPanelProps) {
  const { token } = theme.useToken();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [transfer.messages]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const handleSend = () => {
    if (!draft.trim()) {
      return;
    }
    transfer.sendMessage(draft);
    setDraft("");
  };

  return (
    <Card
      title="Chat"
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Ctrl/Cmd + K
        </Typography.Text>
      }
      style={{ height: "100%" }}
      styles={{ body: { padding: 16 } }}
    >
      <Flex vertical gap={12} style={{ height: 520 }}>
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingRight: 4,
          }}
        >
          {transfer.messages.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Connect to a peer to start chatting"
              style={{ marginTop: 90 }}
            />
          ) : (
            transfer.messages.map((item) => {
              const isMine = item.sender === "me";
              return (
                <Flex key={item.id} justify={isMine ? "flex-end" : "flex-start"}>
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "8px 12px",
                      borderRadius: 12,
                      background: isMine ? token.colorPrimary : token.colorFillSecondary,
                      color: isMine ? "#ffffff" : token.colorText,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.text}
                  </div>
                </Flex>
              );
            })
          )}
        </div>

        <Flex gap={8}>
          <Input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onPressEnter={handleSend}
            placeholder={
              transfer.isConnected
                ? `Message ${transfer.connectedPeer}`
                : "No active connection"
            }
            disabled={!transfer.isConnected}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!transfer.isConnected || !draft.trim()}
            aria-label="Send message"
          />
        </Flex>
      </Flex>
    </Card>
  );
}
