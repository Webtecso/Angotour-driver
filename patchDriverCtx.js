const fs = require("fs")
const filePath = "src/contexts/DriverContext.tsx"
const raw = fs.readFileSync(filePath, "utf8")
const hasCRLF = raw.includes("\r\n")
let content = raw.replace(/\r\n/g, "\n")
const L = (...lines) => lines.join("\n")

const patches = [
  ["import Alert",
    L("import * as Location from 'expo-location';"),
    L("import * as Location from 'expo-location';", "import { Alert } from 'react-native';")],
  ["import api",
    L("import { driversApi, driverTripsApi, DriverTripView } from '../services/api';"),
    L("import { driversApi, driverTripsApi, driverWalletApi, DriverTripView, DriverWalletSummary } from '../services/api';")],
  ["interface",
    L("  walletAvailableKz: number;"),
    L("  walletAvailableKz: number;",
      "  walletReservedKz: number;",
      "  minimumOperatingBalanceKz: number;",
      "  wallet: DriverWalletSummary | null;",
      "  refreshWallet: () => Promise<void>;")],
  ["estado da carteira",
    L("  const [walletAvailableKz] = useState(mockWallet.availableKz);"),
    L("  const [wallet, setWallet] = useState<DriverWalletSummary | null>(null);",
      "  const walletAvailableKz = wallet?.availableKz ?? 0;",
      "  const minimumOperatingBalanceKz = wallet?.minimumOperatingBalanceKz ?? mockWallet.minimumOperatingBalanceKz;",
      "",
      "  const refreshWallet = async () => {",
      "    try {",
      "      setWallet(await driverWalletApi.summary());",
      "    } catch {",
      "      // sem rede: mantem o ultimo valor conhecido",
      "    }",
      "  };",
      "",
      "  useEffect(() => {",
      "    if (driverId) refreshWallet();",
      "    // eslint-disable-next-line react-hooks/exhaustive-deps",
      "  }, [driverId]);")],
  ["goOnline so depois do servidor aceitar",
    L("    setTimeout(async () => {",
      "      setIsVerifyingOnline(false);",
      "      setIsOnline(true);",
      "      try {",
      "        await driversApi.setStatus('online');",
      "      } catch {",
      "        // se o backend falhar, o motorista continua online localmente;",
      "        // o proximo heartbeat de localizacao tenta novamente",
      "      }",
      "    }, VERIFY_DURATION_MS);"),
    L("    setTimeout(async () => {",
      "      try {",
      "        // O servidor decide: sem saldo minimo responde 402 e o motorista nao fica online.",
      "        await driversApi.setStatus('online');",
      "        setIsVerifyingOnline(false);",
      "        setIsOnline(true);",
      "      } catch (e) {",
      "        setIsVerifyingOnline(false);",
      "        refreshWallet();",
      "        Alert.alert('Nao foi possivel ficar online', (e as Error).message);",
      "      }",
      "    }, VERIFY_DURATION_MS);")],
  ["refresh apos aceitar",
    L("      driverTripsApi.accept(incomingRequest.id).catch(() => {});"),
    L("      driverTripsApi.accept(incomingRequest.id).then(() => refreshWallet()).catch(() => {});")],
  ["refresh apos concluir",
    L("    setTripStatus('completed');"),
    L("    setTripStatus('completed');", "    refreshWallet();")],
  ["valor do contexto",
    L("      walletAvailableKz,"),
    L("      walletAvailableKz,",
      "      walletReservedKz: wallet?.reservedKz ?? 0,",
      "      minimumOperatingBalanceKz,",
      "      wallet,",
      "      refreshWallet,")],
  ["dependencias do useMemo",
    L("    [isOnline, isVerifyingOnline, walletAvailableKz, incomingRequest, activeTrip, documentSlots]"),
    L("    [isOnline, isVerifyingOnline, walletAvailableKz, wallet, incomingRequest, activeTrip, documentSlots]")],
]

for (const [label, anchor, replacement] of patches) {
  const count = content.split(anchor).length - 1
  console.log(label + " -> ancora " + count + "x")
  if (count !== 1) { console.error("ABORTADO em " + label + ". Nada foi escrito."); process.exit(1) }
  content = content.split(anchor).join(replacement)
}
if (hasCRLF) content = content.replace(/\n/g, "\r\n")
fs.writeFileSync(filePath, content, "utf8")
console.log("OK: " + filePath)
