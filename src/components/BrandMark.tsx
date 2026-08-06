export function BrandMark() {
  return (
    <div className="brand" aria-label="みちログ">
      <svg className="brand-mark" viewBox="0 0 56 40" aria-hidden="true">
        <path d="M7 32 23 8 43 31" />
        <circle cx="7" cy="32" r="4" />
        <circle cx="23" cy="8" r="4" />
        <circle className="brand-mark-end" cx="43" cy="31" r="4" />
      </svg>
      <span>みちログ</span>
    </div>
  )
}

