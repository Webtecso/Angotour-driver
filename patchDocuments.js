const fs = require("fs")

function patchFile(filePath, patches) {
  const raw = fs.readFileSync(filePath, "utf8")
  const hasCRLF = raw.includes("\r\n")
  let content = raw.replace(/\r\n/g, "\n")
  for (const [label, anchor, replacement] of patches) {
    const count = content.split(anchor).length - 1
    console.log(filePath + " :: " + label + " -> ancora " + count + "x")
    if (count !== 1) {
      console.error("ABORTADO em \"" + label + "\": nada foi escrito em " + filePath)
      return false
    }
    content = content.split(anchor).join(replacement)
  }
  if (hasCRLF) content = content.replace(/\n/g, "\r\n")
  fs.writeFileSync(filePath, content, "utf8")
  console.log("OK: " + filePath + "\n")
  return true
}

patchFile("src/contexts/DriverContext.tsx", [
  ["imports",
`import { ActiveDriverTrip, DriverTripStatus, IncomingTripRequest } from '../types';
import { buildActiveTripFromRequest, mockWallet } from '../services/mockData';
import { driversApi } from '../services/api';`,
`import { ActiveDriverTrip, DriverDocumentSlot, DriverTripStatus, IncomingTripRequest } from '../types';
import { buildActiveTripFromRequest, mockDocumentSlots, mockWallet } from '../services/mockData';
import { driversApi } from '../services/api';`],

  ["interface",
`  clearActiveTrip: () => void;
  simulateIncomingTrip: (request: IncomingTripRequest) => void;
}`,
`  clearActiveTrip: () => void;
  simulateIncomingTrip: (request: IncomingTripRequest) => void;
  documentSlots: DriverDocumentSlot[];
  areDocumentsApproved: boolean;
  submitDocument: (id: string) => void;
}`],

  ["estado + computed",
`  // Carteira: por agora local. Quando o backend tiver wallet proprio do
  // motorista, isto passa a vir de GET /driver/wallet.
  const [walletAvailableKz] = useState(mockWallet.availableKz);`,
`  // Carteira: por agora local. Quando o backend tiver wallet proprio do
  // motorista, isto passa a vir de GET /driver/wallet.
  const [walletAvailableKz] = useState(mockWallet.availableKz);

  // Document Center (secoes 4, 5, 60): cada submissao fica "pending" ate
  // revisao - nunca auto-aprova. Por agora local; no backend passara a vir
  // de GET /driver/documents.
  const [documentSlots, setDocumentSlots] = useState<DriverDocumentSlot[]>(mockDocumentSlots);
  const areDocumentsApproved = documentSlots.every((d) => d.submissionStatus === 'approved');

  const submitDocument = (id: string) => {
    setDocumentSlots((prev) =>
      prev.map((d) => (d.id === id ? { ...d, submissionStatus: 'pending', rejectionReason: undefined } : d))
    );
  };`],

  ["useMemo deps + value",
`  const value = useMemo(
    () => ({
      isOnline,
      isVerifyingOnline,
      walletAvailableKz,
      incomingRequest,
      activeTrip,
      goOnline,
      goOffline,
      acceptIncomingTrip,
      declineIncomingTrip,
      markArrived,
      confirmBoarding,
      startTrip,
      completeTrip,
      clearActiveTrip,
      simulateIncomingTrip,
    }),
    [isOnline, isVerifyingOnline, walletAvailableKz, incomingRequest, activeTrip]
  );`,
`  const value = useMemo(
    () => ({
      isOnline,
      isVerifyingOnline,
      walletAvailableKz,
      incomingRequest,
      activeTrip,
      goOnline,
      goOffline,
      acceptIncomingTrip,
      declineIncomingTrip,
      markArrived,
      confirmBoarding,
      startTrip,
      completeTrip,
      clearActiveTrip,
      simulateIncomingTrip,
      documentSlots,
      areDocumentsApproved,
      submitDocument,
    }),
    [isOnline, isVerifyingOnline, walletAvailableKz, incomingRequest, activeTrip, documentSlots]
  );`],
])
