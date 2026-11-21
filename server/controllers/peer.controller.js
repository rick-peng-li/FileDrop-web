import { isPeerOnline } from "../models/peerStore.js";

export function getPeerStatus(req, res) {
  const { uniqueId } = req.params;

  res.json({
    uniqueId,
    online: isPeerOnline(uniqueId),
  });
}
