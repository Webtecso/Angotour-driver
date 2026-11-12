const fs = require("fs")
const p = "src/contexts/DriverContext.tsx"
const raw = fs.readFileSync(p, "utf8")
const crlf = raw.includes("\r\n")
let c = raw.replace(/\r\n/g, "\n")
if (c.includes("ja nao esta atribuida a ti")) { console.log("Ja aplicado."); process.exit(0) }
const a = "  const goOnline = () => {\n    setIsVerifyingOnline(true);"
const n = c.split(a).length - 1
console.log("goOnline -> " + n + "x")
if (n !== 1) { console.error("ABORTADO. Nada foi escrito."); process.exit(1) }
const r = `  // Se o servidor deixar de ter esta viagem activa (cancelada pelo passageiro, ou reserva
  // reatribuida por falta), a app deixa de mostrar uma viagem que ja nao existe.
  useEffect(() => {
    const id = activeTrip?.id;
    if (!id || id.startsWith('trip-') || activeTrip?.status === 'completed') return;
    let alive = true;
    const check = async () => {
      try {
        const { trip } = await driverTripsApi.active();
        if (!alive || trip) return;
        setActiveTrip(null);
        isSimulatedTripRef.current = false;
        refreshWallet();
        Alert.alert('Viagem terminada', 'Esta viagem ja nao esta atribuida a ti (foi cancelada ou reatribuida).');
      } catch {
        // sem rede: tenta no ciclo seguinte
      }
    };
    const timer = setInterval(check, 10000);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip?.id, activeTrip?.status]);

` + a
c = c.split(a).join(r)
fs.writeFileSync(p, crlf ? c.replace(/\n/g, "\r\n") : c, "utf8")
console.log("OK")
