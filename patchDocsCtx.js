const fs = require("fs")
const L = (...lines) => lines.join("\n")
const filePath = "src/contexts/DriverContext.tsx"
const raw = fs.readFileSync(filePath, "utf8")
const hasCRLF = raw.includes("\r\n")
let content = raw.replace(/\r\n/g, "\n")

function replaceOnce(label, anchor, replacement) {
  const count = content.split(anchor).length - 1
  console.log(label + " -> ancora " + count + "x")
  if (count !== 1) { console.error("ABORTADO em " + label + ". Nada foi escrito."); process.exit(1) }
  content = content.split(anchor).join(replacement)
}

replaceOnce("import api",
  "import { driversApi, driverTripsApi, driverWalletApi, DriverTripView, DriverWalletSummary } from '../services/api';",
  "import { driversApi, driverTripsApi, driverWalletApi, driverDocumentsApi, DriverDocumentServerType, DriverTripView, DriverWalletSummary } from '../services/api';")

replaceOnce("mapa id -> tipo do servidor",
  "const DriverContext = createContext<DriverContextValue | undefined>(undefined);",
  L("// Liga os documentos do ecra (ids do mock) aos tipos que o servidor conhece.",
    "const DOC_ID_TO_TYPE: Record<string, DriverDocumentServerType> = {",
    "  'doc-bi-front': 'bi_front',",
    "  'doc-bi-back': 'bi_back',",
    "  'doc-selfie': 'selfie',",
    "  'doc-license': 'license',",
    "  'doc-vehicle-reg': 'vehicle_registration',",
    "  'doc-insurance': 'insurance',",
    "};",
    "",
    "const DriverContext = createContext<DriverContextValue | undefined>(undefined);"))

replaceOnce("interface",
  "submitDocument: (id: string) => void;",
  L("submitDocument: (id: string, imageBase64: string) => Promise<void>;", "  refreshDocuments: () => Promise<void>;"))

replaceOnce("estado inicial seguro",
  "useState<DriverDocumentSlot[]>(mockDocumentSlots)",
  "useState<DriverDocumentSlot[]>(mockDocumentSlots.map((s) => ({ ...s, submissionStatus: 'not_submitted' as const, rejectionReason: undefined })))")

// submitDocument: substitui a funcao inteira (do inicio ate ao primeiro "  };" que a fecha)
const re = /const submitDocument = \([^)]*\) => \{[\s\S]*?\n  \};\n/
const m = re.exec(content)
const total = content.split("const submitDocument = ").length - 1
console.log("submitDocument -> " + total + "x; bloco encontrado: " + (m ? "sim" : "nao"))
if (total !== 1 || !m) { console.error("ABORTADO em submitDocument. Nada foi escrito."); process.exit(1) }
console.log("--- bloco que vai ser substituido ---\n" + m[0] + "--- fim ---")
content = content.replace(re, L(
  "const refreshDocuments = async () => {",
  "    try {",
  "      const list = await driverDocumentsApi.list();",
  "      setDocumentSlots((prev) =>",
  "        prev.map((slot) => {",
  "          const server = list.find((d) => d.type === DOC_ID_TO_TYPE[slot.id]);",
  "          if (!server) return slot;",
  "          return { ...slot, submissionStatus: server.status, rejectionReason: server.rejectionReason ?? undefined };",
  "        })",
  "      );",
  "    } catch {",
  "      // sem rede: mantem o ultimo estado conhecido",
  "    }",
  "  };",
  "",
  "  // Enviar nunca aprova: o servidor guarda como \"pending\" e so um revisor aprova.",
  "  const submitDocument = async (id: string, imageBase64: string) => {",
  "    const type = DOC_ID_TO_TYPE[id];",
  "    if (!type) throw new Error('Tipo de documento desconhecido.');",
  "    const updated = await driverDocumentsApi.submit(type, imageBase64);",
  "    setDocumentSlots((prev) =>",
  "      prev.map((s) => (s.id === id ? { ...s, submissionStatus: updated.status, rejectionReason: updated.rejectionReason ?? undefined } : s))",
  "    );",
  "  };",
  ""))

replaceOnce("carregar ao iniciar sessao (junto com a carteira)",
  "if (driverId) refreshWallet();",
  "if (driverId) {\n      refreshWallet();\n      refreshDocuments();\n    }")

replaceOnce("valor do contexto",
  "      submitDocument,",
  "      submitDocument,\n      refreshDocuments,")

if (hasCRLF) content = content.replace(/\n/g, "\r\n")
fs.writeFileSync(filePath, content, "utf8")
console.log("OK: " + filePath)
