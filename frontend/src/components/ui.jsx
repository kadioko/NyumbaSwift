export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function buttonStyles({
  variant = 'primary',
  fullWidth = false,
  className = '',
} = {}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-50'
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-[0_16px_28px_rgba(15,127,95,0.22)] hover:-translate-y-0.5',
    secondary: 'border border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50',
    subtle: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  }

  return cn(base, variants[variant], fullWidth && 'w-full', className)
}

export function surfaceCard(className = '') {
  return cn('shell-card rounded-[1.75rem] p-6', className)
}

export function inputStyles(className = '') {
  return cn(
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100',
    className,
  )
}

export function leadingInputStyles(className = '') {
  return inputStyles(cn('pl-10', className))
}

export function bannerStyles(type = 'info', className = '') {
  const styles = {
    info: 'border-slate-200 bg-white/85 text-slate-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    error: 'border-red-100 bg-red-50 text-red-700',
    warning: 'border-amber-100 bg-amber-50 text-amber-800',
  }

  return cn('flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm', styles[type], className)
}

export function sectionEyebrowStyles(className = '') {
  return cn('eyebrow', className)
}

export function skeletonBlock(className = '') {
  return cn('animate-pulse rounded-2xl bg-slate-200/70', className)
}
