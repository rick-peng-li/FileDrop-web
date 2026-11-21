import { useEffect } from "react";
import { Col, Row } from "antd";
import { useSearchParams } from "react-router-dom";
import { usePeerTransfer } from "@/hooks/usePeerTransfer";
import ConnectionCard from "@/components/transfer/ConnectionCard";
import ChatPanel from "@/components/transfer/ChatPanel";

export default function TransferPage() {
  const transfer = usePeerTransfer();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      transfer.setPartnerInput(code);
    }
  }, [code, transfer.setPartnerInput]);

  return (
    <Row gutter={[24, 24]} justify="center">
      <Col xs={24} lg={14} xl={13}>
        <ConnectionCard transfer={transfer} />
      </Col>
      <Col xs={24} lg={10} xl={11}>
        <ChatPanel transfer={transfer} />
      </Col>
    </Row>
  );
}
