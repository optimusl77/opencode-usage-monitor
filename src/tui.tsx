import { Plugin } from "@opencode/plugin/tui"

const REFRESH_INTERVAL_MS = 60_000
const WARN_PERCENT = 80
const BAR_WIDTH = 10

type Meter = {
  percent: number
  limited: boolean
  resetsAt: number
}

type GoUsage = {
  rolling: Meter
  weekly: Meter
  monthly: Meter
}

type UsageLimits = {
  workspace?: {
    id: string
    name: string
  }
  go?: GoUsage
  budgets?: unknown[]
}

const METERS = [
  { key: "rolling", label: "5h" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const

function meterColor(meter: Meter, theme: any) {
  if (meter.limited || meter.percent >= 100) return theme.text.feedback.error.base
  if (meter.percent >= WARN_PERCENT) return theme.text.feedback.warning.base
  return theme.text.base
}

function meterBar(meter: Meter) {
  const percent = Math.max(0, Math.min(100, Number(meter.percent) || 0))
  const filled = meter.limited ? BAR_WIDTH : Math.round((percent / 100) * BAR_WIDTH)
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled)
}

function meterLabel(meter: Meter) {
  if (meter.limited || meter.percent >= 100) return "limit"
  return `${Math.round(meter.percent)}%`
}

function UsageRows(props: { usage: GoUsage; theme: any }) {
  return (
    <>
      {METERS.map(({ key, label }) => {
        const meter = props.usage[key]
        if (!meter) return null
        return (
          <text>
            <span style={{ fg: props.theme.text.muted }}>{label.padEnd(8)}</span>
            <span style={{ fg: meterColor(meter, props.theme) }}>{meterBar(meter)}</span>
            <span style={{ fg: props.theme.text.muted }}> {meterLabel(meter)}</span>
          </text>
        )
      })}
    </>
  )
}

function Usage(props: { context: any }) {
  const context = props.context
  const location = context.location ?? context.data.location.default()
  const usage = () =>
    (context.data.location as any).usage?.limits(location) as UsageLimits | undefined

  return (
    <box flexDirection="column">
      {usage()?.go ? (
        <>
          <text fg={context.theme.text.base}>
            <b>Usage</b>
          </text>
          <UsageRows usage={usage()!.go!} theme={context.theme} />
        </>
      ) : null}
    </box>
  )
}

export default Plugin.define({
  // OpenCode renders sidebar contributions in plugin order. Taking over the
  // built-in "Limit" section keeps this block between Context and MCP.
  id: "opencode.sidebar.limit",
  setup(context) {
    const location = context.location ?? context.data.location.default()
    const usage = (context.data.location as any).usage as
      | {
          sync: (location: any) => Promise<unknown>
          invalidate: (location: any) => void
        }
      | undefined

    const refresh = () => {
      if (!usage) return
      usage.invalidate(location)
      usage.sync(location).catch(() => {})
    }

    refresh()

    const stop = context.data.on("session.execution.succeeded", refresh)
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS)

    context.ui.slot({
      append: "sidebar.content",
      render: () => <Usage context={context} />,
    })

    return () => {
      stop()
      clearInterval(timer)
    }
  },
})
