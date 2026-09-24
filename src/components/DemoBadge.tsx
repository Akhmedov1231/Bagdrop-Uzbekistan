export default function DemoBadge({ label = "Demo location" }: { label?: string }) {
  return <span className="demo-pill">● {label}</span>;
}
