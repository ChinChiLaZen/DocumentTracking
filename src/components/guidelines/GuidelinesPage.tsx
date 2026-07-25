import {
  COLOUR_LEGEND,
  CRITICAL_SEQUENCE,
  DISCLAIMER,
  DOCUMENT_QUALITY_RULES,
  PRIORITY_DEFS,
} from '../../domain/rules'

export function GuidelinesPage() {
  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <h1 className="text-lg font-semibold">Guidelines</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Priority Definitions</h2>
        <dl className="space-y-1 text-sm">
          {PRIORITY_DEFS.map((def) => (
            <div key={def.id}>
              <dt className="inline font-medium">{def.label}: </dt>
              <dd className="inline text-muted-foreground">{def.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Critical Sequence</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {CRITICAL_SEQUENCE.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Document Quality</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {DOCUMENT_QUALITY_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Colour Legend</h2>
        <p className="text-sm text-muted-foreground">{COLOUR_LEGEND}</p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Disclaimer</h2>
        <p className="text-sm text-muted-foreground">{DISCLAIMER}</p>
      </section>
    </div>
  )
}
