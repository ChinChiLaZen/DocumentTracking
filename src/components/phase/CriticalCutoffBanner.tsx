interface CriticalCutoffBannerProps {
  heading: string
  lines: string[]
}

export function CriticalCutoffBanner({ heading, lines }: CriticalCutoffBannerProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <p className="mb-2 font-semibold">{heading}</p>
      <ol className="list-decimal space-y-1 pl-4">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </div>
  )
}
